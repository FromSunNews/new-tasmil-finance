# POST /threads/{thread_id}/runs/stream Endpoint - Complete Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [API Endpoint Definition](#api-endpoint-definition)
3. [Request Flow Diagram](#request-flow-diagram)
4. [Detailed Component Breakdown](#detailed-component-breakdown)
   - [1. API Handler](#1-api-handler-stream_run)
   - [2. Run Creation](#2-run-creation-create_valid_run)
   - [3. Database Operations](#3-database-operations-runsput)
   - [4. Stream Subscription](#4-stream-subscription-runsstreamsubscribe)
   - [5. Background Worker](#5-background-worker)
   - [6. Stream Publishing](#6-stream-publishing)
   - [7. Stream Joining](#7-stream-joining-runsstreamjoin)
   - [8. SSE Response](#8-sse-response-eventsourceresponse)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Request Payload Schema](#request-payload-schema)
7. [Response Format](#response-format)
8. [Stream Modes](#stream-modes)
9. [Error Handling](#error-handling)
10. [Cleanup and Resource Management](#cleanup-and-resource-management)

---

## Overview

The `POST /threads/{thread_id}/runs/stream` endpoint creates a new run within an existing thread and streams the output back to the client using **Server-Sent Events (SSE)**. This endpoint is designed for real-time streaming of run execution results, making it ideal for interactive applications that need immediate feedback from long-running graph executions.

### Key Characteristics
- **Real-time streaming**: Uses SSE for live event delivery
- **Stateful execution**: Runs are associated with a persistent thread
- **Asynchronous processing**: Run execution happens in a background worker
- **Pub/Sub architecture**: Uses Redis for event distribution

---

## API Endpoint Definition

**File**: `api/api/runs.py` (Line 749)

```python
ApiRoute("/threads/{thread_id}/runs/stream", stream_run, methods=["POST"])
```

| Property | Value |
|----------|-------|
| **HTTP Method** | POST |
| **Path** | `/threads/{thread_id}/runs/stream` |
| **Handler Function** | `stream_run` |
| **Response Type** | `text/event-stream` (SSE) |
| **Content-Type** | `application/json` (request body) |

---

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT REQUEST                                      │
│                   POST /threads/{thread_id}/runs/stream                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  1. API Handler: stream_run()                                                   │
│     - Parse request payload (RunCreateStateful)                                 │
│     - Generate run_id (uuid7)                                                   │
│     - Subscribe to Redis pub/sub                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  2. Run Creation: create_valid_run()                                            │
│     - Validate assistant_id, thread_id, checkpoint_id                           │
│     - Merge configs (assistant + thread + payload)                              │
│     - Handle multitask strategy                                                 │
│     - Insert run into database                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  3. Database: Runs.put()                                                        │
│     - Insert run record with status='pending'                                   │
│     - Update thread metadata                                                    │
│     - Notify worker via Redis (wake_up_worker)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│  4. EventSourceResponse           │   │  5. Background Worker             │
│     - Return SSE response         │   │     - Poll queue for pending runs │
│     - Start consuming stream      │   │     - Execute graph.astream()     │
│                                   │   │     - Publish events to Redis     │
└──────────────────────────────────┘   └──────────────────────────────────┘
                        │                           │
                        └─────────────┬─────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  6. Redis Pub/Sub                                                               │
│     - Channel: run:{run_id}:stream:{event_type}                                 │
│     - Control: run:{run_id}:control                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  7. SSE Stream to Client                                                        │
│     event: values                                                               │
│     data: {"key": "value"}                                                      │
│     id: 1234567890123-0                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### 1. API Handler: `stream_run()`

**File**: `api/api/runs.py` (Lines 205-250)

```python
async def stream_run(request: ApiRequest):
    """Create a run."""
    thread_id = request.path_params["thread_id"]
    payload = await request.json(RunCreateStateful)
    on_disconnect = payload.get("on_disconnect", "continue")
    run_id = uuid7()

    sub = await Runs.Stream.subscribe(run_id, thread_id)
    try:
        async with connect() as conn:
            run = await create_valid_run(
                conn,
                thread_id,
                payload,
                request.headers,
                run_id=run_id,
                request_start_time=request.scope.get("request_start_time_ms"),
            )
    except Exception:
        await sub.__aexit__(None, None, None)
        raise

    async def body():
        try:
            async for event, message, stream_id in Runs.Stream.join(
                run["run_id"],
                thread_id=thread_id,
                cancel_on_disconnect=on_disconnect == "cancel",
                stream_channel=sub,
                last_event_id=None,
            ):
                yield event, message, stream_id
        finally:
            await sub.__aexit__(None, None, None)

    return EventSourceResponse(
        body(),
        headers={
            "Location": f"/threads/{thread_id}/runs/{run['run_id']}/stream",
            "Content-Location": f"/threads/{thread_id}/runs/{run['run_id']}",
        },
    )
```

#### Key Operations:
1. **Extract thread_id** from path parameters
2. **Parse and validate payload** using `RunCreateStateful` JSON schema
3. **Generate unique run_id** using `uuid7()` (time-ordered UUID)
4. **Subscribe to Redis pub/sub** before creating the run (ensures no events are missed)
5. **Create the run** in the database
6. **Return EventSourceResponse** that streams events as they arrive

---

### 2. Run Creation: `create_valid_run()`

**File**: `api/models/run.py` (Lines 181-348)

This function handles the complete validation and creation of a run.

#### Step-by-Step Process:

```python
async def create_valid_run(
    conn: AsyncConnectionProto,
    thread_id: str | None,
    payload: RunCreateDict,
    headers: Mapping[str, str],
    barrier: asyncio.Barrier | None = None,
    run_id: UUID | None = None,
    request_start_time: float | None = None,
    temporary: bool = False,
) -> Run:
```

**2.1 ID Extraction and Validation**
```python
(assistant_id, thread_id_, checkpoint_id, run_id) = _get_ids(
    thread_id, payload, run_id=run_id
)
```
- Validates `assistant_id` (must be valid UUID or registered graph name)
- Validates `thread_id` (must be valid UUID)
- Validates optional `checkpoint_id`

**2.2 Stream Mode Assignment**
```python
stream_mode, multitask_strategy, prevent_insert_if_inflight = assign_defaults(payload)
```
- Default stream_mode: `["values"]`
- Default multitask_strategy: `"enqueue"`

**2.3 Config Merging**
```python
config = payload.get("config") or {}
context = payload.get("context") or {}
configurable = config.setdefault("configurable", {})
```
Merges configuration from:
- Assistant default config
- Thread config
- Request payload config
- Custom headers (via `get_configurable_headers`)

**2.4 Authentication Context**
```python
ctx = get_auth_ctx()
if ctx:
    user = ctx.user
    configurable["langgraph_auth_user"] = user
    configurable["langgraph_auth_user_id"] = user_id
    configurable["langgraph_auth_permissions"] = ctx.permissions
```

**2.5 Run Insertion**
```python
run_coro = Runs.put(
    conn,
    assistant_id,
    {
        "input": payload.get("input"),
        "command": payload.get("command"),
        "config": config,
        "context": context,
        "stream_mode": stream_mode,
        "interrupt_before": payload.get("interrupt_before"),
        "interrupt_after": payload.get("interrupt_after"),
        "webhook": payload.get("webhook"),
        ...
    },
    metadata=payload.get("metadata"),
    status="pending",
    ...
)
```

**2.6 Multitask Strategy Handling**
```python
if first["run_id"] == run_id:
    # Run was inserted successfully
    if multitask_strategy in ("interrupt", "rollback") and inflight_runs:
        await Runs.cancel(conn, [run["run_id"] for run in inflight_runs], ...)
    return first
elif multitask_strategy == "reject":
    raise HTTPException(status_code=409, detail="Thread is already running a task.")
```

---

### 3. Database Operations: `Runs.put()`

**File**: `storage/ops.py` (Lines 1482-1671)

This is the core database operation that inserts the run and sets up the execution queue.

#### SQL Query Structure:

```sql
WITH inserted_thread AS (
    -- Create thread if it doesn't exist (for if_not_exists="create")
    INSERT INTO thread (thread_id, metadata, config)
    SELECT ...
    ON CONFLICT (thread_id) DO NOTHING
    RETURNING *
),

run_thread AS (
    -- Get existing or newly created thread
    SELECT * FROM thread WHERE thread_id = %(thread_id)s
    UNION ALL
    SELECT * FROM inserted_thread
),

inflight_runs AS (
    -- Find any pending/running runs on same thread
    SELECT run.*
    FROM run
    WHERE thread_id = %(thread_id)s AND status IN ('pending', 'running')
),

inserted_run AS (
    -- Insert the new run
    INSERT INTO run (run_id, thread_id, assistant_id, metadata, status, kwargs, ...)
    SELECT
        %(run_id)s,
        thread_id,
        assistant_id,
        %(metadata)s,
        'pending',
        -- Merge configs from assistant, thread, and request
        %(kwargs)s::jsonb || jsonb_build_object(
            'config', assistant.config || run_thread.config || %(config)s::jsonb || ...
        ),
        ...
    FROM run_thread
    CROSS JOIN assistant
    WHERE thread_id = %(thread_id)s AND assistant_id = %(assistant_id)s
    RETURNING run.*
),

updated_thread AS (
    -- Update thread status to 'busy'
    UPDATE thread SET status = 'busy' ...
)

SELECT * FROM inserted_run
UNION ALL
SELECT * FROM inflight_runs
```

#### Post-Insert Actions:

```python
async def consume() -> AsyncIterator[Run]:
    async for row in cur:
        yield row
        if row["run_id"] == run_id:
            # Notify background worker that a new run is available
            if not after_seconds:
                await wake_up_worker()
            else:
                create_task(wake_up_worker(after_seconds))
```

The `wake_up_worker()` function pushes a message to Redis to signal the worker queue.

---

### 4. Stream Subscription: `Runs.Stream.subscribe()`

**File**: `storage/ops.py` (Lines 1959-2001)

```python
@staticmethod
async def subscribe(
    run_id: UUID,
    thread_id: UUID,
    *,
    stream_mode: StreamMode | None = None,
    ctx: Auth.types.BaseAuthContext | None = None,
) -> StreamHandler:
    """Subscribe to the run stream, returning a stream handler."""
    
    # Validate access to the thread
    filters = await Runs.Stream.handle_event(
        ctx, "read",
        Auth.types.ThreadsRead(run_id=run_id, thread_id=thread_id),
    )
    
    # Get Redis pub/sub client
    pubsub = get_pubsub()
    control_channel = CHANNEL_RUN_CONTROL.format(run_id)  # run:{run_id}:control
    
    if stream_mode is None:
        # Subscribe to all stream modes
        await pubsub.psubscribe(
            CHANNEL_RUN_STREAM.format(run_id, "*"),  # run:{run_id}:stream:*
            control_channel
        )
    else:
        # Subscribe to specific stream mode
        await pubsub.subscribe(
            CHANNEL_RUN_STREAM.format(run_id, stream_mode),  # run:{run_id}:stream:{mode}
            control_channel
        )
    
    return pubsub
```

#### Redis Channel Patterns:
| Channel | Pattern | Purpose |
|---------|---------|---------|
| Stream | `run:{run_id}:stream:{event_type}` | Carries actual run events |
| Control | `run:{run_id}:control` | Carries control signals (`done`, `interrupt`) |

---

### 5. Background Worker

**File**: `api/worker.py` (Lines 67-380) & `storage/queue.py` (Lines 21-154)

The background worker is responsible for executing the run and publishing stream events.

#### 5.1 Queue Loop (`storage/queue.py`)

```python
async def queue():
    concurrency = config.N_JOBS_PER_WORKER
    semaphore = asyncio.Semaphore(concurrency)
    
    while True:
        await semaphore.acquire()
        
        async with ops.Runs.next(wait=wait, limit=1) as result:
            if result is None:
                semaphore.release()
                continue
            
            run, attempt = result
            task = asyncio.create_task(
                worker.worker(run, attempt, loop),
                name=f"run-{run['run_id']}-attempt-{attempt}",
            )
            task.add_done_callback(cleanup)
            WORKERS.add(task)
```

#### 5.2 Run Fetching (`Runs.next`)

```sql
WITH selected AS (
    SELECT *
    FROM run
    WHERE run.status = 'pending'
        AND run.created_at < now()
        AND NOT EXISTS (
            SELECT 1 FROM run r2
            WHERE r2.thread_id = run.thread_id
                AND r2.status = 'running'
        )
    ORDER BY run.created_at
    LIMIT 1
)
UPDATE run SET status = 'running'
FROM selected
WHERE run.run_id = selected.run_id
RETURNING run.*
```

#### 5.3 Worker Execution (`api/worker.py`)

```python
async def worker(run: Run, attempt: int, main_loop: asyncio.AbstractEventLoop) -> WorkerResult:
    run_id = run["run_id"]
    
    # Set up context for cancellation
    async with Runs.enter(run_id, run["thread_id"], main_loop, resumable) as done:
        try:
            # Stream the graph execution
            if temporary:
                stream = astream_state(run, attempt, done)
            else:
                stream = astream_state(
                    run, attempt, done,
                    on_checkpoint=on_checkpoint,
                    on_task_result=on_task_result,
                )
            
            # Wait for completion with timeout
            await asyncio.wait_for(
                wrap_user_errors(stream, run_id, resumable, stream_modes),
                BG_JOB_TIMEOUT_SECS,
            )
        except Exception as ee:
            exception = ee
        
        # Update status in database
        async with connect() as conn:
            if exception is None:
                status = "success"
                await Threads.set_joint_status(conn, thread_id, run_id, status, ...)
            elif isinstance(exception, UserInterrupt):
                status = "interrupted"
                ...
            elif isinstance(exception, UserRollback):
                status = "rollback"
                ...
            else:
                status = "error"
                ...
```

---

### 6. Stream Publishing

**File**: `api/stream.py` (Lines 481-517)

The `consume()` function processes the graph stream and publishes events to Redis.

```python
async def consume(
    stream: AnyStream,
    run_id: str | uuid.UUID,
    resumable: bool = False,
    stream_modes: set[StreamMode] | None = None,
    *,
    thread_id: str | uuid.UUID | None = None,
) -> None:
    async with aclosing(stream):
        try:
            async for mode, payload in stream:
                await Runs.Stream.publish(
                    run_id,
                    mode,
                    STREAM_CODEC.encode(
                        mode, 
                        await run_in_executor(None, json_dumpb, payload)
                    ),
                    thread_id=thread_id,
                    resumable=resumable and mode.split("|")[0] in stream_modes,
                )
        except Exception as e:
            await Runs.Stream.publish(
                run_id,
                "error",
                STREAM_CODEC.encode("error", json_dumpb(e)),
                thread_id=thread_id,
            )
            raise e
```

#### Publishing to Redis:

```python
@staticmethod
async def publish(
    run_id: UUID,
    event: str,
    message: bytes,
    thread_id: UUID | None = None,
    resumable: bool = False,
) -> None:
    await get_redis().publish(
        CHANNEL_RUN_STREAM.format(run_id, event),  # run:{run_id}:stream:{event}
        message
    )
```

---

### 7. Stream Joining: `Runs.Stream.join()`

**File**: `storage/ops.py` (Lines 2032-2144)

This is the core streaming logic that receives events from Redis and yields them to the client.

```python
@staticmethod
async def join(
    run_id: UUID,
    *,
    thread_id: UUID,
    ignore_404: bool = False,
    stream_channel: StreamHandler | None = None,
    last_event_id: str | None = None,
    cancel_on_disconnect: bool = False,
    stream_mode: StreamMode | StreamHandler | None = None,
    ctx: Auth.types.BaseAuthContext | None = None,
) -> AsyncIterator[tuple[bytes, bytes, bytes | None]]:
    """Stream the run output."""
    
    # Authorization check
    filters = await Runs.Stream.handle_event(ctx, "read", ...)
    
    pubsub = stream_mode if isinstance(stream_mode, BasePubSub) else get_pubsub()
    
    async with pubsub, connect() as conn:
        control_channel = CHANNEL_RUN_CONTROL.format(run_id)
        
        # Subscribe to channels
        if stream_mode is None:
            await pubsub.psubscribe(
                CHANNEL_RUN_STREAM.format(run_id, "*"),
                control_channel
            )
        
        timeout = WAIT_TIMEOUT  # 5 seconds
        
        while True:
            event = await pubsub.get_message(True, timeout=timeout)
            
            if event:
                # Control channel message (done signal)
                if event["channel"] == control_channel.encode():
                    if event["data"] == b"done":
                        yield (
                            b"done",
                            orjson.dumps({"event": "stream_closed"}),
                            None,
                        )
                        break
                else:
                    # Stream channel message
                    packet = decode_stream_message(event["data"], channel=event["channel"])
                    yield (
                        packet.event_bytes,
                        packet.message_bytes,
                        packet.stream_id_bytes,
                    )
            
            elif timeout == DRAIN_TIMEOUT:
                # Already in drain mode, exit
                break
            else:
                # Check run status
                run = await anext(await Runs.get(conn, run_id, thread_id=thread_id), None)
                if run is None or run["status"] not in ("pending", "running"):
                    timeout = DRAIN_TIMEOUT  # 0.01 seconds - quick drain
                if run is None and not ignore_404:
                    yield b"error", orjson.dumps({"error": "Run not found"}), None
```

#### Timeout Strategy:
| Phase | Timeout | Purpose |
|-------|---------|---------|
| **Active** | 5 seconds | Wait for events while run is active |
| **Drain** | 0.01 seconds | Quickly consume remaining events after completion |

---

### 8. SSE Response: `EventSourceResponse`

**File**: `api/sse.py` (Lines 18-124)

Custom SSE response handler that streams events to the client.

```python
class EventSourceResponse(sse_starlette.EventSourceResponse):
    def __init__(
        self,
        content: AsyncIterator[bytes | tuple[bytes, Any | bytes] | tuple[bytes, Any | bytes, bytes | None]],
        status_code: int = 200,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        super().__init__(content=content, status_code=status_code, headers=headers)

    async def stream_response(self, send: Send) -> None:
        await send({
            "type": "http.response.start",
            "status": self.status_code,
            "headers": self.raw_headers,
        })
        
        async with (
            SimpleTaskGroup(sse_heartbeat(send), cancel=True, wait=False),
            aclosing(self.body_iterator) as body,
        ):
            async for data in body:
                await send({
                    "type": "http.response.body",
                    "body": json_to_sse(*data) if isinstance(data, tuple) else data,
                    "more_body": True,
                })
```

#### SSE Formatting:

```python
def json_to_sse(event: bytes, data: Any | bytes, id: bytes | None = None) -> bytes:
    result = b"".join((
        b"event: ", event, b"\r\n",
        b"data: ", data if isinstance(data, bytes) else json_dumpb(data), b"\r\n",
    ))
    if id is not None:
        result += b"".join((b"id: ", id, b"\r\n"))
    result += b"\r\n"
    return result
```

#### Heartbeat Mechanism:

```python
async def sse_heartbeat(send: Send) -> None:
    payload = sse_starlette.ServerSentEvent(comment="heartbeat").encode()
    while True:
        await asyncio.sleep(5)
        await send({
            "type": "http.response.body",
            "body": payload,
            "more_body": True
        })
```

---

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                           POSTGRESQL DATABASE                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │    assistants    │  │     threads      │  │      runs        │      │
│  │                  │  │                  │  │                  │      │
│  │ - assistant_id   │  │ - thread_id      │  │ - run_id         │      │
│  │ - graph_id       │  │ - status         │  │ - thread_id      │      │
│  │ - config         │  │ - metadata       │  │ - status         │      │
│  │ - metadata       │  │ - config         │  │ - kwargs         │      │
│  └──────────────────┘  │ - values         │  │ - metadata       │      │
│                        └──────────────────┘  └──────────────────┘      │
└────────────────────────────────────────────────────────────────────────┘
                 │                    │                    │
                 └──────────────────┬─┘                    │
                                    │                      │
                                    ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               REDIS                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Pub/Sub Channels                          │  │
│  │  • run:{run_id}:stream:values    - Thread state updates          │  │
│  │  • run:{run_id}:stream:updates   - Node execution updates        │  │
│  │  • run:{run_id}:stream:messages  - Chat messages                 │  │
│  │  • run:{run_id}:stream:events    - All events from subgraphs     │  │
│  │  • run:{run_id}:stream:custom    - Custom user events            │  │
│  │  • run:{run_id}:stream:debug     - Debug information             │  │
│  │  • run:{run_id}:stream:metadata  - Run metadata                  │  │
│  │  • run:{run_id}:stream:error     - Error events                  │  │
│  │  • run:{run_id}:control          - Control signals (done, cancel)│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         Keys/Lists                               │  │
│  │  • run:{run_id}:running    - Running state heartbeat             │  │
│  │  • run:{run_id}:attempt    - Current attempt number              │  │
│  │  • run:{run_id}:control    - Control signal storage              │  │
│  │  • langgraph:queue         - Worker notification queue           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          GRAPH EXECUTION                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    astream_state()                               │  │
│  │  • Loads graph from GRAPHS registry                              │  │
│  │  • Sets up checkpointer (AsyncPostgresSaver)                     │  │
│  │  • Calls graph.astream() or graph.astream_events()               │  │
│  │  • Processes and yields stream events                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Request Payload Schema

**Validator**: `RunCreateStateful` (from `api/validation.py`)

```json
{
  "assistant_id": "string (required)",
  "input": "object | array | null",
  "command": {
    "resume": "any",
    "update": {"key": "value"},
    "goto": ["node1", "node2"]
  },
  "metadata": {"key": "value"},
  "config": {
    "configurable": {
      "thread_id": "uuid",
      "checkpoint_id": "uuid"
    },
    "tags": ["tag1"],
    "recursion_limit": 100
  },
  "context": {"key": "value"},
  "webhook": "https://example.com/webhook",
  "interrupt_before": ["node1"] | "*",
  "interrupt_after": ["node2"] | "*",
  "multitask_strategy": "reject | interrupt | rollback | enqueue",
  "on_disconnect": "continue | cancel",
  "on_completion": "keep | delete",
  "stream_mode": ["values", "updates", "messages", "events", "custom"],
  "stream_subgraphs": true | false,
  "stream_resumable": true | false,
  "checkpoint_id": "uuid",
  "after_seconds": 0,
  "if_not_exists": "reject | create"
}
```

### Key Parameters Explained:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `assistant_id` | string | required | UUID or graph name of the assistant |
| `input` | object/array/null | null | Input data for the graph |
| `command` | object | null | Control commands (resume, update, goto) |
| `metadata` | object | {} | Custom metadata for the run |
| `config` | object | {} | Runtime configuration |
| `stream_mode` | array | ["values"] | Event types to stream |
| `multitask_strategy` | string | "enqueue" | How to handle concurrent runs |
| `on_disconnect` | string | "continue" | Behavior when client disconnects |
| `interrupt_before` | array/string | null | Nodes to pause before |
| `interrupt_after` | array/string | null | Nodes to pause after |

---

## Response Format

The response is an SSE stream with the following format:

### SSE Event Structure:

```
event: {event_type}
data: {json_payload}
id: {message_id}

```

### Example Events:

**1. Metadata Event (always first)**
```
event: metadata
data: {"run_id": "550e8400-e29b-41d4-a716-446655440000", "attempt": 1}

```

**2. Values Event**
```
event: values
data: {"messages": [{"role": "assistant", "content": "Hello!"}]}
id: 1703347200000-0

```

**3. Updates Event**
```
event: updates
data: {"node_name": {"output_key": "output_value"}}
id: 1703347200001-0

```

**4. Messages Event (partial)**
```
event: messages/partial
data: [{"id": "msg_123", "role": "assistant", "content": "Hel"}]
id: 1703347200002-0

```

**5. Done Event (final)**
```
event: done
data: {"event": "stream_closed"}

```

**6. Error Event**
```
event: error
data: {"error": "Something went wrong", "message": "..."}

```

### Response Headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `text/event-stream` | SSE media type |
| `Location` | `/threads/{thread_id}/runs/{run_id}/stream` | URL to rejoin stream |
| `Content-Location` | `/threads/{thread_id}/runs/{run_id}` | URL to fetch run details |
| `Cache-Control` | `no-cache` | Prevent caching |

---

## Stream Modes

**File**: `api/models/run.py` (Lines 82-93)

| Mode | Description |
|------|-------------|
| `values` | Stream thread state whenever it changes |
| `updates` | Stream state updates returned by each node |
| `messages` | Stream chat messages, token-by-token when possible |
| `messages-tuple` | Stream messages as tuples with metadata |
| `events` | Stream all events from sub-runs (nodes, LLMs, etc.) |
| `custom` | Stream custom events produced by your nodes |
| `debug` | Stream debug information (always included internally) |

**Note**: `__interrupt__` events are always included in the updates stream, even when "updates" is not explicitly requested.

---

## Error Handling

### HTTP Errors:

| Status | Condition |
|--------|-----------|
| `404` | Thread or assistant not found |
| `409` | Concurrent run exists (with `multitask_strategy: "reject"`) |
| `422` | Invalid payload (validation error) |
| `500` | Internal server error |

### Stream Errors:

Errors during streaming are sent as SSE events:

```
event: error
data: {"error": "Run not found"}

```

### Client Disconnect Handling:

```python
on_disconnect = payload.get("on_disconnect", "continue")
# "continue" - Run continues in background
# "cancel" - Run is cancelled
```

When `on_disconnect: "cancel"` and client disconnects:
```python
except asyncio.CancelledError:
    if pubsub:
        pubsub.close()
    if cancel_on_disconnect:
        create_task(cancel_run(thread_id, run_id))
    raise
```

---

## Cleanup and Resource Management

### 1. PubSub Cleanup

The stream handler ensures Redis pub/sub connections are properly closed:

```python
async def body():
    try:
        async for event, message, stream_id in Runs.Stream.join(...):
            yield event, message, stream_id
    finally:
        # Always clean up the pubsub
        await sub.__aexit__(None, None, None)
```

### 2. Run Completion Signal

When a run completes, the worker sends a control message:

```python
# Worker: api/worker.py via Runs.enter()
control_message = Message(topic=f"run:{run_id}:control".encode(), data=b"done")
await stream_manager.put(run_id, thread_id, control_message)
```

### 3. Database Status Updates

```python
# On success
await Threads.set_joint_status(conn, thread_id, run_id, "success", ...)

# On error
await Threads.set_joint_status(conn, thread_id, run_id, "error", exception=e, ...)
```

### 4. Temporary Run Cleanup

For temporary/stateless runs:
```python
if temporary and not isinstance(exception, ALL_RETRIABLE_EXCEPTIONS):
    async for _ in await Threads.delete(conn, run["thread_id"]):
        pass
```

---

## Summary

The `POST /threads/{thread_id}/runs/stream` endpoint provides a sophisticated real-time streaming mechanism that:

1. **Creates runs** in an existing thread with full configuration merging
2. **Queues execution** for background processing via the worker pool
3. **Streams events** in real-time using Redis pub/sub and SSE
4. **Handles failures** gracefully with retries and proper cleanup
5. **Supports multiple stream modes** for different use cases
6. **Manages concurrent runs** with configurable multitask strategies

This architecture enables responsive, real-time applications while maintaining reliability and proper resource management.
