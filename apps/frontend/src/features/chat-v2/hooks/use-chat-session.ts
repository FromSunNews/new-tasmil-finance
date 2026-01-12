"use client";

/**
 * 🪝 Chat Session Hook
 * 
 * Orchestrates chat functionality with CopilotKit and LangGraph.
 * 
 * Flow for new chat (/new → /{threadId}):
 * 1. User sends message on /new
 * 2. Create thread via LangGraph
 * 3. Store message in PendingMessageProvider
 * 4. Navigate to /{threadId}
 * 5. Detect pending message, send via CopilotKit
 * 6. Clear pending message
 * 
 * Flow for existing chat:
 * 1. Load history from LangGraph
 * 2. Display messages
 * 3. Send new messages via CopilotKit
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useCopilotChat } from '@/features/chat-v2/hooks/use-copilot-chat';
import { useLangGraph, useChatState, usePendingMessage } from '@/features/chat-v2/providers';
import { historyService } from '@/features/chat-v2/services';
import type { UniversalMessage, ContentBlock, ToolCall } from '@/features/chat-v2/types';

interface UseChatSessionOptions {
  agentId: string;
  chatId: string;
  onNewThread?: (threadId: string) => void;
}

export function useChatSession(options: UseChatSessionOptions) {
  const { agentId, chatId, onNewThread } = options;
  const isNewChat = chatId === 'new';
  
  // Providers
  const { threadId, setThreadId } = useChatState();
  const { pendingMessage, setPendingMessage, clearPendingMessage } = usePendingMessage();
  const { createThread, isInitialized } = useLangGraph();
  
  // Local state
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Refs to prevent duplicate operations
  const hasSentPendingMessage = useRef(false);
  const hasLoadedHistory = useRef(false);

  // CopilotKit hook
  const {
    messages: rawMessages,
    sendMessage: copilotSendMessage,
    stopGeneration: copilotStopGeneration,
    isLoading,
    setMessages: copilotSetMessages,
  } = useCopilotChat();

  // Convert CopilotKit messages to Universal format
  const messages = useMemo<UniversalMessage[]>(() => {
    return rawMessages.map((msg) => {
      const toolCalls: ToolCall[] = msg.toolCalls?.map((tc) => ({
        id: tc.id,
        name: tc.name ?? 'unknown',
        args: tc.args ?? {},
        result: tc.result,
        status: tc.status ?? 'pending',
      })) || [];

      // Determine role - tool messages should be treated as 'ai' for display purposes
      const role = msg.role === "user" ? "human" as const : "ai" as const;

      return {
        id: msg.id,
        role,
        content: msg.content || "",
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        metadata: {
          generativeUI: msg.generativeUI,
          rawMessage: msg,
          // Include tool result info for tool messages
          ...(msg.role === 'tool' && {
            isToolResult: true,
            toolCallId: msg.toolCallId,
            toolName: msg.toolName,
          }),
        },
      };
    });
  }, [rawMessages]);

  // Reset refs when chatId changes
  useEffect(() => {
    hasSentPendingMessage.current = false;
    hasLoadedHistory.current = false;
    
    // Clear messages and pending message when entering /new
    if (isNewChat) {
      copilotSetMessages([]);
      clearPendingMessage();
    }
  }, [chatId, isNewChat, copilotSetMessages, clearPendingMessage]);

  // Sync threadId with chatId
  useEffect(() => {
    if (!isNewChat && chatId !== threadId) {
      setThreadId(chatId);
    }
  }, [chatId, isNewChat, threadId, setThreadId]);

  // Handle pending message after navigation to new thread
  useEffect(() => {
    if (
      !isNewChat &&
      pendingMessage &&
      isInitialized &&
      !hasSentPendingMessage.current
    ) {
      hasSentPendingMessage.current = true;
      
      // Small delay to ensure CopilotKit is mounted
      const timer = setTimeout(() => {
        copilotSendMessage(pendingMessage);
        clearPendingMessage();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [chatId, isNewChat, pendingMessage, isInitialized, copilotSendMessage, clearPendingMessage]);

  // Load history for existing threads (skip if we just created this thread)
  useEffect(() => {
    if (
      isNewChat ||
      !isInitialized ||
      hasLoadedHistory.current ||
      pendingMessage // Skip if we have pending message (just created thread)
    ) {
      return;
    }

    let cancelled = false;
    hasLoadedHistory.current = true;
    setIsLoadingHistory(true);

    async function loadHistory() {
      try {
        const historyMessages = await historyService.getHistory(chatId);
        
        if (cancelled) return;
        
        if (historyMessages.length > 0) {
          const copilotMessages = historyMessages.map(msg => ({
            id: msg.id,
            role: msg.role === 'human' ? 'user' as const : 'assistant' as const,
            content: typeof msg.content === 'string' ? msg.content : '',
            toolCalls: msg.toolCalls?.map(tc => ({
              id: tc.id,
              name: tc.name,
              args: tc.args,
              result: tc.result,
              status: tc.status,
            })),
          }));
          
          copilotSetMessages(copilotMessages);
        }
      } catch (err) {
        console.error('[ChatSession] Failed to load history:', err);
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();
    
    return () => { cancelled = true; };
  }, [chatId, isNewChat, isInitialized, pendingMessage, copilotSetMessages]);

  // Send message handler
  const sendMessage = useCallback(async (content: string, _attachments?: ContentBlock[]) => {
    try {
      setError(null);

      // For new chat: create thread first, then redirect
      if (isNewChat && isInitialized) {
        const newThread = await createThread({
          metadata: { agentId, title: content.slice(0, 50) },
        });
        
        if (newThread) {
          setPendingMessage(content);
          setThreadId(newThread.id);
          onNewThread?.(newThread.id);
          return;
        }
      }

      // For existing thread: send directly
      copilotSendMessage(content);
    } catch (err) {
      console.error('[ChatSession] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    }
  }, [isNewChat, isInitialized, agentId, createThread, setPendingMessage, setThreadId, onNewThread, copilotSendMessage]);

  // Regenerate message
  const regenerate = useCallback((messageId: string) => {
    const messageIndex = rawMessages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const messagesBeforeAI = rawMessages.slice(0, messageIndex);
    const lastUserMessage = [...messagesBeforeAI].reverse().find((m) => m.role === "user");
    
    if (!lastUserMessage) return;

    copilotSetMessages(messagesBeforeAI);
    setTimeout(() => copilotSendMessage(lastUserMessage.content), 100);
  }, [rawMessages, copilotSetMessages, copilotSendMessage]);

  // Edit message
  const editMessage = useCallback((messageId: string, newContent: string) => {
    const messageIndex = rawMessages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    copilotSetMessages(rawMessages.slice(0, messageIndex));
    setTimeout(() => copilotSendMessage(newContent), 100);
  }, [rawMessages, copilotSetMessages, copilotSendMessage]);

  return {
    messages,
    isLoading,
    isLoadingHistory: isLoadingHistory && messages.length === 0,
    error,
    sendMessage,
    regenerate,
    editMessage,
    stopGeneration: copilotStopGeneration,
    clearMessages: () => copilotSetMessages([]),
  };
}
