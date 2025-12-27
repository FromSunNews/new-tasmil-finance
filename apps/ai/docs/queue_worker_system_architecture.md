# Queue and Worker System Architecture - End-to-End Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Run Lifecycle](#run-lifecycle)
4. [Queue System Architecture](#queue-system-architecture)
5. [Worker System Architecture](#worker-system-architecture)
6. [Wake-Up Mechanism](#wake-up-mechanism)
7. [Sweep and Recovery](#sweep-and-recovery)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Key Database Tables](#key-database-tables)
10. [Redis Keys and Channels](#redis-keys-and-channels)

---

## System Overview

The LangGraph system uses a **producer-consumer pattern** with:
- **PostgreSQL** as the persistent storage for runs, threads, and checkpoints
- **Redis** as the message queue and coordination layer
- **Background workers** that execute graph runs asynchronously
- **API endpoints** that create runs and stream results

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│  API Server  │────────▶│  PostgreSQL │
│  (HTTP)     │◀────────│  (FastAPI)   │◀────────│  (Storage)  │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         ▲
                               │                         │
                               ▼                         │
                        ┌──────────────┐                 │
                        │    Redis     │                 │
                        │   (Queue)    │                 │
                        └──────────────┘                 │
                               │                         │
                               │ wake_up_worker()        │
                               ▼                         │
                        ┌──────────────┐                 │
                        │   Workers    │─────────────────┘
                        │  (Background)│
                        └──────────────┘
```

---

## Core Components

### 1. **API Layer** (`api/api/runs.py`)
- Receives HTTP requests to create/manage runs
- Validates input and creates run records
- Returns streaming responses to clients

### 2. **Storage Layer** (`storage/ops.py`)
- `Runs` class: Manages run CRUD operations
- `Threads` class: Manages thread state
- `Runs.put()`: Creates new runs in the database
- `Runs.next()`: Fetches the next available run for workers

### 3. **Queue Manager** (`storage/queue.py`)
- Orchestrates the worker pool
- Manages concurrency with semaphores
- Periodically sweeps stuck runs
- Handles worker lifecycle

### 4. **Worker Executor** (`api/worker.py`)
- Executes individual runs
- Handles retries and error recovery
- Updates run status and thread state
- Manages checkpoints

### 5. **Database** (PostgreSQL)
- `run` table: Stores run metadata and status
- `thread` table: Stores thread state
- `checkpoints` table: Stores graph execution state

### 6. **Message Queue** (Redis)
- `LIST_RUN_QUEUE`: Queue for worker notifications
- `STRING_RUN_RUNNING`: Heartbeat keys for active runs
- `STRING_RUN_CONTROL`: Control signals for cancellation
- `CHANNEL_RUN_CONTROL`: Pub/sub for run control

---

## Run Lifecycle

### States
A run progresses through these states:

```
pending → running → success/error/interrupted/timeout
   ↓         ↓
   └─────────┴──→ retry (on retriable errors)
```

### State Transitions

| From State | To State | Trigger | Action |
|------------|----------|---------|--------|
| - | `pending` | API creates run | `Runs.put()` + `wake_up_worker()` |
| `pending` | `running` | Worker picks up | `Runs.next()` updates status |
| `running` | `success` | Execution completes | `Threads.set_joint_status()` |
| `running` | `error` | Non-retriable error | `Threads.set_joint_status()` |
| `running` | `pending` | Retriable error | `Runs.set_status()` + `wake_up_worker()` |
| `running` | `pending` | Sweep recovery | `Runs.sweep()` + `wake_up_worker()` |
| `running` | `interrupted` | User cancellation | `Runs.cancel()` |
| `running` | `timeout` | Execution timeout | `Threads.set_joint_status()` |

---

## Queue System Architecture

### Queue Initialization (`storage/lifespan.py`)

When the application starts:

```python
# storage/lifespan.py:79-80
if config.N_JOBS_PER_WORKER > 0:
    tg.create_task(queue_with_signal())
```

This starts the main queue loop that manages all workers.

### Queue Main Loop (`storage/queue.py:21-154`)

The queue loop continuously:

1. **Checks for maintenance tasks**
   - Stats collection (every `STATS_INTERVAL_SECS`)
   - Run sweeping (every `BG_JOB_HEARTBEAT * 2`)

2. **Acquires semaphore** (respects concurrency limit)

3. **Fetches next run** via `Runs.next()`

4. **Creates worker task** to execute the run

5. **Adds cleanup callback** to handle completion

### Concurrency Control

```python
# storage/queue.py:28-32
concurrency = config.N_JOBS_PER_WORKER  # e.g., 10
semaphore = asyncio.Semaphore(concurrency)

# Before creating worker
await semaphore.acquire()

# After worker completes
semaphore.release()
```

This ensures at most `N_JOBS_PER_WORKER` runs execute concurrently.

---

## Worker System Architecture

### Worker Fetching (`storage/ops.py:1320-1392`)

The `Runs.next()` method is the **bridge between queue and workers**:

```python
@staticmethod
async def next(wait: bool, limit: int = 1) -> AsyncIterator[tuple[Run, int] | None]:
    # 1. WAIT for notification (blocking)
    if wait:
        await get_redis_noretry().blpop(
            [LIST_RUN_QUEUE], timeout=BG_JOB_INTERVAL
        )
    
    # 2. FETCH pending run from database
    async with conn.execute("""
        SELECT * FROM run
        WHERE status = 'pending'
            AND created_at < now()
            AND NOT EXISTS (
                SELECT 1 FROM run r2
                WHERE r2.thread_id = run.thread_id
                    AND r2.status = 'running'
            )
        ORDER BY created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    """):
        # 3. UPDATE status to 'running'
        # 4. SET heartbeat in Redis
        # 5. RETURN run and attempt number
```

#### Key Features:

- **Blocking wait**: `blpop()` blocks until a signal arrives or timeout
- **Atomic fetch**: `FOR UPDATE SKIP LOCKED` prevents race conditions
- **Thread serialization**: Only one run per thread can be `running`
- **Heartbeat tracking**: Sets Redis key with expiration for sweep detection

### Worker Execution (`api/worker.py:67-380`)

Once a worker receives a run:

```python
async def worker(run: Run, attempt: int, main_loop) -> WorkerResult:
    # 1. SETUP logging context
    # 2. ENTER run context (listen for cancellation)
    async with Runs.enter(run_id, thread_id, main_loop, resumable) as done:
        # 3. EXECUTE graph
        stream = astream_state(run, attempt, done, ...)
        await asyncio.wait_for(
            wrap_user_errors(stream, run_id, resumable, stream_modes),
            BG_JOB_TIMEOUT_SECS
        )
    
    # 4. HANDLE result
    if exception is None:
        status = "success"
        await Threads.set_joint_status(...)
    elif isinstance(exception, RETRIABLE_EXCEPTIONS):
        status = "retry"
        await Runs.set_status(conn, run_id, "pending")  # ← Triggers wake_up_worker()
    else:
        status = "error"
        await Threads.set_joint_status(...)
    
    # 5. RETURN result (for webhooks)
    return WorkerResult(...)
```

### Worker Cleanup (`storage/queue.py:48-71`)

After each worker completes:

```python
def cleanup(task: asyncio.Task):
    WORKERS.remove(task)
    semaphore.release()  # ← Allow next worker to start
    
    result = task.result()
    if result and result["webhook"]:
        # Trigger webhook asynchronously
        hook_task = loop.create_task(webhook.call_webhook(result))
```

---

## Wake-Up Mechanism

### The `wake_up_worker()` Function

Located at `storage/ops.py:2490-2493`:

```python
async def wake_up_worker(delay: float = 0) -> None:
    if delay:
        await asyncio.sleep(delay)
    await get_redis().lpush(LIST_RUN_QUEUE, [1])
```

This **pushes a signal** to Redis, which **immediately unblocks** any worker waiting in `Runs.next()`.

### When Workers Are Woken Up

According to the comment at `storage/ops.py:1328-1331`:

```python
# all scenarios that make a run available for running need to wake_up_worker()
# - a new run is created - Runs.put()
# - a run is marked for retry - Runs.set_status()
# - a run finishes with other runs pending in same thread - Threads.set_status()
```

#### Scenario 1: New Run Created (`Runs.put()`)

```python
# storage/ops.py:1661-1669
async def consume() -> AsyncIterator[Run]:
    async for row in cur:
        yield row
        if row["run_id"] == run_id:
            # inserted run, notify queue
            if not after_seconds:
                await wake_up_worker()  # ← Immediate notification
            else:
                create_task(wake_up_worker(after_seconds))  # ← Delayed notification
```

**Why?** A new run is now available for workers to pick up.

#### Scenario 2: Run Marked for Retry (`Runs.set_status()`)

```python
# storage/ops.py:1942-1954
@staticmethod
async def set_status(conn, run_id: UUID, status: RunStatus) -> None:
    await conn.execute(
        "UPDATE run SET status = %s WHERE run_id = %s",
        (status, run_id),
    )
    if status == "pending":
        await wake_up_worker()  # ← Notify workers of retry
```

**Why?** A previously running run is now pending again (retriable error).

#### Scenario 3: Run Finishes with Pending Runs (`Threads.set_status()`)

```python
# storage/ops.py:884-937
async def set_status(conn, thread_id, checkpoint, exception):
    # Update thread status
    async with conn.execute("""
        UPDATE thread SET
            status = CASE
                WHEN EXISTS(
                    SELECT 1 FROM run
                    WHERE thread_id = %(thread_id)s
                    AND status IN ('pending', 'running')
                ) THEN 'busy'
                ELSE %(status)s
            END
        WHERE thread_id = %(thread_id)s
        RETURNING status
    """) as cur:
        async for row in cur:
            if row["status"] == "busy":
                # there's more runs for this thread, wake up the worker
                await wake_up_worker()  # ← Notify for next run in thread
```

**Why?** When `multitask_strategy != "reject"`, multiple runs can queue for the same thread. When one finishes, wake up workers to process the next one.

#### Scenario 4: Sweep Recovery (`Runs.sweep()`)

```python
# storage/ops.py:1461-1473
if to_sweep:
    await conn.execute("""
        UPDATE run
        SET status = 'pending'
        WHERE run_id = ANY(%(run_ids)s)
            AND status = 'running'
    """, {"run_ids": to_sweep})
    await wake_up_worker()  # ← Notify workers of recovered runs
```

**Why?** Runs that lost their heartbeat are recovered and need to be retried.

---

## Sweep and Recovery

### The Problem: Stuck Runs

Workers can crash or lose connection, leaving runs in `running` state indefinitely. The sweep mechanism detects and recovers these "zombie" runs.

### Heartbeat System

When a worker picks up a run:

```python
# storage/ops.py:1372-1376
await pipe.set(
    STRING_RUN_RUNNING.format(run["run_id"]),
    "1",
    ex=BG_JOB_HEARTBEAT,  # e.g., 30 seconds
)
```

This Redis key **expires automatically** if the worker doesn't refresh it.

### Sweep Process (`Runs.sweep()`)

Runs every `BG_JOB_HEARTBEAT * 2` seconds (e.g., 60 seconds):

```python
# storage/ops.py:1440-1480
@staticmethod
async def sweep(conn: AsyncConnection[DictRow]) -> list[UUID]:
    async with LuaLock(get_redis_noretry(), LOCK_RUN_SWEEP, timeout=30.0):
        # 1. FIND all runs marked as 'running' in database
        cur = await conn.execute("""
            SELECT run_id FROM run WHERE status = 'running'
        """)
        run_ids = [row["run_id"] async for row in cur]
        
        # 2. CHECK which ones have heartbeat in Redis
        exists = await get_redis().mget(
            [STRING_RUN_RUNNING.format(run_id) for run_id in run_ids]
        )
        
        # 3. IDENTIFY runs without heartbeat (stuck)
        to_sweep = [
            run_id
            for run_id, exists in zip(run_ids, exists, strict=True)
            if exists is None  # ← No heartbeat = stuck
        ]
        
        # 4. RESET stuck runs to 'pending'
        if to_sweep:
            await conn.execute("""
                UPDATE run
                SET status = 'pending'
                WHERE run_id = ANY(%(run_ids)s)
                    AND status = 'running'
            """, {"run_ids": to_sweep})
            
            # 5. WAKE UP workers to retry
            await wake_up_worker()  # ← Critical!
            
        return to_sweep
```

### Why Wake Up After Sweep?

Without `wake_up_worker()`:
- Recovered runs would sit in `pending` state
- Workers might be sleeping (waiting for next `blpop` timeout)
- Runs could be delayed by up to `BG_JOB_INTERVAL` seconds (e.g., 30s)

With `wake_up_worker()`:
- Workers are **immediately notified**
- Recovered runs start processing **right away**
- Minimizes downtime from failures

---

## Data Flow Diagrams

### Creating and Executing a Run

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API ENDPOINT (api/api/runs.py:stream_run)                   │
│    - Validates request                                          │
│    - Calls create_valid_run()                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CREATE RUN (api/models/run.py:create_valid_run)             │
│    - Calls Runs.put()                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. RUNS.PUT (storage/ops.py:1483-1671)                         │
│    - INSERT INTO run table (status='pending')                   │
│    - INSERT INTO thread table (if new)                          │
│    - await wake_up_worker() ←────────────────┐                 │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ 5. WAKE_UP_WORKER (storage/ops.py:2490)    │                 │
│    - await get_redis().lpush(LIST_RUN_QUEUE, [1])              │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ 6. REDIS                                    │                 │
│    - LIST_RUN_QUEUE: [1] ←──────────────────┘                 │
│    - Unblocks waiting workers                                  │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ 7. RUNS.NEXT (storage/ops.py:1320-1392)    │                 │
│    - blpop() returns immediately ←───────────┘                 │
│    - SELECT * FROM run WHERE status='pending'                  │
│    - UPDATE run SET status='running'                           │
│    - SET heartbeat in Redis                                    │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ 8. WORKER (api/worker.py:67-380)           │                 │
│    - Execute graph                                             │
│    - Stream events to client                                   │
│    - Handle errors/retries                                     │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ 9. COMPLETION                               │                 │
│    - Update run status (success/error)                         │
│    - Update thread state                                       │
│    - Trigger webhooks (if configured)                          │
│    - Release semaphore                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Retry Flow (Retriable Error)

```
┌─────────────────────────────────────────────────────────────────┐
│ WORKER EXECUTION                                                │
│    - Exception occurs during graph execution                    │
│    - Exception is in RETRIABLE_EXCEPTIONS                       │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ RUNS.SET_STATUS (storage/ops.py:1942)      │                 │
│    - UPDATE run SET status='pending'                           │
│    - await wake_up_worker() ←────────────────┐                 │
└─────────────────────────────────────────────┼────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ WAKE_UP_WORKER                              │                 │
│    - lpush(LIST_RUN_QUEUE, [1]) ←───────────┘                 │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ RUNS.NEXT                                   │                 │
│    - Picks up the same run again ←───────────┘                 │
│    - Increments attempt counter                                │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ WORKER RETRY                                │                 │
│    - Executes run again (attempt 2, 3, ...)                    │
│    - Max retries: BG_JOB_MAX_RETRIES                           │
└─────────────────────────────────────────────────────────────────┘
```

### Sweep Recovery Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ QUEUE LOOP (storage/queue.py:135-137)                          │
│    - Periodic check (every BG_JOB_HEARTBEAT * 2)               │
│    - Calls Runs.sweep()                                         │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ RUNS.SWEEP (storage/ops.py:1440)           │                 │
│    - SELECT run_id FROM run WHERE status='running'             │
│    - MGET heartbeat keys from Redis                            │
│    - Identify runs without heartbeat                           │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ RECOVERY                                    │                 │
│    - UPDATE run SET status='pending' WHERE run_id IN (...)     │
│    - await wake_up_worker() ←────────────────┐                 │
└─────────────────────────────────────────────┼────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ WAKE_UP_WORKER                              │                 │
│    - lpush(LIST_RUN_QUEUE, [1]) ←───────────┘                 │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ RUNS.NEXT                                   │                 │
│    - Picks up recovered runs ←───────────────┘                 │
└─────────────────────────────────────────────┼─────────────────┘
                              │                │
                              ▼                │
┌─────────────────────────────────────────────┼─────────────────┐
│ WORKER RETRY                                │                 │
│    - Executes recovered run                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Database Tables

### `run` Table

Stores all run records.

| Column | Type | Description |
|--------|------|-------------|
| `run_id` | UUID | Primary key |
| `thread_id` | UUID | Foreign key to thread |
| `assistant_id` | UUID | Foreign key to assistant |
| `status` | VARCHAR | `pending`, `running`, `success`, `error`, `interrupted`, `timeout` |
| `kwargs` | JSONB | Run configuration and parameters |
| `metadata` | JSONB | User-defined metadata |
| `multitask_strategy` | VARCHAR | `reject`, `rollback`, `interrupt`, `enqueue` |
| `created_at` | TIMESTAMP | When run was created |

**Key Queries:**

```sql
-- Fetch next pending run (Runs.next)
SELECT * FROM run
WHERE status = 'pending'
    AND created_at < now()
    AND NOT EXISTS (
        SELECT 1 FROM run r2
        WHERE r2.thread_id = run.thread_id
            AND r2.status = 'running'
    )
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- Find stuck runs (Runs.sweep)
SELECT run_id FROM run WHERE status = 'running';
```

### `thread` Table

Stores thread state and configuration.

| Column | Type | Description |
|--------|------|-------------|
| `thread_id` | UUID | Primary key |
| `status` | VARCHAR | `idle`, `busy`, `interrupted`, `error` |
| `metadata` | JSONB | Thread metadata (graph_id, assistant_id) |
| `config` | JSONB | Thread configuration |
| `values` | JSONB | Latest checkpoint values |
| `interrupts` | JSONB | Active interrupts |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

### `checkpoints` Table

Stores graph execution checkpoints.

| Column | Type | Description |
|--------|------|-------------|
| `thread_id` | UUID | Foreign key to thread |
| `checkpoint_ns` | VARCHAR | Checkpoint namespace |
| `checkpoint_id` | VARCHAR | Checkpoint identifier |
| `parent_checkpoint_id` | VARCHAR | Parent checkpoint |
| `checkpoint` | JSONB | Checkpoint data |
| `metadata` | JSONB | Checkpoint metadata |

---

## Redis Keys and Channels

### Lists (Queues)

| Key | Purpose | Operations |
|-----|---------|------------|
| `LIST_RUN_QUEUE` | Worker notification queue | `lpush()` to wake, `blpop()` to wait |

### Strings (Heartbeats)

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `STRING_RUN_RUNNING:{run_id}` | Worker heartbeat | `BG_JOB_HEARTBEAT` (e.g., 30s) |
| `STRING_RUN_ATTEMPT:{run_id}` | Attempt counter | 60s |
| `STRING_RUN_CONTROL:{run_id}` | Cancellation signal | 60s |

### Pub/Sub Channels

| Channel Pattern | Purpose |
|-----------------|---------|
| `CHANNEL_RUN_CONTROL:{run_id}` | Real-time cancellation notifications |

### Lock Keys

| Key | Purpose |
|-----|---------|
| `LOCK_RUN_SWEEP` | Prevents concurrent sweep operations |

---

## Configuration Parameters

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `N_JOBS_PER_WORKER` | 10 | Max concurrent runs per worker process |
| `BG_JOB_HEARTBEAT` | 30 | Heartbeat interval (seconds) |
| `BG_JOB_INTERVAL` | 30 | Queue check interval (seconds) |
| `BG_JOB_MAX_RETRIES` | 3 | Max retry attempts |
| `BG_JOB_TIMEOUT_SECS` | 300 | Run execution timeout (seconds) |
| `BG_JOB_ISOLATED_LOOPS` | false | Use isolated event loops per run |
| `STATS_INTERVAL_SECS` | 60 | Stats logging interval |

---

## Summary

### Key Takeaways

1. **Producer-Consumer Pattern**: API creates runs (producer), workers execute them (consumer)

2. **Redis as Signal Bus**: `wake_up_worker()` pushes to Redis list, `Runs.next()` blocks on it

3. **Atomic Operations**: Database transactions and `FOR UPDATE SKIP LOCKED` prevent race conditions

4. **Heartbeat System**: Redis keys with TTL detect crashed workers

5. **Sweep Recovery**: Periodic sweeps reset stuck runs and wake workers

6. **Concurrency Control**: Semaphores limit concurrent executions

7. **Thread Serialization**: Only one run per thread executes at a time (unless multitask_strategy allows)

8. **Retry Mechanism**: Retriable errors automatically retry with exponential backoff

### Critical Wake-Up Points

Every time a run becomes available, `wake_up_worker()` **must** be called:

1. ✅ New run created → `Runs.put()`
2. ✅ Run marked for retry → `Runs.set_status()`
3. ✅ Run finishes with pending runs → `Threads.set_status()`
4. ✅ Stuck runs recovered → `Runs.sweep()`

Without these wake-ups, runs would wait idle until the next periodic check, degrading system responsiveness.

---

## Appendix: Code References

### Main Files

- **Queue Manager**: `storage/queue.py`
- **Worker Executor**: `api/worker.py`
- **Run Operations**: `storage/ops.py` (Runs class)
- **Thread Operations**: `storage/ops.py` (Threads class)
- **API Endpoints**: `api/api/runs.py`
- **Lifespan**: `storage/lifespan.py`

### Key Functions

- `wake_up_worker()`: `storage/ops.py:2490`
- `Runs.next()`: `storage/ops.py:1320`
- `Runs.put()`: `storage/ops.py:1483`
- `Runs.sweep()`: `storage/ops.py:1440`
- `Runs.set_status()`: `storage/ops.py:1942`
- `Threads.set_status()`: `storage/ops.py:884`
- `worker()`: `api/worker.py:67`
- `queue()`: `storage/queue.py:21`

---

**Last Updated**: 2025-12-25
