"use client";

// 🪝 CopilotKit chat wrapper hook

import { useCopilotChatHeadless_c } from '@copilotkit/react-core';
import { useMemo, useCallback } from 'react';
import type { CopilotMessage, CopilotToolCall } from '@/features/chat-v2/types';

interface UseCopilotChatReturn {
  messages: CopilotMessage[];
  sendMessage: (content: string) => void;
  stopGeneration: () => void;
  isLoading: boolean;
  setMessages: (messages: any[]) => void;
}

/**
 * Wrapper around CopilotKit's headless chat hook
 * Provides a cleaner interface and handles message transformation
 */
export function useCopilotChat(): UseCopilotChatReturn {
  const {
    messages: rawMessages,
    sendMessage: rawSendMessage,
    stopGeneration,
    isLoading,
    setMessages: rawSetMessages,
  } = useCopilotChatHeadless_c();

  // Transform raw messages to our CopilotMessage type
  const messages = useMemo<CopilotMessage[]>(() => {
    return rawMessages.map((msg: any) => {
      // Extract tool calls
      const toolCalls: CopilotToolCall[] | undefined = msg.toolCalls?.map((tc: any) => {
        let args: Record<string, unknown> = {};
        
        // Handle function-style tool calls
        if (tc.function?.arguments) {
          try {
            args = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments;
          } catch {
            args = { _raw: tc.function.arguments };
          }
        } else if (tc.args) {
          args = tc.args;
        }

        return {
          id: tc.id,
          name: tc.function?.name ?? tc.name ?? 'unknown',
          args,
          result: tc.result,
          status: tc.status ?? 'pending',
        } satisfies CopilotToolCall;
      });

      // Handle tool result messages
      const isToolResult = msg.role === 'tool';
      const toolCallId = msg.toolCallId;
      const toolName = msg.toolName;

      return {
        id: msg.id,
        role: msg.role,
        content: msg.content ?? '',
        toolCalls,
        generativeUI: msg.generativeUI,
        // Include tool result info for tool messages
        ...(isToolResult && { toolCallId, toolName }),
      } satisfies CopilotMessage;
    });
  }, [rawMessages]);

  // Wrap sendMessage - match the original implementation exactly
  const sendMessage = useCallback((content: string): void => {
    rawSendMessage({
      id: Date.now().toString(),
      role: 'user',
      content,
    });
  }, [rawSendMessage]);

  return {
    messages,
    sendMessage,
    stopGeneration,
    isLoading,
    setMessages: rawSetMessages,
  };
}
