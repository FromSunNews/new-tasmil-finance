# Runs.Stream.join() Function - Detailed Explanation

## Overview

The `Runs.Stream.join()` function is a static async method located in `storage/ops.py` (lines 2032-2144) that streams real-time output from a running task/job. It's part of the `Runs.Stream` class and serves as the core mechanism for clients to receive live updates from executing runs.

## Function Signature

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
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `run_id` | `UUID` | Yes | Unique identifier for the run to stream |
| `thread_id` | `UUID` | Yes | Thread ID associated with the run |
| `ignore_404` | `bool` | No (default: `False`) | If `True`, suppresses "Run not found" errors |
| `stream_channel` | `StreamHandler \| None` | No | Currently unused in the implementation |
| `last_event_id` | `str \| None` | No | Currently unused in the implementation |
| `cancel_on_disconnect` | `bool` | No (default: `False`) | If `True`, cancels the run when client disconnects |
| `stream_mode` | `StreamMode \| StreamHandler \| None` | No | Controls which events to stream (see below) |
| `ctx` | `Auth.types.BaseAuthContext \| None` | No | Authentication context for authorization |

## Return Value

Returns an **async iterator** that yields tuples of:
- `(event_bytes, message_bytes, stream_id_bytes | None)`

Where:
- **`event_bytes`**: The event type (e.g., `b"values"`, `b"done"`, `b"error"`)
- **`message_bytes`**: The actual message payload (JSON-encoded)
- **`stream_id_bytes`**: Optional stream identifier

## Functional Flow

### 1. Authorization Check (Lines 2045-2064)

```python
filters = await Runs.Stream.handle_event(
    ctx,
    "read",
    Auth.types.ThreadsRead(run_id=run_id, thread_id=thread_id),
)
```

**Purpose**: Validates that the authenticated user has permission to read this run's stream.

**Process**:
1. Calls the authentication handler to get filter conditions
2. Builds a SQL filter query using `_build_filter_query()`
3. If filters exist, executes a database query to verify the run exists and user has access
4. Raises `HTTPException(404)` if the run is not found or user lacks permission

### 2. PubSub Setup (Lines 2066-2086)

**Purpose**: Establishes a Redis Pub/Sub connection to receive real-time events.

**Logic**:
```python
pubsub = (
    stream_mode
    if isinstance(stream_mode, coredis.commands.pubsub.BasePubSub)
    else get_pubsub()
)
```

Three subscription modes:

| Condition | Action | Description |
|-----------|--------|-------------|
| `stream_mode is pubsub` | No subscription | Assumes already subscribed |
| `stream_mode is None` | Pattern subscribe to `run:{run_id}:stream:*` | Receives **all** event types |
| `stream_mode` is a string | Subscribe to `run:{run_id}:stream:{mode}` | Receives **specific** event type only |

**Channels**:
- **Stream channel**: `run:{run_id}:stream:{event_type}` - carries actual run events
- **Control channel**: `run:{run_id}:control` - carries control signals (e.g., "done")

### 3. Main Event Loop (Lines 2094-2137)

This is the heart of the streaming mechanism.

#### 3.1 Event Reception (Lines 2095-2121)

```python
while True:
    event = await pubsub.get_message(True, timeout=timeout)
```

**Timeout behavior**:
- Initially: `WAIT_TIMEOUT = 5 seconds`
- After run completes: `DRAIN_TIMEOUT = 0.01 seconds`

**Event Processing**:

##### Control Channel Event (Lines 2097-2105)
```python
if event["channel"] == control_channel.encode():
    if event["data"] == b"done":
        yield (b"done", orjson.dumps({"event": "stream_closed"}), None)
        break
```
- Receives `done` signal when run completes
- Emits final `stream_closed` event
- Exits the loop

##### Stream Channel Event (Lines 2106-2121)
```python
else:
    packet = decode_stream_message(event["data"], channel=event["channel"])
    yield (packet.event_bytes, packet.message_bytes, packet.stream_id_bytes)
```
- Decodes the stream message
- Yields the event to the client
- Logs debug information about the streamed event

#### 3.2 Timeout Handling (Lines 2122-2137)

When no event is received within the timeout period:

##### Drain Mode (Line 2122-2123)
```python
elif timeout == DRAIN_TIMEOUT:
    break
```
- If already in drain mode (0.01s timeout), exit immediately
- This prevents infinite waiting after run completion

##### Run Status Check (Lines 2124-2137)
```python
else:
    run_iter = await Runs.get(conn, run_id, thread_id=thread_id, ctx=ctx)
    run = await anext(run_iter, None)
    if run is None or run["status"] not in ("pending", "running"):
        timeout = DRAIN_TIMEOUT
    if run is None and not ignore_404:
        yield b"error", orjson.dumps({"error": "Run not found"}), None
```

**Purpose**: Checks if the run is still active when no events arrive.

**Logic**:
1. Fetches the current run status from the database
2. If run is not `pending` or `running`, switches to drain mode
3. If run doesn't exist and `ignore_404=False`, yields an error event

