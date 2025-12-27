# Queue and Worker System - Comprehensive Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Data Flow](#data-flow)
4. [Queue System Deep Dive](#queue-system-deep-dive)
5. [Worker System Deep Dive](#worker-system-deep-dive)
6. [Run Lifecycle](#run-lifecycle)
7. [Redis Integration](#redis-integration)
8. [PostgreSQL Integration](#postgresql-integration)
9. [Concurrency Control](#concurrency-control)
10. [Error Handling and Retry Logic](#error-handling-and-retry-logic)
11. [Monitoring and Maintenance](#monitoring-and-maintenance)
12. [Stream Management](#stream-management)

---

## System Overview

The LangGraph queue and worker system is a **distributed task execution framework** that manages the lifecycle of graph runs (executions) in a scalable, fault-tolerant manner. The system uses:

- **PostgreSQL** as the source of truth for run state and metadata
- **Redis** as a lightweight notification/signaling layer for worker coordination
- **In-memory queues** for real-time streaming of run events
- **Asyncio-based workers** for concurrent execution of multiple runs

### Key Design Principles

1. **PostgreSQL as Source of Truth**: All persistent state lives in PostgreSQL
2. **Redis for Coordination**: Redis is used only for ephemeral signaling, not state storage
3. **Optimistic Concurrency**: Workers compete for runs using database-level locking
4. **Graceful Degradation**: System continues to function even if Redis is temporarily unavailable
5. **Horizontal Scalability**: Multiple worker processes can run in parallel

---

## Architecture Components

### 1. Queue Scheduler (`storage/queue.py`)

The queue scheduler is the **orchestrator** that continuously:
- Monitors for available runs in the database
- Manages worker concurrency limits
- Spawns worker tasks to execute runs
- Performs periodic maintenance (stats, sweeping)

**Location**: `storage/queue.py::queue()`

### 2. Worker Executor (`api/worker.py`)

The worker is the **execution engine** that:
- Picks up a run from the queue
- Executes the graph with the provided configuration
- Handles errors, retries, and timeouts
- Updates run status in the database
- Manages checkpointing for resumability

**Location**: `api/worker.py::worker()`

### 3. Run Operations (`storage/ops.py`)

The Runs class provides **database operations** for:
- Creating runs (`Runs.put`)
- Fetching the next run (`Runs.next`)
- Managing run lifecycle (`Runs.enter`)
- Updating run status (`Runs.set_status`)
- Sweeping stale runs (`Runs.sweep`)
- Collecting statistics (`Runs.stats`)

**Location**: `storage/ops.py::Runs`

### 4. Redis Coordination (`storage/redis.py`)

Redis provides **lightweight signaling** through:
- A list-based queue for worker wake-up notifications
- Ephemeral keys for tracking running status
- Attempt counters for retry logic
- Distributed locks for sweep operations

**Location**: `storage/redis.py`

### 5. Stream Manager (`storage/inmem_stream.py`)

The stream manager handles **real-time event streaming**:
- In-memory queues for streaming run events to clients
- Control queues for run cancellation/interruption
- Message persistence for resumable streams

**Location**: `storage/inmem_stream.py::StreamManager`

---

## Data Flow

### High-Level Flow Diagram

```
┌─────────────┐
│   Client    │
│  (API Call) │
└──────┬──────┘
       │
       │ 1. Create Run Request
       ▼
┌─────────────────────────────────────┐
│         API Endpoint                │
│  (e.g., POST /threads/{id}/runs)    │
└──────┬──────────────────────────────┘
       │
       │ 2. Runs.put()
       ▼
┌─────────────────────────────────────┐
│        PostgreSQL Database          │
│  ┌─────────────────────────────┐   │
│  │  INSERT INTO run            │   │
│  │  status = 'pending'         │   │
│  │  created_at = now()         │   │
│  └─────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       │ 3. wake_up_worker()
       ▼
┌─────────────────────────────────────┐
│         Redis (Notification)        │
│  ┌─────────────────────────────┐   │
│  │  LPUSH run:queue [1]        │   │
│  └─────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       │ 4. Wake up signal
       ▼
┌─────────────────────────────────────┐
│      Queue Scheduler (queue())      │
│  ┌─────────────────────────────┐   │
│  │  BLPOP run:queue            │   │
│  │  (blocking wait)            │   │
│  └─────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       │ 5. Runs.next()
       ▼
┌─────────────────────────────────────┐
│        PostgreSQL Database          │
│  ┌─────────────────────────────┐   │
│  │  UPDATE run                 │   │
│  │  SET status = 'running'     │   │
│  │  WHERE status = 'pending'   │   │
│  │  AND no inflight runs       │   │
│  │  RETURNING run.*            │   │
│  └─────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       │ 6. Spawn worker task
       ▼
┌─────────────────────────────────────┐
│       Worker (worker.worker())      │
│  ┌─────────────────────────────┐   │
│  │  1. Set Redis heartbeat     │   │
│  │  2. Execute graph           │   │
│  │  3. Stream events           │   │
│  │  4. Handle errors           │   │
│  │  5. Update final status     │   │
│  └─────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       │ 7. Update status
       ▼
┌─────────────────────────────────────┐
│        PostgreSQL Database          │
│  ┌─────────────────────────────┐   │
│  │  Thread.set_joint_status()  │   │
│  │  status = 'success'/'error' │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Queue System Deep Dive

### Queue Scheduler Main Loop

**File**: `storage/queue.py::queue()`

The queue scheduler runs an **infinite loop** that:

#### 1. **Concurrency Control**
```python
concurrency = config.N_JOBS_PER_WORKER  # Max concurrent workers
semaphore = asyncio.Semaphore(concurrency)
```

- Uses an asyncio semaphore to limit concurrent workers
- Default: Based on `N_JOBS_PER_WORKER` configuration
- Prevents resource exhaustion

#### 2. **Wait for Available Run**
```python
await semaphore.acquire()  # Block if at max concurrency
async with ops.Runs.next(wait=wait, limit=1) as result:
```

**Two modes**:
- **Wait mode** (`wait=True`): Blocks on Redis `BLPOP` until a run is available
- **Poll mode** (`wait=False`): Immediately checks for runs without blocking

**When to wait**:
- Wait if no run was found in the previous iteration
- Don't wait on first iteration or if a run was just processed

#### 3. **Fetch Next Run from Database**

The `Runs.next()` method performs an **atomic database operation**:

```sql
WITH selected AS (
    SELECT *
    FROM run
    WHERE run.status = 'pending'
        AND run.created_at < now()  -- Respect after_seconds delay
        AND NOT EXISTS (
            SELECT 1 FROM run r2
            WHERE r2.thread_id = run.thread_id
                AND r2.status = 'running'
        )  -- Ensure no other run is running in same thread
    ORDER BY run.created_at
    LIMIT 1
)
UPDATE run SET status = 'running'
FROM selected
WHERE run.run_id = selected.run_id
RETURNING run.*;
```

**Key constraints**:
- Only select `pending` runs
- Respect `created_at` (for delayed runs with `after_seconds`)
- **Thread exclusivity**: Only one run per thread can be running at a time
- FIFO ordering by `created_at`

#### 4. **Track Run Attempt**

After fetching a run, Redis is updated:

```python
await pipe.set(
    STRING_RUN_RUNNING.format(run["run_id"]),
    "1",
    ex=BG_JOB_HEARTBEAT,  # Expires after heartbeat interval
)
await pipe.incrby(STRING_RUN_ATTEMPT.format(run["run_id"]), 1)
```

**Purpose**:
- `STRING_RUN_RUNNING`: Heartbeat key that expires if worker dies
- `STRING_RUN_ATTEMPT`: Tracks retry attempts (1 = first attempt, 2 = first retry, etc.)

#### 5. **Spawn Worker Task**

```python
task = asyncio.create_task(
    worker.worker(run, attempt, loop),
    name=f"run-{run['run_id']}-attempt-{attempt}",
)
task.add_done_callback(cleanup)
WORKERS.add(task)
```

- Creates an asyncio task for the worker
- Adds cleanup callback to handle completion
- Tracks active workers in a set

#### 6. **Periodic Maintenance**

The scheduler performs two maintenance tasks:

**a) Statistics Collection**
```python
if calc_stats := (
    last_stats_secs is None
    or loop.time() - last_stats_secs > config.STATS_INTERVAL_SECS
):
    stats = await ops.Runs.stats(conn)
    await logger.ainfo("Queue stats", **stats)
```

Logs:
- Number of pending runs
- Number of running runs
- Minimum age of oldest pending run
- Median age of pending runs

**b) Run Sweeping**
```python
if do_sweep := (
    last_sweep_secs is None
    or loop.time() - last_sweep_secs > config.BG_JOB_HEARTBEAT * 2
):
    await ops.Runs.sweep(conn=conn)
```

Sweeps runs that are stuck in `running` state (see [Sweeping](#run-sweeping) section).

#### 7. **Cleanup Callback**

When a worker task completes:

```python
def cleanup(task: asyncio.Task):
    WORKERS.remove(task)
    semaphore.release()  # Allow next worker to start
    
    result = task.result()
    if result and result["webhook"]:
        # Trigger webhook asynchronously
        hook_task = loop.create_task(webhook.call_webhook(result))
```

- Releases semaphore to allow next worker
- Triggers webhook if configured
- Logs any exceptions

---

## Worker System Deep Dive

### Worker Execution Flow

**File**: `api/worker.py::worker()`

The worker is responsible for **executing a single run** from start to finish.

#### Phase 1: Initialization

```python
async def worker(
    run: Run,
    attempt: int,
    main_loop: asyncio.AbstractEventLoop,
) -> WorkerResult:
```

**Inputs**:
- `run`: The run object from the database
- `attempt`: Attempt number (1 = first attempt, 2 = first retry, etc.)
- `main_loop`: Reference to the main event loop

**Setup**:
1. Extract configuration from `run["kwargs"]`
2. Set logging context (run_id, thread_id, assistant_id, graph_id)
3. Initialize timing metrics
4. Determine if run is temporary or resumable

#### Phase 2: Enter Run Context

```python
async with Runs.enter(run_id, run["thread_id"], main_loop, resumable) as done:
```

**`Runs.enter()` responsibilities**:

1. **Create control queue** for cancellation signals
```python
control_queue = await stream_manager.add_control_queue(run_id, thread_id)
```

2. **Listen for cancellation** in background task
```python
tg.create_task(
    listen_for_cancellation(control_queue, run_id, thread_id, done)
)
```

3. **Provide `done` event** to worker for signaling completion

4. **Cleanup on exit**:
   - Send "done" message to control queue
   - Send "done" message to stream
   - Remove control queue

#### Phase 3: Execute Graph

```python
if temporary:
    stream = astream_state(run, attempt, done)
else:
    stream = astream_state(
        run,
        attempt,
        done,
        on_checkpoint=on_checkpoint,  # Save checkpoints
        on_task_result=on_task_result,  # Update task results
    )

await asyncio.wait_for(
    wrap_user_errors(stream, run_id, resumable, stream_modes),
    BG_JOB_TIMEOUT_SECS,  # Global timeout
)
```

**Key aspects**:

- **Temporary runs**: No checkpointing, faster execution
- **Stateful runs**: Checkpoint after each step for resumability
- **Timeout**: Enforced at `BG_JOB_TIMEOUT_SECS` (default: configurable)
- **Stream modes**: Controls what events are streamed (values, updates, debug, etc.)

**Checkpoint callback**:
```python
def on_checkpoint(checkpoint_arg: CheckpointPayload | None):
    nonlocal checkpoint
    checkpoint = checkpoint_arg  # Save for webhook
```

**Task result callback**:
```python
def on_task_result(task_result: TaskResultPayload):
    # Update checkpoint with task results
    for task in checkpoint["tasks"]:
        if task["id"] == task_result["id"]:
            task.update(task_result)
```

#### Phase 4: Error Handling

The worker catches and categorizes exceptions:

```python
try:
    await consume(stream, run_id, resumable, stream_modes, thread_id=run["thread_id"])
except Exception as e:
    if isinstance(e, TimeoutError):
        raise UserTimeout(e) from e  # Convert to custom timeout
    raise
```

**Exception types**:
- `TimeoutError`: Converted to `UserTimeout` to distinguish from asyncio timeouts
- `UserRollback`: User-initiated rollback
- `UserInterrupt`: User-initiated interruption
- `RETRIABLE_EXCEPTIONS`: Network errors, database errors, etc.
- Other exceptions: Treated as permanent errors

#### Phase 5: Status Update

After execution (success or failure), update the database:

```python
async with connect() as conn:
    if exception is None:
        status = "success"
        await Threads.set_joint_status(
            conn, run["thread_id"], run_id, status,
            graph_id=graph_id, checkpoint=checkpoint
        )
    elif isinstance(exception, TimeoutError):
        status = "timeout"
        await Threads.set_joint_status(...)
    elif isinstance(exception, UserRollback):
        status = "rollback"
        await Threads.set_joint_status(...)
    elif isinstance(exception, UserInterrupt):
        status = "interrupted"
        await Threads.set_joint_status(...)
    elif isinstance(exception, ALL_RETRIABLE_EXCEPTIONS):
        status = "retry"
        await Runs.set_status(conn, run_id, "pending")  # Re-queue
    else:
        status = "error"
        await Threads.set_joint_status(...)
```

**`Threads.set_joint_status()` does**:
1. Updates thread status (idle/busy)
2. Updates run status (success/error/interrupted/etc.)
3. Saves checkpoint to database
4. Saves exception details if applicable
5. Triggers next pending run in the same thread (if any)

#### Phase 6: Retry Logic

If the exception is retriable:

```python
if isinstance(exception, ALL_RETRIABLE_EXCEPTIONS):
    await Runs.set_status(conn, run_id, "pending")
    await wake_up_worker()  # Notify queue scheduler
    raise exception  # Re-raise to prevent marking as done
```

**Retry flow**:
1. Set run status back to `pending`
2. Wake up worker to re-queue the run
3. Re-raise exception so `Runs.enter` doesn't mark as done
4. Next iteration will increment attempt counter

**Max retries**:
```python
if attempt > BG_JOB_MAX_RETRIES:
    raise RuntimeError(f"Run {run['run_id']} exceeded max attempts")
```

#### Phase 7: Temporary Run Cleanup

For temporary runs (stateless):

```python
if temporary and not isinstance(exception, ALL_RETRIABLE_EXCEPTIONS):
    # Delete the thread (cascades to run)
    async for _ in await Threads.delete(conn, run["thread_id"]):
        pass
```

Temporary runs are deleted after completion (success or permanent failure).

#### Phase 8: Return Result

```python
return WorkerResult(
    checkpoint=checkpoint,
    status=status,
    exception=exception,
    run=run,
    webhook=webhook,
    run_started_at=run_started_at,
    run_ended_at=run_ended_at,
)
```

This result is used by the cleanup callback to trigger webhooks.

---

## Run Lifecycle

### State Diagram

```
┌─────────┐
│ Created │
│ (API)   │
└────┬────┘
     │
     │ Runs.put()
     ▼
┌─────────┐
│ pending │ ◄──────────────────┐
└────┬────┘                    │
     │                         │
     │ Runs.next()             │ Retry
     ▼                         │
┌─────────┐                    │
│ running │ ───────────────────┘
└────┬────┘     (retriable error)
     │
     │ Worker completes
     ▼
┌──────────────────────────────┐
│  Final States:               │
│  - success                   │
│  - error                     │
│  - timeout                   │
│  - interrupted               │
│  - rollback                  │
└──────────────────────────────┘
```

### Status Transitions

| From State | To State | Trigger | Description |
|------------|----------|---------|-------------|
| `pending` | `running` | `Runs.next()` | Queue scheduler picks up run |
| `running` | `pending` | Retriable error | Worker encounters network/DB error |
| `running` | `pending` | `Runs.sweep()` | Worker died, run is swept back to pending |
| `running` | `success` | Normal completion | Graph executed successfully |
| `running` | `error` | Permanent error | Graph encountered unrecoverable error |
| `running` | `timeout` | Timeout | Execution exceeded `BG_JOB_TIMEOUT_SECS` |
| `running` | `interrupted` | User interrupt | User sent interrupt signal |
| `running` | `rollback` | User rollback | User sent rollback signal |

---

## Redis Integration

### Redis Keys

**File**: `storage/redis.py`

| Key Pattern | Type | Purpose | TTL |
|-------------|------|---------|-----|
| `run:queue` | List | Worker wake-up notifications | N/A (ephemeral) |
| `run:{run_id}:running` | String | Heartbeat to detect dead workers | `BG_JOB_HEARTBEAT` |
| `run:{run_id}:attempt` | String | Retry attempt counter | 60 seconds |
| `run:sweep` | Lock | Distributed lock for sweep operation | 30 seconds |

### Wake-Up Mechanism

**Purpose**: Notify queue scheduler that a new run is available

**Implementation**:
```python
async def wake_up_worker(delay: float = 0) -> None:
    if delay:
        await asyncio.sleep(delay)
    await get_redis().lpush(LIST_RUN_QUEUE, [1])
```

**Called when**:
1. New run is created (`Runs.put`)
2. Run is marked for retry (`Runs.set_status`)
3. Run completes and next run in thread is available (`Threads.set_joint_status`)
4. Runs are swept back to pending (`Runs.sweep`)

**Queue scheduler waits**:
```python
await get_redis_noretry().blpop(
    [LIST_RUN_QUEUE], 
    timeout=BG_JOB_INTERVAL
)
```

**Behavior**:
- Blocks until a value is pushed to the list
- Times out after `BG_JOB_INTERVAL` seconds (default: 5s)
- On timeout, checks for runs anyway (fallback mechanism)
- If Redis is down, yields `None` and continues (graceful degradation)

### Heartbeat Mechanism

**Purpose**: Detect when a worker dies unexpectedly

**Set on run start**:
```python
await pipe.set(
    STRING_RUN_RUNNING.format(run["run_id"]),
    "1",
    ex=BG_JOB_HEARTBEAT,  # Auto-expires
)
```

**Checked during sweep**:
```python
exists = await get_redis().mget(
    [STRING_RUN_RUNNING.format(run_id) for run_id in run_ids]
)
to_sweep = [
    run_id for run_id, exists in zip(run_ids, exists, strict=True)
    if exists is None  # Key expired = worker died
]
```

**Why it works**:
- Key expires after `BG_JOB_HEARTBEAT` seconds
- If worker is alive, it holds the key
- If worker dies, key expires and sweep detects it
- Sweep resets run to `pending` for retry

### Attempt Counter

**Purpose**: Track retry attempts

**Increment on each attempt**:
```python
await pipe.incrby(STRING_RUN_ATTEMPT.format(run["run_id"]), 1)
await pipe.expire(STRING_RUN_ATTEMPT.format(run["run_id"]), 60)
```

**Used to enforce max retries**:
```python
if attempt > BG_JOB_MAX_RETRIES:
    raise RuntimeError("Exceeded max attempts")
```

---

## PostgreSQL Integration

### Database Schema

**File**: `storage/migrations/0000029_create_run.up.sql`

```sql
CREATE TABLE run (
    run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES thread(thread_id) ON DELETE CASCADE,
    assistant_id uuid NOT NULL REFERENCES assistant(assistant_id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    kwargs jsonb NOT NULL,
    multitask_strategy text DEFAULT 'reject'::text NOT NULL
);
```

**Indexes**:
```sql
-- Optimize fetching next pending run
CREATE INDEX run_pending_idx ON run (created_at) 
WHERE (status = 'pending');

-- Optimize thread exclusivity check
CREATE INDEX run_thread_id_status_idx ON run (thread_id, status);

-- Optimize metadata filtering
CREATE INDEX run_metadata_idx ON run USING gin (metadata jsonb_path_ops);
```

### Key Database Operations

#### 1. Create Run (`Runs.put`)

**Complex CTE query**:
1. Insert thread if it doesn't exist
2. Check for inflight runs (if `prevent_insert_if_inflight=True`)
3. Insert run with merged configuration
4. Update thread status to `busy`
5. Return created run

**Concurrency handling**:
- Uses `ON CONFLICT DO NOTHING` for thread creation
- Uses `INSERT ... SELECT` with conditions for run creation
- Atomic operation prevents race conditions

#### 2. Fetch Next Run (`Runs.next`)

**Atomic UPDATE ... RETURNING**:
```sql
WITH selected AS (
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
)
UPDATE run SET status = 'running'
FROM selected
WHERE run.run_id = selected.run_id
RETURNING run.*;
```

**Why this works**:
- `UPDATE` locks the row
- Multiple workers can run this concurrently
- Only one worker will successfully update each run
- Others will get no rows (graceful failure)

#### 3. Update Status (`Threads.set_joint_status`)

**Updates both thread and run**:
```sql
-- Update run status
UPDATE run SET status = %s WHERE run_id = %s;

-- Update thread status
UPDATE thread SET status = 'idle' WHERE thread_id = %s;

-- Save checkpoint (if applicable)
INSERT INTO checkpoint (...) VALUES (...);

-- Trigger next run in thread (if any)
UPDATE run SET status = 'pending'
WHERE thread_id = %s AND status = 'pending'
ORDER BY created_at LIMIT 1;
```

**Atomicity**:
- All operations in a single transaction
- Ensures consistency between thread and run states

#### 4. Sweep Stale Runs (`Runs.sweep`)

**Two-phase operation**:

**Phase 1: Find stale runs**
```sql
SELECT run_id FROM run WHERE status = 'running';
```

**Phase 2: Check Redis heartbeat**
```python
exists = await get_redis().mget(
    [STRING_RUN_RUNNING.format(run_id) for run_id in run_ids]
)
to_sweep = [run_id for run_id, exists in zip(...) if exists is None]
```

**Phase 3: Reset to pending**
```sql
UPDATE run SET status = 'pending'
WHERE run_id = ANY(%(run_ids)s) AND status = 'running';
```

**Distributed lock**:
```python
async with LuaLock(get_redis_noretry(), LOCK_RUN_SWEEP, timeout=30.0):
    # Sweep logic
```

Prevents multiple workers from sweeping simultaneously.

---

## Concurrency Control

### Thread Exclusivity

**Rule**: Only one run per thread can be `running` at a time.

**Enforced in `Runs.next()`**:
```sql
AND NOT EXISTS (
    SELECT 1 FROM run r2
    WHERE r2.thread_id = run.thread_id
        AND r2.status = 'running'
)
```

**Why**:
- Ensures sequential execution within a thread
- Prevents race conditions on shared state
- Maintains checkpoint consistency

### Multitask Strategy

**Configured per run**:
```python
multitask_strategy: MultitaskStrategy = "reject" | "rollback" | "interrupt" | "enqueue"
```

**Behavior when creating a run with inflight runs**:

| Strategy | Behavior |
|----------|----------|
| `reject` | Reject new run creation (HTTP 409) |
| `rollback` | Rollback inflight run, start new run |
| `interrupt` | Interrupt inflight run, start new run |
| `enqueue` | Queue new run, start after inflight completes |

**Implementation** (in `Runs.put`):
```python
if prevent_insert_if_inflight:
    query += " AND NOT EXISTS (SELECT 1 FROM inflight_runs)"
```

### Worker Concurrency

**Semaphore-based limiting**:
```python
concurrency = config.N_JOBS_PER_WORKER
semaphore = asyncio.Semaphore(concurrency)

await semaphore.acquire()  # Block if at max
# ... spawn worker ...
semaphore.release()  # Allow next worker
```

**Configuration**:
- `N_JOBS_PER_WORKER`: Max concurrent workers per process
- Default: Based on CPU cores and workload type

**Horizontal scaling**:
- Multiple queue processes can run in parallel
- Each process has its own worker pool
- Database ensures no duplicate processing

---

## Error Handling and Retry Logic

### Exception Categories

#### 1. Retriable Exceptions

**Definition**:
```python
RETRIABLE_EXCEPTIONS = (
    psycopg.errors.OperationalError,  # Database connection errors
    psycopg.errors.InterfaceError,
    coredis.exceptions.ConnectionError,  # Redis connection errors
    httpx.TimeoutException,  # HTTP timeouts
    # ... more network/transient errors
)

ALL_RETRIABLE_EXCEPTIONS = (asyncio.CancelledError, *RETRIABLE_EXCEPTIONS)
```

**Behavior**:
- Run status set back to `pending`
- Attempt counter incremented
- Worker wakes up queue scheduler
- Run is retried up to `BG_JOB_MAX_RETRIES` times

#### 2. User-Initiated Exceptions

**`UserInterrupt`**:
- User sends interrupt signal via API
- Run status set to `interrupted`
- Checkpoint saved for resumption
- No retry

**`UserRollback`**:
- User sends rollback signal via API
- Run status set to `rollback`
- Checkpoint discarded
- No retry

#### 3. Timeout

**`TimeoutError`**:
- Run exceeds `BG_JOB_TIMEOUT_SECS`
- Run status set to `timeout`
- Checkpoint saved (if available)
- No retry

**User timeout vs. asyncio timeout**:
```python
if isinstance(e, TimeoutError):
    raise UserTimeout(e) from e  # Convert to custom class
```

This distinguishes user code timeouts from asyncio timeouts.

#### 4. Permanent Errors

**Any other exception**:
- Run status set to `error`
- Exception details saved to database
- Checkpoint saved (if available)
- No retry

### Retry Flow

```
┌─────────────┐
│ Attempt 1   │
│ (running)   │
└──────┬──────┘
       │
       │ Network error (retriable)
       ▼
┌─────────────┐
│ Set pending │
│ attempt=2   │
└──────┬──────┘
       │
       │ wake_up_worker()
       ▼
┌─────────────┐
│ Attempt 2   │
│ (running)   │
└──────┬──────┘
       │
       │ Success
       ▼
┌─────────────┐
│   success   │
└─────────────┘
```

### Max Retries

```python
if attempt > BG_JOB_MAX_RETRIES:
    raise RuntimeError(
        f"Run {run['run_id']} exceeded max attempts ({BG_JOB_MAX_RETRIES})."
    )
```

**Default**: Configurable via `BG_JOB_MAX_RETRIES` environment variable

**Error message includes**:
- Suggestion to use async I/O instead of blocking I/O
- Suggestion to set `BG_JOB_ISOLATED_LOOPS=true`

---

## Monitoring and Maintenance

### Statistics Collection

**Frequency**: Every `STATS_INTERVAL_SECS` (default: 60 seconds)

**Metrics collected**:

**Worker stats** (from queue scheduler):
```python
await logger.ainfo(
    "Worker stats",
    max=concurrency,
    available=concurrency - active,
    active=active,
)
```

**Queue stats** (from database):
```python
stats = await ops.Runs.stats(conn)
# Returns:
# - n_pending: Number of pending runs
# - n_running: Number of running runs
# - min_age_secs: Age of oldest pending run
# - med_age_secs: Median age of pending runs
```

**Database pool stats**:
```python
pool_stats = {
    "idle_connections": len(pool._available_connections),
    "in_use_connections": len(pool._in_use_connections),
    "max_connections": pool.max_connections,
}
```

**Redis pool stats**:
```python
redis_stats = {
    "idle_connections": len(_aredis.connection_pool._available_connections),
    "in_use_connections": len(_aredis.connection_pool._in_use_connections),
    "max_connections": _aredis.connection_pool.max_connections,
}
```

### Run Sweeping

**Purpose**: Recover runs from dead workers

**Frequency**: Every `BG_JOB_HEARTBEAT * 2` seconds

**Algorithm**:

1. **Acquire distributed lock** (prevents concurrent sweeps)
```python
async with LuaLock(get_redis_noretry(), LOCK_RUN_SWEEP, timeout=30.0):
```

2. **Find all running runs**
```sql
SELECT run_id FROM run WHERE status = 'running';
```

3. **Check Redis heartbeat**
```python
exists = await get_redis().mget(
    [STRING_RUN_RUNNING.format(run_id) for run_id in run_ids]
)
```

4. **Identify stale runs** (heartbeat expired)
```python
to_sweep = [
    run_id for run_id, exists in zip(run_ids, exists, strict=True)
    if exists is None
]
```

5. **Reset to pending**
```sql
UPDATE run SET status = 'pending'
WHERE run_id = ANY(%(run_ids)s) AND status = 'running';
```

6. **Wake up workers**
```python
await wake_up_worker()
```

**Edge cases**:
- If Redis is down, sweep is skipped (graceful degradation)
- If run completes during sweep, `UPDATE` condition prevents double-processing
- Distributed lock prevents multiple sweeps from conflicting

### Graceful Shutdown

**Triggered by**: SIGTERM or SIGINT

**Shutdown sequence**:

1. **Stop accepting new runs**
```python
logger.info("Shutting down background workers")
```

2. **Cancel all active workers**
```python
for task in WORKERS:
    task.cancel("Shutting down background workers.")
```

3. **Cancel all webhook tasks**
```python
for task in WEBHOOKS:
    task.cancel("Shutting down webhooks for background workers.")
```

4. **Wait for graceful completion**
```python
await asyncio.wait_for(
    asyncio.gather(*WORKERS, *WEBHOOKS, return_exceptions=True),
    SHUTDOWN_GRACE_PERIOD_SECS,  # Default: 5 seconds
)
```

5. **Force kill if timeout**
- After grace period, tasks are forcefully terminated
- Runs will be swept back to pending on next startup

---

## Stream Management

### In-Memory Stream System

**File**: `storage/inmem_stream.py`

**Purpose**: Real-time event streaming to clients

### Stream Types

#### 1. Run Stream

**Topic**: `run:{run_id}:stream`

**Purpose**: Stream graph execution events to clients

**Events**:
- `values`: State updates
- `updates`: Node outputs
- `debug`: Debug information
- `metadata`: Run metadata
- `control`: Control messages (done, error, etc.)

**Creation**:
```python
queue = await stream_manager.add_queue(run_id, thread_id)
```

**Consumption**:
```python
async for message in queue:
    # Process message
    yield message
```

#### 2. Control Stream

**Topic**: `run:{run_id}:control`

**Purpose**: Send control signals to running workers

**Messages**:
- `interrupt`: Interrupt execution
- `rollback`: Rollback execution
- `done`: Execution completed

**Creation**:
```python
control_queue = await stream_manager.add_control_queue(run_id, thread_id)
```

**Listening**:
```python
async def listen_for_cancellation(queue, run_id, thread_id, done):
    while not done.is_set():
        message = await asyncio.wait_for(queue.get(), timeout=240)
        if message.data == b"interrupt":
            done.set(UserInterrupt())
        elif message.data == b"rollback":
            done.set(UserRollback())
```

### Message Flow

**Producer (worker)**:
```python
await stream_manager.put(
    run_id, 
    thread_id, 
    Message(topic=f"run:{run_id}:stream", data=encoded_event),
    resumable=resumable
)
```

**Consumer (API client)**:
```python
queue = await stream_manager.add_queue(run_id, thread_id)
async for message in queue:
    yield message.data
```

### Resumable Streams

**Purpose**: Allow clients to resume streaming from a specific point

**Implementation**:
```python
if resumable:
    # Store message for later retrieval
    stream_manager.messages[run_id][thread_id].append(message)
```

**Restoration**:
```python
messages = stream_manager.restore_messages(run_id, thread_id, message_id)
for message in messages:
    await queue.put(message)
```

**Use case**: Client disconnects and reconnects, wants to resume from last seen message

### Thread-Level Streams

**Purpose**: Stream events for all runs in a thread

**Creation**:
```python
queue = await stream_manager.add_thread_stream(thread_id)
```

**Broadcasting**:
```python
await stream_manager.put_thread(
    thread_id,
    Message(topic=f"thread:{thread_id}:stream", data=event)
)
```

**Use case**: Monitor all activity in a thread (e.g., for debugging)

---

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `N_JOBS_PER_WORKER` | CPU cores | Max concurrent workers per process |
| `BG_JOB_INTERVAL` | 5 seconds | Polling interval for queue scheduler |
| `BG_JOB_HEARTBEAT` | 10 seconds | Heartbeat interval for worker liveness |
| `BG_JOB_TIMEOUT_SECS` | 300 seconds | Max execution time per run |
| `BG_JOB_MAX_RETRIES` | 3 | Max retry attempts for retriable errors |
| `BG_JOB_ISOLATED_LOOPS` | false | Run each worker in isolated event loop |
| `STATS_INTERVAL_SECS` | 60 seconds | Statistics collection interval |
| `REDIS_URI` | `redis://localhost:6379` | Redis connection string |
| `REDIS_MAX_CONNECTIONS` | 50 | Max Redis connections per pool |
| `DATABASE_URI` | Required | PostgreSQL connection string |

### Performance Tuning

**High throughput**:
- Increase `N_JOBS_PER_WORKER`
- Decrease `BG_JOB_INTERVAL`
- Increase database connection pool size

**Low latency**:
- Decrease `BG_JOB_INTERVAL`
- Decrease `BG_JOB_HEARTBEAT`
- Use Redis Cluster for distributed deployments

**Reliability**:
- Increase `BG_JOB_MAX_RETRIES`
- Decrease `BG_JOB_TIMEOUT_SECS` (fail fast)
- Enable `BG_JOB_ISOLATED_LOOPS` for blocking code

---

## Troubleshooting

### Common Issues

#### 1. Runs stuck in `pending`

**Symptoms**: Runs never transition to `running`

**Causes**:
- Queue scheduler not running
- Redis connection issues
- Database connection issues
- Thread has inflight run (by design)

**Diagnosis**:
```sql
-- Check pending runs
SELECT * FROM run WHERE status = 'pending' ORDER BY created_at;

-- Check for inflight runs in same thread
SELECT * FROM run WHERE thread_id = '<thread_id>' AND status = 'running';
```

**Solutions**:
- Restart queue scheduler
- Check Redis connectivity
- Check database connectivity
- Wait for inflight run to complete

#### 2. Runs stuck in `running`

**Symptoms**: Runs never complete

**Causes**:
- Worker died unexpectedly
- Infinite loop in user code
- Deadlock in user code

**Diagnosis**:
```sql
-- Check running runs
SELECT * FROM run WHERE status = 'running' ORDER BY created_at;

-- Check Redis heartbeat
REDIS> GET run:<run_id>:running
```

**Solutions**:
- Wait for sweep to recover run
- Manually reset run to pending:
  ```sql
  UPDATE run SET status = 'pending' WHERE run_id = '<run_id>';
  ```
- Check worker logs for errors

#### 3. High retry rate

**Symptoms**: Many runs retrying multiple times

**Causes**:
- Network instability
- Database connection pool exhausted
- Blocking I/O in user code

**Diagnosis**:
```sql
-- Check retry attempts
SELECT run_id, status, created_at FROM run 
WHERE status = 'pending' 
ORDER BY created_at;
```

**Solutions**:
- Increase database connection pool
- Use async I/O instead of blocking I/O
- Enable `BG_JOB_ISOLATED_LOOPS`
- Increase `BG_JOB_TIMEOUT_SECS`

#### 4. Webhook not triggered

**Symptoms**: Run completes but webhook not called

**Causes**:
- Webhook URL unreachable
- Webhook task failed
- Worker cleanup failed

**Diagnosis**:
- Check worker logs for webhook errors
- Check network connectivity to webhook URL

**Solutions**:
- Verify webhook URL is correct
- Check webhook endpoint is accessible
- Implement retry logic in webhook handler

---

## Summary

The LangGraph queue and worker system is a **robust, scalable task execution framework** that:

1. **Uses PostgreSQL as the source of truth** for all persistent state
2. **Uses Redis for lightweight coordination** (wake-up notifications, heartbeats)
3. **Implements optimistic concurrency** with database-level locking
4. **Provides automatic retry** for transient failures
5. **Supports graceful degradation** when Redis is unavailable
6. **Enables horizontal scaling** with multiple worker processes
7. **Ensures thread exclusivity** to prevent race conditions
8. **Streams real-time events** to clients via in-memory queues
9. **Recovers from worker failures** via periodic sweeping
10. **Supports user interruption** and rollback via control streams

This architecture provides a **production-ready foundation** for executing LangGraph workflows at scale with high reliability and observability.
