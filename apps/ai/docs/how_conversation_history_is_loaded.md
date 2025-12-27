# How Conversation History is Loaded in POST /threads/{thread_id}/runs/stream

## Overview

When you use the `POST /threads/{thread_id}/runs/stream` endpoint, the system automatically loads the previous conversation history from the thread's checkpoint data stored in PostgreSQL. This document explains the complete mechanism of how old conversations are retrieved and made available to the graph execution.

---

## Key Concept: Checkpointing

**LangGraph uses a checkpointing system** to persist conversation state. Every time a graph executes:
1. It saves the current state (including messages, variables, etc.) to a **checkpoint**
2. Each checkpoint is linked to a **thread_id**
3. When resuming, the graph loads the latest checkpoint to restore the conversation context

---

## The Loading Process: Step-by-Step

### 1. **Request Arrives with thread_id**

```python
# api/api/runs.py (Line 209)
thread_id = request.path_params["thread_id"]
payload = await request.json(RunCreateStateful)
```

The `thread_id` is the key identifier that links to all previous conversation history.

---

### 2. **Run Creation with Config Merging**

**File**: `api/models/run.py` (Lines 218-240)

```python
config = payload.get("config") or {}
configurable = config.setdefault("configurable", {})

# If checkpoint_id is provided, use specific checkpoint
if checkpoint_id:
    configurable["checkpoint_id"] = str(checkpoint_id)

# Add thread_id to config
configurable["thread_id"] = thread_id
configurable["graph_id"] = graph_id
```

**Key Points**:
- The `thread_id` is embedded in the `config["configurable"]` dictionary
- Optionally, a specific `checkpoint_id` can be provided to resume from a particular point in history
- If no `checkpoint_id` is provided, the system will load the **latest checkpoint**

---

### 3. **Graph Initialization with Checkpointer**

**File**: `api/stream.py` (Lines 160-170)

```python
from storage.database import connect
from storage.async_postgres_checkpointer import AsyncPostgresSaver

checkpointer = None
async with connect() as conn:
    checkpointer = AsyncPostgresSaver(conn)

graph = await stack.enter_async_context(
    get_graph(
        configurable["graph_id"],
        config,
        store=(await api_store.get_store()),
        checkpointer=None if (temporary or not checkpointer) else checkpointer,
    )
)
```

**What happens here**:
1. Creates an `AsyncPostgresSaver` instance connected to PostgreSQL
2. Passes the checkpointer to the graph
3. The graph will use this checkpointer to load and save state

---

### 4. **Graph Gets Checkpointer Attached**

**File**: `api/graph.py` (Lines 180-203)

```python
@asynccontextmanager
async def get_graph(
    graph_id: str,
    config: Config,
    *,
    checkpointer: BaseCheckpointSaver | None = None,
    store: BaseStore | None = None,
) -> AsyncIterator[Pregel]:
    
    # If checkpointer is provided, add it to config
    if checkpointer is not None and not config["configurable"].get(CONFIG_KEY_CHECKPOINTER):
        config["configurable"][CONFIG_KEY_CHECKPOINTER] = checkpointer
    
    # ... graph loading logic ...
    
    # Attach checkpointer to the graph
    update = {
        "checkpointer": checkpointer,
        "store": store,
    }
    yield graph_obj.copy(update=update)
```

**Result**: The graph now has a checkpointer that can access the database.

---

### 5. **Graph Execution Begins**

**File**: `api/stream.py` (Lines 251-257 or 370-376)

```python
# For graphs that support events
graph.astream_events(
    input,
    config,  # Contains thread_id and checkpoint_id
    version="v2",
    stream_mode=list(stream_modes_set),
    **kwargs,
)

# OR for standard graphs
graph.astream(
    input,
    config,  # Contains thread_id and checkpoint_id
    stream_mode=list(stream_modes_set),
    **kwargs,
)
```

When the graph starts executing, **LangGraph internally**:
1. Checks if a checkpointer is available
2. Calls `checkpointer.aget_tuple(config)` to load the latest checkpoint
3. Restores the conversation state from that checkpoint

---

### 6. **Checkpoint Loading from Database**

**File**: `storage/async_postgres_checkpointer.py` (Lines 90-139)

This is where the magic happens:

