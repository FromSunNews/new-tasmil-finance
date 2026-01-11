// Thread types for chat session management

export interface ThreadMetadata {
  title?: string;
  agentId?: string;
  graphId?: string;
  assistantId?: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  [key: string]: unknown;
}

export interface Thread {
  id: string;
  metadata: ThreadMetadata;
  createdAt: Date;
  updatedAt: Date;
  status: ThreadStatus;
}

export type ThreadStatus = 'active' | 'archived' | 'deleted';

export interface ThreadListParams {
  assistantId?: string;
  graphId?: string;
  limit?: number;
  offset?: number;
  status?: ThreadStatus;
}

export interface ThreadCreateParams {
  metadata?: ThreadMetadata;
  assistantId?: string;
}
