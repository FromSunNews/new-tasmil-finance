// LangGraph-specific types

export interface LangGraphMessage {
  id: string;
  type: 'human' | 'ai' | 'system' | 'tool';
  content: string | LangGraphContentBlock[];
  tool_calls?: LangGraphToolCall[];
  tool_call_id?: string;
  name?: string;
  additional_kwargs?: Record<string, unknown>;
}

export interface LangGraphContentBlock {
  type: string;
  text?: string;
  image_url?: { url: string };
  [key: string]: unknown;
}

export interface LangGraphToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface LangGraphThread {
  thread_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  status: string;
  values?: Record<string, unknown>;
}

export interface LangGraphRunConfig {
  configurable?: {
    thread_id?: string;
    [key: string]: unknown;
  };
  recursion_limit?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface LangGraphStreamEvent {
  event: string;
  data: unknown;
  run_id?: string;
}

export interface LangGraphAssistant {
  assistant_id: string;
  graph_id: string;
  name?: string;
  metadata: LangGraphAssistantMetadata;
  created_at: string;
  updated_at: string;
}

export interface LangGraphAssistantMetadata {
  id?: string;
  icon?: string;
  name?: string;
  type?: string;
  author?: string;
  version?: string;
  category?: string;
  description?: string[];
}
