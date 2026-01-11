// Universal message types - framework agnostic

export type MessageRole = 'human' | 'ai' | 'system';
export type ToolStatus = 'pending' | 'running' | 'complete' | 'error';
export type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';

export interface ContentBlock {
  type: 'text' | 'image_url' | 'file';
  text?: string;
  image_url?: { url: string };
  file?: {
    name: string;
    type: string;
    size: number;
    url?: string;
  };
  [key: string]: unknown;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: ToolStatus;
}

export interface UniversalMessage {
  id: string;
  role: MessageRole;
  content: string | ContentBlock[];
  toolCalls?: ToolCall[];
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

// Helper type guards
export function isTextContent(content: UniversalMessage['content']): content is string {
  return typeof content === 'string';
}

export function isMultimodalContent(content: UniversalMessage['content']): content is ContentBlock[] {
  return Array.isArray(content);
}

export function getTextFromContent(content: UniversalMessage['content']): string {
  if (isTextContent(content)) return content;
  return content
    .filter((block): block is ContentBlock & { text: string } => 
      block.type === 'text' && typeof block.text === 'string'
    )
    .map(block => block.text)
    .join(' ');
}
