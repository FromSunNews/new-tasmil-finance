"""Custom Checkpointer."""

import asyncio
from collections.abc import AsyncIterator, Sequence
from typing import Any

import structlog
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    get_serializable_checkpoint_metadata,
)
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.checkpoint.postgres.base import ChannelVersions, get_checkpoint_id, WRITES_IDX_MAP
from psycopg.rows import DictRow
from psycopg.types.json import Jsonb

from api.serde import Fragment, json_loads

logger = structlog.stdlib.get_logger(__name__)


class AsyncPostgresCheckpointer(AsyncPostgresSaver):
    """Custom Checkpointer with Fragment support for backward compatibility."""


    
    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[CheckpointTuple]:
        """List checkpoints from the database asynchronously.

        This method retrieves a list of checkpoint tuples from the Postgres database based
        on the provided config. The checkpoints are ordered by checkpoint ID in descending order (newest first).

        Args:
            config: Base configuration for filtering checkpoints.
            filter: Additional filtering criteria for metadata.
            before: If provided, only checkpoints before the specified checkpoint ID are returned.
            limit: Maximum number of checkpoints to return.

        Yields:
            An asynchronous iterator of matching checkpoint tuples.
        """
        where, args = self._search_where(config, filter, before)
        query = self.SELECT_SQL + where + " ORDER BY checkpoint_id DESC"
        if limit:
            query += f" LIMIT {limit}"
        # if we change this to use .stream() we need to make sure to close the cursor
        async with self._cursor() as cur:
            await cur.execute(query, args, binary=True)
            values = await cur.fetchall()
            if not values:
                logger.warning("No checkpoints found")
                return
            # # migrate pending sends if necessary
            # if to_migrate := [v
            #     for v in values
            #     if v["checkpoint"]["v"] < 4 and v["parent_checkpoint_id"]
            # ]:
            #     await cur.execute(
            #         self.SELECT_PENDING_SENDS_SQL,
            #         (
            #             values[0]["thread_id"],
            #             [v["parent_checkpoint_id"] for v in to_migrate],
            #         ),
            #     )
            #     grouped_by_parent = defaultdict(list)
            #     for value in to_migrate:
            #         grouped_by_parent[value["parent_checkpoint_id"]].append(value)
            #     async for sends in cur:
            #         for value in grouped_by_parent[sends["checkpoint_id"]]:
            #             if value["channel_values"] is None:
            #                 value["channel_values"] = []
            #             self._migrate_pending_sends(
            #                 sends["sends"],
            #                 value["checkpoint"],
            #                 value["channel_values"],
            #             )
            for value in values:
                yield await self._load_checkpoint_tuple(value)

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        """Get a checkpoint tuple from the database asynchronously.

        This method retrieves a checkpoint tuple from the Postgres database based on the
        provided config. If the config contains a `checkpoint_id` key, the checkpoint with
        the matching thread ID and "checkpoint_id" is retrieved. Otherwise, the latest checkpoint
        for the given thread ID is retrieved.

        Args:
            config: The config to use for retrieving the checkpoint.

        Returns:
            The retrieved checkpoint tuple, or None if no matching checkpoint was found.
        """
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = get_checkpoint_id(config)
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        if checkpoint_id:
            args: tuple[Any, ...] = (thread_id, checkpoint_ns, checkpoint_id)
            where = "WHERE thread_id = %s AND checkpoint_ns = %s AND checkpoint_id = %s"
        else:
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

            # # migrate pending sends if necessary
            # if value["checkpoint"]["v"] < 4 and value["parent_checkpoint_id"]:
            #     await cur.execute(
            #         self.SELECT_PENDING_SENDS_SQL,
            #         (thread_id, [value["parent_checkpoint_id"]]),
            #     )
            #     if sends := await cur.fetchone():
            #         if value["channel_values"] is None:
            #             value["channel_values"] = []
            #         self._migrate_pending_sends(
            #             sends["sends"],
            #             value["checkpoint"],
            #             value["channel_values"],
            #         )

            return await self._load_checkpoint_tuple(value)

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        """Save a checkpoint to the database asynchronously.

        This method saves a checkpoint to the Postgres database. The checkpoint is associated
        with the provided config and its parent config (if any).

        Args:
            config: The config to associate with the checkpoint.
            checkpoint: The checkpoint to save.
            metadata: Additional metadata to save with the checkpoint.
            new_versions: New channel versions as of this write.

        Returns:
            RunnableConfig: Updated configuration after storing the checkpoint.
        """
        configurable = config["configurable"].copy()
        thread_id = configurable.pop("thread_id")
        checkpoint_ns = configurable.pop("checkpoint_ns")
        checkpoint_id = configurable.pop("checkpoint_id", None)

        copy = checkpoint.copy()
        copy["channel_values"] = copy["channel_values"].copy()
        next_config = {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint["id"],
            }
        }

        # inline primitive values in checkpoint table
        # others are stored in blobs table
        blob_values = {}
        for k, v in checkpoint["channel_values"].items():
            if v is None or isinstance(v, (str, int, float, bool)):
                pass
            else:
                blob_values[k] = copy["channel_values"].pop(k)

        async with self._cursor(pipeline=False) as cur:
            if blob_versions := {
                k: v for k, v in new_versions.items() if k in blob_values
            }:
                # Use individual execute calls instead of executemany to avoid pipeline mode issues
                blob_params = await asyncio.to_thread(
                    self._dump_blobs,
                    thread_id,
                    checkpoint_ns,
                    blob_values,
                    blob_versions,
                )
                for params in blob_params:
                    await cur.execute(
                        self.UPSERT_CHECKPOINT_BLOBS_SQL,
                        params,
                    )
            await cur.execute(
                self.UPSERT_CHECKPOINTS_SQL,
                (
                    thread_id,
                    checkpoint_ns,
                    checkpoint["id"],
                    checkpoint_id,
                    Jsonb(copy),
                    Jsonb(get_serializable_checkpoint_metadata(config, metadata)),
                ),
            )
        return next_config

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        """Store intermediate writes linked to a checkpoint asynchronously.

        This method saves intermediate writes associated with a checkpoint to the database.
        Override to use pipeline=False instead of pipeline=True to avoid pipeline mode errors.

        Args:
            config: Configuration of the related checkpoint.
            writes: List of writes to store, each as (channel, value) pair.
            task_id: Identifier for the task creating the writes.
            task_path: Path identifier for the task.
        """
        query = (
            self.UPSERT_CHECKPOINT_WRITES_SQL
            if all(w[0] in WRITES_IDX_MAP for w in writes)
            else self.INSERT_CHECKPOINT_WRITES_SQL
        )
        params = await asyncio.to_thread(
            self._dump_writes,
            config["configurable"]["thread_id"],
            config["configurable"]["checkpoint_ns"],
            config["configurable"]["checkpoint_id"],
            task_id,
            task_path,
            writes,
        )
        async with self._cursor(pipeline=False) as cur:
            for param in params:
                await cur.execute(query, param)

    async def _load_checkpoint_tuple(self, value: "DictRow") -> CheckpointTuple:
        """Load a checkpoint tuple, handling Fragment for backward compatibility."""
        checkpoint = value["checkpoint"]
        checkpoint = json_loads(checkpoint) if isinstance(checkpoint, Fragment) else checkpoint

        metadata = value["metadata"]
        metadata = json_loads(metadata) if isinstance(metadata, Fragment) else metadata

        return CheckpointTuple(
            {
                "configurable": {
                    "thread_id": value["thread_id"],
                    "checkpoint_ns": value["checkpoint_ns"],
                    "checkpoint_id": value["checkpoint_id"],
                }
            },
            {
                **checkpoint,
                "channel_values": {
                    **(checkpoint.get("channel_values") or {}),
                    **self._load_blobs(value["channel_values"]),
                },
            },
            metadata,
            (
                {
                    "configurable": {
                        "thread_id": value["thread_id"],
                        "checkpoint_ns": value["checkpoint_ns"],
                        "checkpoint_id": value["parent_checkpoint_id"],
                    }
                }
                if value["parent_checkpoint_id"]
                else None
            ),
            await asyncio.to_thread(self._load_writes, value["pending_writes"]),
        )