```python
async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
    """Get a checkpoint tuple from the database asynchronously.
    
    If the config contains a `checkpoint_id` key, the checkpoint with
    the matching thread ID and "checkpoint_id" is retrieved. 
    Otherwise, the latest checkpoint for the given thread ID is retrieved.
    """
    thread_id = config["configurable"]["thread_id"]
    checkpoint_id = get_checkpoint_id(config)
    checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
    
    if checkpoint_id:
        # Load specific checkpoint
        args = (thread_id, checkpoint_ns, checkpoint_id)
        where = "WHERE thread_id = %s AND checkpoint_ns = %s AND checkpoint_id = %s"
    else:
        # Load LATEST checkpoint
        args = (thread_id, checkpoint_ns)
        where = "WHERE thread_id = %s AND checkpoint_ns = %s ORDER BY checkpoint_id DESC LIMIT 1"
    
    async with self._cursor() as cur:
        await cur.execute(
            self.SELECT_SQL + where,
            args,
            binary=True,
        )
        value = await cur.fetchone()
        if value is None:
            return None
        
        return await self._load_checkpoint_tuple(value)
```

#### SQL Query Executed:

**For latest checkpoint**:
```sql
SELECT 
    thread_id,
    checkpoint_ns,
    checkpoint_id,
    parent_checkpoint_id,
    checkpoint,
    metadata,
    channel_values,
    pending_writes
FROM checkpoints
WHERE thread_id = %s 
  AND checkpoint_ns = %s 
ORDER BY checkpoint_id DESC 
LIMIT 1
```

**For specific checkpoint**:
```sql
SELECT ... 
FROM checkpoints
WHERE thread_id = %s 
  AND checkpoint_ns = %s 
  AND checkpoint_id = %s
```

---

### 7. **Checkpoint Data Structure**

The checkpoint contains all conversation state:

```python
CheckpointTuple(
    config={
        "configurable": {
            "thread_id": "550e8400-e29b-41d4-a716-446655440000",
            "checkpoint_ns": "",
            "checkpoint_id": "1ef8f8c8-7890-6789-8000-000000000001",
        }
    },
    checkpoint={
        "v": 1,
        "id": "1ef8f8c8-7890-6789-8000-000000000001",
        "ts": "2024-12-23T07:33:11.123456Z",
        "channel_values": {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"},
                {"role": "user", "content": "How are you?"}
            ],
            "context": {...},
            "other_state": {...}
        },
        "channel_versions": {...},
        "versions_seen": {...}
    },
    metadata={
        "source": "loop",
        "step": 3,
        "writes": {...}
    },
    parent_config={...},  # Link to previous checkpoint
    pending_writes=[...]   # Pending state updates
)
```

**Key Fields**:
- `channel_values["messages"]`: The conversation history
- `channel_values`: All graph state variables
- `parent_config`: Link to the previous checkpoint (for time-travel)

---

### 8. **Graph Restores State**

Once LangGraph receives the checkpoint:

1. **Restores all channel values** (messages, context, variables)
2. **Sets the graph's internal state** to match the checkpoint
3. **Continues execution** from where it left off

```python
# Inside LangGraph (conceptual)
if checkpoint := await checkpointer.aget_tuple(config):
    # Restore messages
    self.channels["messages"] = checkpoint.checkpoint["channel_values"]["messages"]
    
    # Restore other state
    for key, value in checkpoint.checkpoint["channel_values"].items():
        self.channels[key] = value
    
    # Now execute with restored context
    await self.execute_node(input)
```

---

## Database Schema

### Checkpoints Table

```sql
CREATE TABLE checkpoints (
    thread_id UUID NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id UUID NOT NULL,
    parent_checkpoint_id UUID,
    checkpoint JSONB NOT NULL,
    metadata JSONB NOT NULL,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE INDEX idx_checkpoints_thread_id 
    ON checkpoints(thread_id, checkpoint_id DESC);
```

### Checkpoint Blobs Table

For large state values (like long message arrays):

```sql
CREATE TABLE checkpoint_blobs (
    thread_id UUID NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    channel TEXT NOT NULL,
    version TEXT NOT NULL,
    type TEXT NOT NULL,
    blob BYTEA,
    PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
);
```

### Checkpoint Writes Table

For pending writes:

```sql
CREATE TABLE checkpoint_writes (
    thread_id UUID NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id UUID NOT NULL,
    task_id TEXT NOT NULL,
    idx INTEGER NOT NULL,
    channel TEXT NOT NULL,
    type TEXT,
    blob BYTEA,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);
```

---

## Example Flow

### Initial Conversation

