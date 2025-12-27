import datetime
from collections.abc import Iterable as _Iterable
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar

from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper

DESCRIPTOR: _descriptor.FileDescriptor

class OnConflictBehavior(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    RAISE: _ClassVar[OnConflictBehavior]
    DO_NOTHING: _ClassVar[OnConflictBehavior]

class SortOrder(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    DESC: _ClassVar[SortOrder]
    ASC: _ClassVar[SortOrder]

class AssistantsSortBy(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNSPECIFIED: _ClassVar[AssistantsSortBy]
    ASSISTANT_ID: _ClassVar[AssistantsSortBy]
    GRAPH_ID: _ClassVar[AssistantsSortBy]
    NAME: _ClassVar[AssistantsSortBy]
    CREATED_AT: _ClassVar[AssistantsSortBy]
    UPDATED_AT: _ClassVar[AssistantsSortBy]

class ThreadStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    THREAD_STATUS_IDLE: _ClassVar[ThreadStatus]
    THREAD_STATUS_BUSY: _ClassVar[ThreadStatus]
    THREAD_STATUS_INTERRUPTED: _ClassVar[ThreadStatus]
    THREAD_STATUS_ERROR: _ClassVar[ThreadStatus]

class ThreadTTLStrategy(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    THREAD_TTL_STRATEGY_DELETE: _ClassVar[ThreadTTLStrategy]

class CheckpointSource(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    CHECKPOINT_SOURCE_UNSPECIFIED: _ClassVar[CheckpointSource]
    CHECKPOINT_SOURCE_INPUT: _ClassVar[CheckpointSource]
    CHECKPOINT_SOURCE_LOOP: _ClassVar[CheckpointSource]
    CHECKPOINT_SOURCE_UPDATE: _ClassVar[CheckpointSource]
    CHECKPOINT_SOURCE_FORK: _ClassVar[CheckpointSource]

class ThreadsSortBy(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    THREADS_SORT_BY_UNSPECIFIED: _ClassVar[ThreadsSortBy]
    THREADS_SORT_BY_THREAD_ID: _ClassVar[ThreadsSortBy]
    THREADS_SORT_BY_CREATED_AT: _ClassVar[ThreadsSortBy]
    THREADS_SORT_BY_UPDATED_AT: _ClassVar[ThreadsSortBy]
    THREADS_SORT_BY_STATUS: _ClassVar[ThreadsSortBy]

class RunStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    RUN_STATUS_PENDING: _ClassVar[RunStatus]
    RUN_STATUS_RUNNING: _ClassVar[RunStatus]
    RUN_STATUS_ERROR: _ClassVar[RunStatus]
    RUN_STATUS_SUCCESS: _ClassVar[RunStatus]
    RUN_STATUS_TIMEOUT: _ClassVar[RunStatus]
    RUN_STATUS_INTERRUPTED: _ClassVar[RunStatus]

class MultitaskStrategy(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    MULTITASK_STRATEGY_UNSPECIFIED: _ClassVar[MultitaskStrategy]
    MULTITASK_STRATEGY_REJECT: _ClassVar[MultitaskStrategy]
    MULTITASK_STRATEGY_ROLLBACK: _ClassVar[MultitaskStrategy]
    MULTITASK_STRATEGY_INTERRUPT: _ClassVar[MultitaskStrategy]
    MULTITASK_STRATEGY_ENQUEUE: _ClassVar[MultitaskStrategy]

class StreamMode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    STREAM_MODE_UNSPECIFIED: _ClassVar[StreamMode]
    STREAM_MODE_VALUES: _ClassVar[StreamMode]
    STREAM_MODE_MESSAGES: _ClassVar[StreamMode]
    STREAM_MODE_UPDATES: _ClassVar[StreamMode]
    STREAM_MODE_EVENTS: _ClassVar[StreamMode]
    STREAM_MODE_DEBUG: _ClassVar[StreamMode]
    STREAM_MODE_TASKS: _ClassVar[StreamMode]
    STREAM_MODE_CHECKPOINTS: _ClassVar[StreamMode]
    STREAM_MODE_CUSTOM: _ClassVar[StreamMode]

class CreateRunBehavior(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    REJECT_RUN_IF_THREAD_NOT_EXISTS: _ClassVar[CreateRunBehavior]
    CREATE_THREAD_IF_THREAD_NOT_EXISTS: _ClassVar[CreateRunBehavior]

class CancelRunAction(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    CANCEL_RUN_ACTION_INTERRUPT: _ClassVar[CancelRunAction]
    CANCEL_RUN_ACTION_ROLLBACK: _ClassVar[CancelRunAction]

class CancelRunStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    CANCEL_RUN_STATUS_PENDING: _ClassVar[CancelRunStatus]
    CANCEL_RUN_STATUS_RUNNING: _ClassVar[CancelRunStatus]
    CANCEL_RUN_STATUS_ALL: _ClassVar[CancelRunStatus]
RAISE: OnConflictBehavior
DO_NOTHING: OnConflictBehavior
DESC: SortOrder
ASC: SortOrder
UNSPECIFIED: AssistantsSortBy
ASSISTANT_ID: AssistantsSortBy
GRAPH_ID: AssistantsSortBy
NAME: AssistantsSortBy
CREATED_AT: AssistantsSortBy
UPDATED_AT: AssistantsSortBy
THREAD_STATUS_IDLE: ThreadStatus
THREAD_STATUS_BUSY: ThreadStatus
THREAD_STATUS_INTERRUPTED: ThreadStatus
THREAD_STATUS_ERROR: ThreadStatus
THREAD_TTL_STRATEGY_DELETE: ThreadTTLStrategy
CHECKPOINT_SOURCE_UNSPECIFIED: CheckpointSource
CHECKPOINT_SOURCE_INPUT: CheckpointSource
CHECKPOINT_SOURCE_LOOP: CheckpointSource
CHECKPOINT_SOURCE_UPDATE: CheckpointSource
CHECKPOINT_SOURCE_FORK: CheckpointSource
THREADS_SORT_BY_UNSPECIFIED: ThreadsSortBy
THREADS_SORT_BY_THREAD_ID: ThreadsSortBy
THREADS_SORT_BY_CREATED_AT: ThreadsSortBy
THREADS_SORT_BY_UPDATED_AT: ThreadsSortBy
THREADS_SORT_BY_STATUS: ThreadsSortBy
RUN_STATUS_PENDING: RunStatus
RUN_STATUS_RUNNING: RunStatus
RUN_STATUS_ERROR: RunStatus
RUN_STATUS_SUCCESS: RunStatus
RUN_STATUS_TIMEOUT: RunStatus
RUN_STATUS_INTERRUPTED: RunStatus
MULTITASK_STRATEGY_UNSPECIFIED: MultitaskStrategy
MULTITASK_STRATEGY_REJECT: MultitaskStrategy
MULTITASK_STRATEGY_ROLLBACK: MultitaskStrategy
MULTITASK_STRATEGY_INTERRUPT: MultitaskStrategy
MULTITASK_STRATEGY_ENQUEUE: MultitaskStrategy
STREAM_MODE_UNSPECIFIED: StreamMode
STREAM_MODE_VALUES: StreamMode
STREAM_MODE_MESSAGES: StreamMode
STREAM_MODE_UPDATES: StreamMode
STREAM_MODE_EVENTS: StreamMode
STREAM_MODE_DEBUG: StreamMode
STREAM_MODE_TASKS: StreamMode
STREAM_MODE_CHECKPOINTS: StreamMode
STREAM_MODE_CUSTOM: StreamMode
REJECT_RUN_IF_THREAD_NOT_EXISTS: CreateRunBehavior
CREATE_THREAD_IF_THREAD_NOT_EXISTS: CreateRunBehavior
CANCEL_RUN_ACTION_INTERRUPT: CancelRunAction
CANCEL_RUN_ACTION_ROLLBACK: CancelRunAction
CANCEL_RUN_STATUS_PENDING: CancelRunStatus
CANCEL_RUN_STATUS_RUNNING: CancelRunStatus
CANCEL_RUN_STATUS_ALL: CancelRunStatus

class Config(_message.Message):
    __slots__ = ("tags", "recursion_limit", "configurable", "extra")
    TAGS_FIELD_NUMBER: _ClassVar[int]
    RECURSION_LIMIT_FIELD_NUMBER: _ClassVar[int]
    CONFIGURABLE_FIELD_NUMBER: _ClassVar[int]
    EXTRA_FIELD_NUMBER: _ClassVar[int]
    tags: _containers.RepeatedScalarFieldContainer[str]
    recursion_limit: int
    configurable: _struct_pb2.Struct
    extra: bytes
    def __init__(self, tags: _Iterable[str] | None = ..., recursion_limit: int | None = ..., configurable: _struct_pb2.Struct | _Mapping | None = ..., extra: bytes | None = ...) -> None: ...

class EqAuthFilter(_message.Message):
    __slots__ = ("match",)
    MATCH_FIELD_NUMBER: _ClassVar[int]
    match: str
    def __init__(self, match: str | None = ...) -> None: ...

class ContainsAuthFilter(_message.Message):
    __slots__ = ("matches",)
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[_struct_pb2.Value]
    def __init__(self, matches: _Iterable[_struct_pb2.Value | _Mapping] | None = ...) -> None: ...

class AuthFilter(_message.Message):
    __slots__ = ("eq", "contains")
    EQ_FIELD_NUMBER: _ClassVar[int]
    CONTAINS_FIELD_NUMBER: _ClassVar[int]
    eq: EqAuthFilter
    contains: ContainsAuthFilter
    def __init__(self, eq: EqAuthFilter | _Mapping | None = ..., contains: ContainsAuthFilter | _Mapping | None = ...) -> None: ...

class UUID(_message.Message):
    __slots__ = ("value",)
    VALUE_FIELD_NUMBER: _ClassVar[int]
    value: str
    def __init__(self, value: str | None = ...) -> None: ...

class CountResponse(_message.Message):
    __slots__ = ("count",)
    COUNT_FIELD_NUMBER: _ClassVar[int]
    count: int
    def __init__(self, count: int | None = ...) -> None: ...

class Assistant(_message.Message):
    __slots__ = ("assistant_id", "graph_id", "version", "created_at", "updated_at", "config", "context", "metadata", "name", "description")
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    graph_id: str
    version: int
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    config: Config
    context: _struct_pb2.Struct
    metadata: _struct_pb2.Struct
    name: str
    description: str
    def __init__(self, assistant_id: str | None = ..., graph_id: str | None = ..., version: int | None = ..., created_at: datetime.datetime | _timestamp_pb2.Timestamp | _Mapping | None = ..., updated_at: datetime.datetime | _timestamp_pb2.Timestamp | _Mapping | None = ..., config: Config | _Mapping | None = ..., context: _struct_pb2.Struct | _Mapping | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., name: str | None = ..., description: str | None = ...) -> None: ...

class AssistantVersion(_message.Message):
    __slots__ = ("assistant_id", "graph_id", "version", "created_at", "config", "context", "metadata", "name", "description")
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    graph_id: str
    version: int
    created_at: _timestamp_pb2.Timestamp
    config: Config
    context: _struct_pb2.Struct
    metadata: _struct_pb2.Struct
    name: str
    description: str
    def __init__(self, assistant_id: str | None = ..., graph_id: str | None = ..., version: int | None = ..., created_at: datetime.datetime | _timestamp_pb2.Timestamp | _Mapping | None = ..., config: Config | _Mapping | None = ..., context: _struct_pb2.Struct | _Mapping | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., name: str | None = ..., description: str | None = ...) -> None: ...

class CreateAssistantRequest(_message.Message):
    __slots__ = ("assistant_id", "graph_id", "filters", "if_exists", "config", "context", "name", "description", "metadata")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    IF_EXISTS_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    graph_id: str
    filters: _containers.MessageMap[str, AuthFilter]
    if_exists: OnConflictBehavior
    config: Config
    context: _struct_pb2.Struct
    name: str
    description: str
    metadata: _struct_pb2.Struct
    def __init__(self, assistant_id: str | None = ..., graph_id: str | None = ..., filters: _Mapping[str, AuthFilter] | None = ..., if_exists: OnConflictBehavior | str | None = ..., config: Config | _Mapping | None = ..., context: _struct_pb2.Struct | _Mapping | None = ..., name: str | None = ..., description: str | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ...) -> None: ...

class GetAssistantRequest(_message.Message):
    __slots__ = ("assistant_id", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, assistant_id: str | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class PatchAssistantRequest(_message.Message):
    __slots__ = ("assistant_id", "filters", "graph_id", "config", "context", "name", "description", "metadata")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    filters: _containers.MessageMap[str, AuthFilter]
    graph_id: str
    config: Config
    context: _struct_pb2.Struct
    name: str
    description: str
    metadata: _struct_pb2.Struct
    def __init__(self, assistant_id: str | None = ..., filters: _Mapping[str, AuthFilter] | None = ..., graph_id: str | None = ..., config: Config | _Mapping | None = ..., context: _struct_pb2.Struct | _Mapping | None = ..., name: str | None = ..., description: str | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ...) -> None: ...

class DeleteAssistantRequest(_message.Message):
    __slots__ = ("assistant_id", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, assistant_id: str | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class DeleteAssistantsResponse(_message.Message):
    __slots__ = ("assistant_ids",)
    ASSISTANT_IDS_FIELD_NUMBER: _ClassVar[int]
    assistant_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, assistant_ids: _Iterable[str] | None = ...) -> None: ...

class SetLatestAssistantRequest(_message.Message):
    __slots__ = ("assistant_id", "version", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    version: int
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, assistant_id: str | None = ..., version: int | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class SearchAssistantsRequest(_message.Message):
    __slots__ = ("filters", "graph_id", "metadata", "limit", "offset", "sort_by", "sort_order", "select")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    SORT_BY_FIELD_NUMBER: _ClassVar[int]
    SORT_ORDER_FIELD_NUMBER: _ClassVar[int]
    SELECT_FIELD_NUMBER: _ClassVar[int]
    filters: _containers.MessageMap[str, AuthFilter]
    graph_id: str
    metadata: _struct_pb2.Struct
    limit: int
    offset: int
    sort_by: AssistantsSortBy
    sort_order: SortOrder
    select: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, filters: _Mapping[str, AuthFilter] | None = ..., graph_id: str | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., limit: int | None = ..., offset: int | None = ..., sort_by: AssistantsSortBy | str | None = ..., sort_order: SortOrder | str | None = ..., select: _Iterable[str] | None = ...) -> None: ...

class SearchAssistantsResponse(_message.Message):
    __slots__ = ("assistants",)
    ASSISTANTS_FIELD_NUMBER: _ClassVar[int]
    assistants: _containers.RepeatedCompositeFieldContainer[Assistant]
    def __init__(self, assistants: _Iterable[Assistant | _Mapping] | None = ...) -> None: ...

class GetAssistantVersionsRequest(_message.Message):
    __slots__ = ("assistant_id", "filters", "metadata", "limit", "offset")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    assistant_id: str
    filters: _containers.MessageMap[str, AuthFilter]
    metadata: _struct_pb2.Struct
    limit: int
    offset: int
    def __init__(self, assistant_id: str | None = ..., filters: _Mapping[str, AuthFilter] | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., limit: int | None = ..., offset: int | None = ...) -> None: ...

class GetAssistantVersionsResponse(_message.Message):
    __slots__ = ("versions",)
    VERSIONS_FIELD_NUMBER: _ClassVar[int]
    versions: _containers.RepeatedCompositeFieldContainer[AssistantVersion]
    def __init__(self, versions: _Iterable[AssistantVersion | _Mapping] | None = ...) -> None: ...

class CountAssistantsRequest(_message.Message):
    __slots__ = ("filters", "graph_id", "metadata")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    filters: _containers.MessageMap[str, AuthFilter]
    graph_id: str
    metadata: _struct_pb2.Struct
    def __init__(self, filters: _Mapping[str, AuthFilter] | None = ..., graph_id: str | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ...) -> None: ...

class TruncateRequest(_message.Message):
    __slots__ = ("runs", "threads", "assistants", "checkpointer", "store")
    RUNS_FIELD_NUMBER: _ClassVar[int]
    THREADS_FIELD_NUMBER: _ClassVar[int]
    ASSISTANTS_FIELD_NUMBER: _ClassVar[int]
    CHECKPOINTER_FIELD_NUMBER: _ClassVar[int]
    STORE_FIELD_NUMBER: _ClassVar[int]
    runs: bool
    threads: bool
    assistants: bool
    checkpointer: bool
    store: bool
    def __init__(self, runs: bool = ..., threads: bool = ..., assistants: bool = ..., checkpointer: bool = ..., store: bool = ...) -> None: ...

class ThreadTTLConfig(_message.Message):
    __slots__ = ("strategy", "default_ttl", "sweep_interval_minutes")
    STRATEGY_FIELD_NUMBER: _ClassVar[int]
    DEFAULT_TTL_FIELD_NUMBER: _ClassVar[int]
    SWEEP_INTERVAL_MINUTES_FIELD_NUMBER: _ClassVar[int]
    strategy: ThreadTTLStrategy
    default_ttl: float
    sweep_interval_minutes: int
    def __init__(self, strategy: ThreadTTLStrategy | str | None = ..., default_ttl: float | None = ..., sweep_interval_minutes: int | None = ...) -> None: ...

class Fragment(_message.Message):
    __slots__ = ("value",)
    VALUE_FIELD_NUMBER: _ClassVar[int]
    value: bytes
    def __init__(self, value: bytes | None = ...) -> None: ...

class CheckpointTask(_message.Message):
    __slots__ = ("id", "name", "error", "interrupts", "state")
    ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    INTERRUPTS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    id: str
    name: str
    error: str
    interrupts: _containers.RepeatedCompositeFieldContainer[_struct_pb2.Struct]
    state: _struct_pb2.Struct
    def __init__(self, id: str | None = ..., name: str | None = ..., error: str | None = ..., interrupts: _Iterable[_struct_pb2.Struct | _Mapping] | None = ..., state: _struct_pb2.Struct | _Mapping | None = ...) -> None: ...

class CheckpointMetadata(_message.Message):
    __slots__ = ("source", "step", "parents")
    class ParentsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: str | None = ..., value: str | None = ...) -> None: ...
    SOURCE_FIELD_NUMBER: _ClassVar[int]
    STEP_FIELD_NUMBER: _ClassVar[int]
    PARENTS_FIELD_NUMBER: _ClassVar[int]
    source: CheckpointSource
    step: int
    parents: _containers.ScalarMap[str, str]
    def __init__(self, source: CheckpointSource | str | None = ..., step: int | None = ..., parents: _Mapping[str, str] | None = ...) -> None: ...

class CheckpointPayload(_message.Message):
    __slots__ = ("config", "metadata", "values", "next", "parent_config", "tasks")
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    VALUES_FIELD_NUMBER: _ClassVar[int]
    NEXT_FIELD_NUMBER: _ClassVar[int]
    PARENT_CONFIG_FIELD_NUMBER: _ClassVar[int]
    TASKS_FIELD_NUMBER: _ClassVar[int]
    config: Config
    metadata: CheckpointMetadata
    values: _struct_pb2.Struct
    next: _containers.RepeatedScalarFieldContainer[str]
    parent_config: Config
    tasks: _containers.RepeatedCompositeFieldContainer[CheckpointTask]
    def __init__(self, config: Config | _Mapping | None = ..., metadata: CheckpointMetadata | _Mapping | None = ..., values: _struct_pb2.Struct | _Mapping | None = ..., next: _Iterable[str] | None = ..., parent_config: Config | _Mapping | None = ..., tasks: _Iterable[CheckpointTask | _Mapping] | None = ...) -> None: ...

class Interrupt(_message.Message):
    __slots__ = ("id", "value", "when", "resumable", "ns")
    ID_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    WHEN_FIELD_NUMBER: _ClassVar[int]
    RESUMABLE_FIELD_NUMBER: _ClassVar[int]
    NS_FIELD_NUMBER: _ClassVar[int]
    id: str
    value: _struct_pb2.Struct
    when: str
    resumable: bool
    ns: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, id: str | None = ..., value: _struct_pb2.Struct | _Mapping | None = ..., when: str | None = ..., resumable: bool = ..., ns: _Iterable[str] | None = ...) -> None: ...

class Interrupts(_message.Message):
    __slots__ = ("interrupts",)
    INTERRUPTS_FIELD_NUMBER: _ClassVar[int]
    interrupts: _containers.RepeatedCompositeFieldContainer[Interrupt]
    def __init__(self, interrupts: _Iterable[Interrupt | _Mapping] | None = ...) -> None: ...

class Thread(_message.Message):
    __slots__ = ("thread_id", "created_at", "updated_at", "metadata", "config", "context", "status", "values", "interrupts")
    class InterruptsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: Interrupts
        def __init__(self, key: str | None = ..., value: Interrupts | _Mapping | None = ...) -> None: ...
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    VALUES_FIELD_NUMBER: _ClassVar[int]
    INTERRUPTS_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    metadata: Fragment
    config: Fragment
    context: Fragment
    status: ThreadStatus
    values: Fragment
    interrupts: _containers.MessageMap[str, Interrupts]
    def __init__(self, thread_id: UUID | _Mapping | None = ..., created_at: datetime.datetime | _timestamp_pb2.Timestamp | _Mapping | None = ..., updated_at: datetime.datetime | _timestamp_pb2.Timestamp | _Mapping | None = ..., metadata: Fragment | _Mapping | None = ..., config: Fragment | _Mapping | None = ..., context: Fragment | _Mapping | None = ..., status: ThreadStatus | str | None = ..., values: Fragment | _Mapping | None = ..., interrupts: _Mapping[str, Interrupts] | None = ...) -> None: ...

class CreateThreadRequest(_message.Message):
    __slots__ = ("thread_id", "filters", "if_exists", "metadata", "ttl")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    IF_EXISTS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    TTL_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    if_exists: OnConflictBehavior
    metadata: _struct_pb2.Struct
    ttl: ThreadTTLConfig
    def __init__(self, thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ..., if_exists: OnConflictBehavior | str | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., ttl: ThreadTTLConfig | _Mapping | None = ...) -> None: ...

class GetThreadRequest(_message.Message):
    __slots__ = ("thread_id", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class PatchThreadRequest(_message.Message):
    __slots__ = ("thread_id", "filters", "metadata", "ttl")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    TTL_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    metadata: _struct_pb2.Struct
    ttl: ThreadTTLConfig
    def __init__(self, thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., ttl: ThreadTTLConfig | _Mapping | None = ...) -> None: ...

class DeleteThreadRequest(_message.Message):
    __slots__ = ("thread_id", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class CopyThreadRequest(_message.Message):
    __slots__ = ("thread_id", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class SearchThreadsRequest(_message.Message):
    __slots__ = ("filters", "metadata", "values", "status", "limit", "offset", "sort_by", "sort_order", "select")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    VALUES_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    SORT_BY_FIELD_NUMBER: _ClassVar[int]
    SORT_ORDER_FIELD_NUMBER: _ClassVar[int]
    SELECT_FIELD_NUMBER: _ClassVar[int]
    filters: _containers.MessageMap[str, AuthFilter]
    metadata: _struct_pb2.Struct
    values: _struct_pb2.Struct
    status: ThreadStatus
    limit: int
    offset: int
    sort_by: ThreadsSortBy
    sort_order: SortOrder
    select: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, filters: _Mapping[str, AuthFilter] | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., values: _struct_pb2.Struct | _Mapping | None = ..., status: ThreadStatus | str | None = ..., limit: int | None = ..., offset: int | None = ..., sort_by: ThreadsSortBy | str | None = ..., sort_order: SortOrder | str | None = ..., select: _Iterable[str] | None = ...) -> None: ...

class SearchThreadsResponse(_message.Message):
    __slots__ = ("threads",)
    THREADS_FIELD_NUMBER: _ClassVar[int]
    threads: _containers.RepeatedCompositeFieldContainer[Thread]
    def __init__(self, threads: _Iterable[Thread | _Mapping] | None = ...) -> None: ...

class CountThreadsRequest(_message.Message):
    __slots__ = ("filters", "metadata", "values", "status")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    VALUES_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    filters: _containers.MessageMap[str, AuthFilter]
    metadata: _struct_pb2.Struct
    values: _struct_pb2.Struct
    status: ThreadStatus
    def __init__(self, filters: _Mapping[str, AuthFilter] | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., values: _struct_pb2.Struct | _Mapping | None = ..., status: ThreadStatus | str | None = ...) -> None: ...

class SweepThreadsTTLResponse(_message.Message):
    __slots__ = ("expired", "deleted")
    EXPIRED_FIELD_NUMBER: _ClassVar[int]
    DELETED_FIELD_NUMBER: _ClassVar[int]
    expired: int
    deleted: int
    def __init__(self, expired: int | None = ..., deleted: int | None = ...) -> None: ...

class SweepThreadsTTLRequest(_message.Message):
    __slots__ = ("batch_size", "limit")
    BATCH_SIZE_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    batch_size: int
    limit: int
    def __init__(self, batch_size: int | None = ..., limit: int | None = ...) -> None: ...

class SetThreadStatusRequest(_message.Message):
    __slots__ = ("thread_id", "status", "checkpoint", "exception", "expected_status")
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    CHECKPOINT_FIELD_NUMBER: _ClassVar[int]
    EXCEPTION_FIELD_NUMBER: _ClassVar[int]
    EXPECTED_STATUS_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    status: ThreadStatus
    checkpoint: CheckpointPayload
    exception: _struct_pb2.Struct
    expected_status: _containers.RepeatedScalarFieldContainer[ThreadStatus]
    def __init__(self, thread_id: UUID | _Mapping | None = ..., status: ThreadStatus | str | None = ..., checkpoint: CheckpointPayload | _Mapping | None = ..., exception: _struct_pb2.Struct | _Mapping | None = ..., expected_status: _Iterable[ThreadStatus | str] | None = ...) -> None: ...

class SetThreadJointStatusRequest(_message.Message):
    __slots__ = ("thread_id", "run_id", "run_status", "graph_id", "checkpoint", "exception")
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    RUN_ID_FIELD_NUMBER: _ClassVar[int]
    RUN_STATUS_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    CHECKPOINT_FIELD_NUMBER: _ClassVar[int]
    EXCEPTION_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    run_id: UUID
    run_status: str
    graph_id: str
    checkpoint: CheckpointPayload
    exception: str
    def __init__(self, thread_id: UUID | _Mapping | None = ..., run_id: UUID | _Mapping | None = ..., run_status: str | None = ..., graph_id: str | None = ..., checkpoint: CheckpointPayload | _Mapping | None = ..., exception: str | None = ...) -> None: ...

class JointRollbackRequest(_message.Message):
    __slots__ = ("thread_id", "run_id", "graph_id", "checkpoint", "exception")
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    RUN_ID_FIELD_NUMBER: _ClassVar[int]
    GRAPH_ID_FIELD_NUMBER: _ClassVar[int]
    CHECKPOINT_FIELD_NUMBER: _ClassVar[int]
    EXCEPTION_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    run_id: UUID
    graph_id: str
    checkpoint: CheckpointPayload
    exception: str
    def __init__(self, thread_id: UUID | _Mapping | None = ..., run_id: UUID | _Mapping | None = ..., graph_id: str | None = ..., checkpoint: CheckpointPayload | _Mapping | None = ..., exception: str | None = ...) -> None: ...

class RunKwargs(_message.Message):
    __slots__ = ("config", "context", "input", "command", "stream_mode", "interrupt_before", "interrupt_after", "webhook", "feedback_keys", "temporary", "subgraphs", "resumable", "checkpoint_during", "durability")
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    INPUT_FIELD_NUMBER: _ClassVar[int]
    COMMAND_FIELD_NUMBER: _ClassVar[int]
    STREAM_MODE_FIELD_NUMBER: _ClassVar[int]
    INTERRUPT_BEFORE_FIELD_NUMBER: _ClassVar[int]
    INTERRUPT_AFTER_FIELD_NUMBER: _ClassVar[int]
    WEBHOOK_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_KEYS_FIELD_NUMBER: _ClassVar[int]
    TEMPORARY_FIELD_NUMBER: _ClassVar[int]
    SUBGRAPHS_FIELD_NUMBER: _ClassVar[int]
    RESUMABLE_FIELD_NUMBER: _ClassVar[int]
    CHECKPOINT_DURING_FIELD_NUMBER: _ClassVar[int]
    DURABILITY_FIELD_NUMBER: _ClassVar[int]
    config: Config
    context: _struct_pb2.Struct
    input: _struct_pb2.Struct
    command: _struct_pb2.Struct
    stream_mode: StreamMode
    interrupt_before: _containers.RepeatedScalarFieldContainer[str]
    interrupt_after: _containers.RepeatedScalarFieldContainer[str]
    webhook: str
    feedback_keys: _containers.RepeatedScalarFieldContainer[str]
    temporary: bool
    subgraphs: bool
    resumable: bool
    checkpoint_during: bool
    durability: str
    def __init__(self, config: Config | _Mapping | None = ..., context: _struct_pb2.Struct | _Mapping | None = ..., input: _struct_pb2.Struct | _Mapping | None = ..., command: _struct_pb2.Struct | _Mapping | None = ..., stream_mode: StreamMode | str | None = ..., interrupt_before: _Iterable[str] | None = ..., interrupt_after: _Iterable[str] | None = ..., webhook: str | None = ..., feedback_keys: _Iterable[str] | None = ..., temporary: bool = ..., subgraphs: bool = ..., resumable: bool = ..., checkpoint_during: bool = ..., durability: str | None = ...) -> None: ...

class Run(_message.Message):
    __slots__ = ("run_id", "thread_id", "assistant_id", "created_at", "updated_at", "status", "metadata", "kwargs", "multitask_strategy")
    RUN_ID_FIELD_NUMBER: _ClassVar[int]
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    KWARGS_FIELD_NUMBER: _ClassVar[int]
    MULTITASK_STRATEGY_FIELD_NUMBER: _ClassVar[int]
    run_id: UUID
    thread_id: UUID
    assistant_id: UUID
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    status: RunStatus
    metadata: Fragment
    kwargs: RunKwargs
    multitask_strategy: MultitaskStrategy
    def __init__(self, run_id: UUID | _Mapping | None = ..., thread_id: UUID | _Mapping | None = ..., assistant_id: UUID | _Mapping | None = ..., created_at: datetime.datetime | _timestamp_pb2.Timestamp | _Mapping | None = ..., updated_at: datetime.datetime | _timestamp_pb2.Timestamp | _Mapping | None = ..., status: RunStatus | str | None = ..., metadata: Fragment | _Mapping | None = ..., kwargs: RunKwargs | _Mapping | None = ..., multitask_strategy: MultitaskStrategy | str | None = ...) -> None: ...

class QueueStats(_message.Message):
    __slots__ = ("n_pending", "n_running", "max_age_secs", "med_age_secs")
    N_PENDING_FIELD_NUMBER: _ClassVar[int]
    N_RUNNING_FIELD_NUMBER: _ClassVar[int]
    MAX_AGE_SECS_FIELD_NUMBER: _ClassVar[int]
    MED_AGE_SECS_FIELD_NUMBER: _ClassVar[int]
    n_pending: int
    n_running: int
    max_age_secs: float
    med_age_secs: float
    def __init__(self, n_pending: int | None = ..., n_running: int | None = ..., max_age_secs: float | None = ..., med_age_secs: float | None = ...) -> None: ...

class NextRunRequest(_message.Message):
    __slots__ = ("wait", "limit")
    WAIT_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    wait: bool
    limit: int
    def __init__(self, wait: bool = ..., limit: int | None = ...) -> None: ...

class RunWithAttempt(_message.Message):
    __slots__ = ("run", "attempt")
    RUN_FIELD_NUMBER: _ClassVar[int]
    ATTEMPT_FIELD_NUMBER: _ClassVar[int]
    run: Run
    attempt: int
    def __init__(self, run: Run | _Mapping | None = ..., attempt: int | None = ...) -> None: ...

class NextRunResponse(_message.Message):
    __slots__ = ("runs",)
    RUNS_FIELD_NUMBER: _ClassVar[int]
    runs: _containers.RepeatedCompositeFieldContainer[RunWithAttempt]
    def __init__(self, runs: _Iterable[RunWithAttempt | _Mapping] | None = ...) -> None: ...

class CreateRunRequest(_message.Message):
    __slots__ = ("assistant_id", "kwargs", "filters", "thread_id", "user_id", "run_id", "status", "metadata", "prevent_insert_if_inflight", "multitask_strategy", "if_not_exists", "after_seconds")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    ASSISTANT_ID_FIELD_NUMBER: _ClassVar[int]
    KWARGS_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    RUN_ID_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    PREVENT_INSERT_IF_INFLIGHT_FIELD_NUMBER: _ClassVar[int]
    MULTITASK_STRATEGY_FIELD_NUMBER: _ClassVar[int]
    IF_NOT_EXISTS_FIELD_NUMBER: _ClassVar[int]
    AFTER_SECONDS_FIELD_NUMBER: _ClassVar[int]
    assistant_id: UUID
    kwargs: _struct_pb2.Struct
    filters: _containers.MessageMap[str, AuthFilter]
    thread_id: UUID
    user_id: str
    run_id: UUID
    status: RunStatus
    metadata: _struct_pb2.Struct
    prevent_insert_if_inflight: bool
    multitask_strategy: MultitaskStrategy
    if_not_exists: CreateRunBehavior
    after_seconds: int
    def __init__(self, assistant_id: UUID | _Mapping | None = ..., kwargs: _struct_pb2.Struct | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ..., thread_id: UUID | _Mapping | None = ..., user_id: str | None = ..., run_id: UUID | _Mapping | None = ..., status: RunStatus | str | None = ..., metadata: _struct_pb2.Struct | _Mapping | None = ..., prevent_insert_if_inflight: bool = ..., multitask_strategy: MultitaskStrategy | str | None = ..., if_not_exists: CreateRunBehavior | str | None = ..., after_seconds: int | None = ...) -> None: ...

class GetRunRequest(_message.Message):
    __slots__ = ("run_id", "thread_id", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    RUN_ID_FIELD_NUMBER: _ClassVar[int]
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    run_id: UUID
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, run_id: UUID | _Mapping | None = ..., thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class DeleteRunRequest(_message.Message):
    __slots__ = ("run_id", "thread_id", "filters")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    RUN_ID_FIELD_NUMBER: _ClassVar[int]
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    run_id: UUID
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    def __init__(self, run_id: UUID | _Mapping | None = ..., thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ...) -> None: ...

class CancelRunIdsTarget(_message.Message):
    __slots__ = ("thread_id", "run_ids")
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    RUN_IDS_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    run_ids: _containers.RepeatedCompositeFieldContainer[UUID]
    def __init__(self, thread_id: UUID | _Mapping | None = ..., run_ids: _Iterable[UUID | _Mapping] | None = ...) -> None: ...

class CancelStatusTarget(_message.Message):
    __slots__ = ("status",)
    STATUS_FIELD_NUMBER: _ClassVar[int]
    status: CancelRunStatus
    def __init__(self, status: CancelRunStatus | str | None = ...) -> None: ...

class CancelRunRequest(_message.Message):
    __slots__ = ("filters", "run_ids", "status", "action")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    RUN_IDS_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    ACTION_FIELD_NUMBER: _ClassVar[int]
    filters: _containers.MessageMap[str, AuthFilter]
    run_ids: CancelRunIdsTarget
    status: CancelStatusTarget
    action: CancelRunAction
    def __init__(self, filters: _Mapping[str, AuthFilter] | None = ..., run_ids: CancelRunIdsTarget | _Mapping | None = ..., status: CancelStatusTarget | _Mapping | None = ..., action: CancelRunAction | str | None = ...) -> None: ...

class SearchRunsRequest(_message.Message):
    __slots__ = ("thread_id", "filters", "limit", "offset", "status", "select")
    class FiltersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: AuthFilter
        def __init__(self, key: str | None = ..., value: AuthFilter | _Mapping | None = ...) -> None: ...
    THREAD_ID_FIELD_NUMBER: _ClassVar[int]
    FILTERS_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    SELECT_FIELD_NUMBER: _ClassVar[int]
    thread_id: UUID
    filters: _containers.MessageMap[str, AuthFilter]
    limit: int
    offset: int
    status: RunStatus
    select: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, thread_id: UUID | _Mapping | None = ..., filters: _Mapping[str, AuthFilter] | None = ..., limit: int | None = ..., offset: int | None = ..., status: RunStatus | str | None = ..., select: _Iterable[str] | None = ...) -> None: ...

class SearchRunsResponse(_message.Message):
    __slots__ = ("runs",)
    RUNS_FIELD_NUMBER: _ClassVar[int]
    runs: _containers.RepeatedCompositeFieldContainer[Run]
    def __init__(self, runs: _Iterable[Run | _Mapping] | None = ...) -> None: ...

class SetRunStatusRequest(_message.Message):
    __slots__ = ("run_id", "status")
    RUN_ID_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    run_id: UUID
    status: RunStatus
    def __init__(self, run_id: UUID | _Mapping | None = ..., status: RunStatus | str | None = ...) -> None: ...

class SweepRunsResponse(_message.Message):
    __slots__ = ("run_ids",)
    RUN_IDS_FIELD_NUMBER: _ClassVar[int]
    run_ids: _containers.RepeatedCompositeFieldContainer[UUID]
    def __init__(self, run_ids: _Iterable[UUID | _Mapping] | None = ...) -> None: ...