**Why this matters**: 
- Prevents indefinite waiting for runs that have already completed
- Allows the stream to gracefully close after consuming remaining events

### 4. Error Handling (Lines 2139-2144)

```python
except asyncio.CancelledError:
    if pubsub:
        pubsub.close()
    if cancel_on_disconnect:
        create_task(cancel_run(thread_id, run_id))
    raise
```

**Purpose**: Handles client disconnection gracefully.

**Actions**:
1. Closes the PubSub connection
2. If `cancel_on_disconnect=True`, asynchronously cancels the run
3. Re-raises the exception to propagate cancellation

## Key Design Patterns

### 1. Two-Phase Timeout Strategy

The function uses a clever two-phase timeout:

- **Phase 1 (Active)**: `WAIT_TIMEOUT = 5s` - waits for new events while run is active
- **Phase 2 (Drain)**: `DRAIN_TIMEOUT = 0.01s` - quickly drains remaining events after completion

This ensures:
- Responsive streaming during execution
- Fast cleanup after completion
- No missed events

### 2. Dual Channel Architecture

- **Stream channels**: Carry typed events (values, updates, debug, etc.)
- **Control channel**: Carries lifecycle signals (done, interrupt, rollback)

This separation allows:
- Clean shutdown signaling
- Event type filtering via `stream_mode`
- Independent control flow

### 3. Authorization at Entry

Authorization is checked once at the beginning, not on every event. This:
- Improves performance
- Simplifies the streaming loop
- Assumes permissions don't change mid-stream

## Usage Examples

### Example 1: Stream All Events
```python
async for event_type, message, stream_id in Runs.Stream.join(
    run_id=my_run_id,
    thread_id=my_thread_id,
    stream_mode=None,  # All events
    ctx=auth_context
):
    print(f"Event: {event_type}, Data: {message}")
```

### Example 2: Stream Only Values
```python
async for event_type, message, stream_id in Runs.Stream.join(
    run_id=my_run_id,
    thread_id=my_thread_id,
    stream_mode="values",  # Only value events
    ctx=auth_context
):
    if event_type == b"values":
        process_value(message)
```

### Example 3: Auto-Cancel on Disconnect
```python
async for event_type, message, stream_id in Runs.Stream.join(
    run_id=my_run_id,
    thread_id=my_thread_id,
    cancel_on_disconnect=True,  # Cancel if client disconnects
    ctx=auth_context
):
    await send_to_client(message)
```

## Related Components

### Constants (from `storage/redis.py`)
- `CHANNEL_RUN_STREAM = "run:{}:stream:{}"` - Stream channel pattern
- `CHANNEL_RUN_CONTROL = "run:{}:control"` - Control channel pattern
- `WAIT_TIMEOUT = 5` - Active wait timeout
- `DRAIN_TIMEOUT = 0.01` - Drain mode timeout

### Helper Functions
- `decode_stream_message()` - Decodes binary stream messages
- `_build_filter_query()` - Builds SQL filter clauses for authorization
- `get_pubsub()` - Creates a Redis PubSub client
- `cancel_run()` - Cancels a running task

## Common Use Cases

1. **Server-Sent Events (SSE)**: Stream run updates to web clients
2. **WebSocket Streaming**: Real-time updates via WebSocket connections
3. **CLI Progress**: Display progress in command-line tools
4. **Monitoring**: Track run execution for debugging/observability
5. **Event Replay**: Consume all events from a completed run (with drain mode)

## Important Notes

⚠️ **Unused Parameters**: `stream_channel` and `last_event_id` are defined but not used in the current implementation. They may be reserved for future features.

⚠️ **Connection Management**: The function opens a database connection that stays open for the entire stream duration. Ensure proper cleanup on errors.

⚠️ **Authorization Caching**: Permissions are checked once at the start. If permissions change during streaming, they won't be re-validated.

⚠️ **Redis Dependency**: This function requires a working Redis instance for Pub/Sub functionality.

## Performance Considerations

- **Database Polling**: Checks run status on every timeout (every 5 seconds during active phase)
- **Memory**: Minimal - events are yielded immediately, not buffered
- **Network**: Efficient - uses Redis Pub/Sub for push-based delivery
- **Latency**: Low - events are delivered in real-time as they're published

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Run not found (initial check) | Raises `HTTPException(404)` |
| Run not found (during stream) | Yields error event if `ignore_404=False` |
| No permission | Raises `HTTPException(404)` |
| Client disconnects | Closes cleanly, optionally cancels run |
| Redis connection lost | Exception propagates to caller |
| Run completes | Emits `done` event and exits gracefully |

## Conclusion

The `Runs.Stream.join()` function is a sophisticated streaming mechanism that:
- Provides real-time event delivery via Redis Pub/Sub
- Implements intelligent timeout handling for efficient resource usage
- Supports flexible event filtering through stream modes
- Handles authorization and error cases gracefully
- Enables responsive client experiences for long-running tasks

Its design balances performance, reliability, and developer experience, making it a robust foundation for real-time run monitoring in the application.