**Request 1**: Create thread and first message
```bash
POST /threads/550e8400-e29b-41d4-a716-446655440000/runs/stream
{
  "assistant_id": "my-assistant",
  "input": {"messages": [{"role": "user", "content": "Hello"}]}
}
```

**What happens**:
1. No checkpoint exists for this thread
2. Graph starts with empty state
3. Processes "Hello"
4. Saves checkpoint with:
   ```json
   {
     "messages": [
       {"role": "user", "content": "Hello"},
       {"role": "assistant", "content": "Hi there!"}
     ]
   }
   ```

---

### Continuing Conversation

**Request 2**: Continue conversation
```bash
POST /threads/550e8400-e29b-41d4-a716-446655440000/runs/stream
{
  "assistant_id": "my-assistant",
  "input": {"messages": [{"role": "user", "content": "How are you?"}]}
}
```

**What happens**:
1. System loads latest checkpoint for thread `550e8400...`
2. Checkpoint contains:
   ```json
   {
     "messages": [
       {"role": "user", "content": "Hello"},
       {"role": "assistant", "content": "Hi there!"}
     ]
   }
   ```
3. Graph restores this state
4. **New message is appended** to existing messages
5. Graph processes with full context:
   ```json
   {
     "messages": [
       {"role": "user", "content": "Hello"},
       {"role": "assistant", "content": "Hi there!"},
       {"role": "user", "content": "How are you?"}
     ]
   }
   ```
6. Saves new checkpoint with updated messages

---

## Advanced: Resuming from Specific Checkpoint

You can resume from a specific point in history:

```bash
POST /threads/550e8400-e29b-41d4-a716-446655440000/runs/stream
{
  "assistant_id": "my-assistant",
  "checkpoint_id": "1ef8f8c8-7890-6789-8000-000000000001",
  "input": {"messages": [{"role": "user", "content": "Let's try again"}]}
}
```

This loads the exact state from that checkpoint, effectively "time-traveling" to that point in the conversation.

---

## Key Takeaways

1. **Automatic Loading**: Conversation history is loaded automatically when you provide a `thread_id`
2. **Latest by Default**: Without a `checkpoint_id`, the system loads the most recent checkpoint
3. **Full State Restoration**: The entire graph state (not just messages) is restored
4. **Transparent to User**: You don't need to manually pass conversation history - the checkpointer handles it
5. **Database-Backed**: All history is persisted in PostgreSQL for durability

---

## Code References

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Checkpointer Creation | `api/stream.py` | 160-170 | Creates AsyncPostgresSaver |
| Graph Attachment | `api/graph.py` | 180-203 | Attaches checkpointer to graph |
| Checkpoint Loading | `storage/async_postgres_checkpointer.py` | 90-139 | Loads checkpoint from DB |
| Config Merging | `api/models/run.py` | 218-240 | Adds thread_id to config |
| Graph Execution | `api/stream.py` | 251-257 | Starts graph with config |

---

## Debugging Tips

### Check if checkpoint exists:

```sql
SELECT 
    checkpoint_id, 
    checkpoint->>'channel_values' as state,
    metadata,
    created_at
FROM checkpoints
WHERE thread_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY checkpoint_id DESC
LIMIT 5;
```

### View conversation history:

```sql
SELECT 
    checkpoint_id,
    checkpoint->'channel_values'->'messages' as messages
FROM checkpoints
WHERE thread_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY checkpoint_id DESC;
```

### Check latest checkpoint:

```python
from storage.database import connect
from storage.async_postgres_checkpointer import AsyncPostgresSaver

async with connect() as conn:
    checkpointer = AsyncPostgresSaver(conn)
    config = {
        "configurable": {
            "thread_id": "550e8400-e29b-41d4-a716-446655440000",
            "checkpoint_ns": ""
        }
    }
    checkpoint = await checkpointer.aget_tuple(config)
    print(checkpoint.checkpoint["channel_values"]["messages"])
```

---

## Summary

The conversation history loading is handled **automatically and transparently** by the LangGraph checkpointing system:

1. **You provide** a `thread_id` in the request
2. **System creates** an `AsyncPostgresSaver` checkpointer
3. **Checkpointer loads** the latest (or specific) checkpoint from PostgreSQL
4. **Graph restores** all state including conversation history
5. **Execution continues** with full context
6. **New checkpoint** is saved after execution

This design ensures that every run has access to the complete conversation history without requiring you to manually manage or pass the history in each request.
