// CopilotKit-specific types
import type { ReactNode } from 'react';

export interface CopilotToolCall {
  id: string;
  type?: string;
  function?: {
    name: string;
    arguments: string;
  };
  name?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  status?: 'pending' | 'running' | 'complete' | 'error';
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: CopilotToolCall[];
  generativeUI?: ReactNode | (() => ReactNode);
  // For tool result messages
  toolCallId?: string;
  toolName?: string;
}

export interface CopilotChatState {
  messages: CopilotMessage[];
  isLoading: boolean;
  error?: Error;
}

export interface CopilotActionConfig {
  name: string;
  description: string;
  parameters: CopilotActionParameter[];
  handler: (args: Record<string, unknown>) => Promise<unknown>;
  render?: (props: CopilotActionRenderProps) => ReactNode;
}

export interface CopilotActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface CopilotActionRenderProps {
  status: 'executing' | 'complete' | 'error';
  args: Record<string, unknown>;
  result?: unknown;
}

export interface CopilotSuggestion {
  title: string;
  message: string;
}
