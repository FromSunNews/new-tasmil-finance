"use client";

// 🎨 Chat messages list component

import { memo, type ReactNode, Fragment, useMemo } from 'react';
import Image from 'next/image';
import type { UniversalMessage } from '@/features/chat-v2/types';
import { HumanMessage, AssistantMessage, AssistantLoading } from '@/features/chat-v2/components/messages';
import { ToolCallsRenderer } from '@/features/chat-v2/components/tool-calls-renderer';

interface ChatMessagesProps {
  messages: UniversalMessage[];
  isLoading: boolean;
  onRegenerate: (index: number) => void;
  onEditMessage: (index: number, newContent: string) => void;
}

/**
 * AI Avatar component - reused for tool call UI
 */
function AgentAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden">
      <Image
        src="/images/logo.png"
        alt="AI Assistant"
        width={32}
        height={32}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/**
 * Check if message content is a raw JSON tool result that should be hidden
 */
function isToolResultMessage(message: UniversalMessage): boolean {
  if (message.role !== 'ai') return false;
  
  const content = typeof message.content === 'string' ? message.content.trim() : '';
  if (!content) return false;
  
  // Check if content starts with { and looks like JSON tool result
  if (content.startsWith('{') && content.includes('"success"')) {
    try {
      const parsed = JSON.parse(content);
      // If it has success field, it's likely a tool result
      if ('success' in parsed) return true;
    } catch {
      // Not valid JSON, keep the message
    }
  }
  
  return false;
}

/**
 * Check if message is a tool call message (has toolCalls but no text content)
 * These should be rendered as UI only, not as assistant messages
 */
function isToolCallOnlyMessage(message: UniversalMessage): boolean {
  if (message.role !== 'ai') return false;
  
  const content = typeof message.content === 'string' ? message.content.trim() : '';
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const hasGenerativeUI = !!message.metadata?.['generativeUI'];
  
  // If has toolCalls or generativeUI and no meaningful text content, it's a tool call only message
  return (hasToolCalls || hasGenerativeUI) && !content;
}

/**
 * Render generative UI from a message
 */
function renderGenerativeUI(message: UniversalMessage): ReactNode | null {
  const generativeUI = message.metadata?.['generativeUI'];
  if (!generativeUI) return null;
  
  if (typeof generativeUI === 'function') {
    return (generativeUI as () => ReactNode)();
  }
  
  // Cast to ReactNode for other types
  return generativeUI as ReactNode;
}

function ChatMessagesComponent({
  messages,
  isLoading,
  onRegenerate,
  onEditMessage,
}: ChatMessagesProps) {
  // Build tool results map from tool messages
  const toolResults = useMemo(() => {
    const results = new Map<string, unknown>();
    messages.forEach(msg => {
      // Check if this is a tool result message
      const metadata = msg.metadata as Record<string, unknown> | undefined;
      if (metadata?.['isToolResult'] && metadata?.['toolCallId']) {
        const toolCallId = metadata['toolCallId'] as string;
        try {
          const result = typeof msg.content === 'string' 
            ? JSON.parse(msg.content) 
            : msg.content;
          results.set(toolCallId, result);
        } catch {
          results.set(toolCallId, msg.content);
        }
      }
    });
    return results;
  }, [messages]);

  // Filter out raw JSON tool result messages and tool result messages
  const filteredMessages = messages.filter(msg => {
    // Filter out tool result messages (they're used for data, not display)
    const metadata = msg.metadata as Record<string, unknown> | undefined;
    if (metadata?.['isToolResult']) return false;
    
    // Filter out raw JSON tool result messages
    return !isToolResultMessage(msg);
  });
  
  // Get last messages for loading state logic
  const lastMessage = filteredMessages[filteredMessages.length - 1];
  const lastAiMessage = filteredMessages.filter(m => m.role === 'ai').pop();
  
  // Show loading indicator when:
  // 1. isLoading is true AND
  // 2. Either no AI message yet, OR last message is from human (waiting for AI response)
  const showLoading = isLoading && (!lastAiMessage || lastMessage?.role === 'human');

  // Group messages: assistant text + following tool calls together
  const groupedMessages: Array<{
    type: 'human' | 'assistant' | 'tool-calls';
    messages: UniversalMessage[];
    followingToolCalls: UniversalMessage[]; // Tool call messages that follow an assistant text message
    index: number;
  }> = [];

  let currentToolCallGroup: UniversalMessage[] = [];
  let toolCallGroupStartIndex = -1;

  filteredMessages.forEach((message, index) => {
    if (message.role === 'human') {
      // Flush any pending tool call group
      if (currentToolCallGroup.length > 0) {
        groupedMessages.push({
          type: 'tool-calls',
          messages: currentToolCallGroup,
          followingToolCalls: [],
          index: toolCallGroupStartIndex,
        });
        currentToolCallGroup = [];
      }
      groupedMessages.push({ type: 'human', messages: [message], followingToolCalls: [], index });
    } else if (isToolCallOnlyMessage(message)) {
      // Check if previous group is an assistant message - if so, attach to it
      const lastGroup = groupedMessages[groupedMessages.length - 1];
      if (lastGroup && lastGroup.type === 'assistant') {
        // Attach this tool call to the previous assistant message
        lastGroup.followingToolCalls.push(message);
      } else {
        // Add to standalone tool call group
        if (currentToolCallGroup.length === 0) {
          toolCallGroupStartIndex = index;
        }
        currentToolCallGroup.push(message);
      }
    } else {
      // Flush any pending tool call group
      if (currentToolCallGroup.length > 0) {
        groupedMessages.push({
          type: 'tool-calls',
          messages: currentToolCallGroup,
          followingToolCalls: [],
          index: toolCallGroupStartIndex,
        });
        currentToolCallGroup = [];
      }
      groupedMessages.push({ type: 'assistant', messages: [message], followingToolCalls: [], index });
    }
  });

  // Flush any remaining tool call group
  if (currentToolCallGroup.length > 0) {
    groupedMessages.push({
      type: 'tool-calls',
      messages: currentToolCallGroup,
      followingToolCalls: [],
      index: toolCallGroupStartIndex,
    });
  }

  // Debug: log messages and groups
  console.log('[ChatMessages] filteredMessages:', filteredMessages.map(m => ({
    id: m.id,
    role: m.role,
    content: typeof m.content === 'string' ? m.content.slice(0, 50) : m.content,
    hasToolCalls: !!m.toolCalls?.length,
    toolCallNames: m.toolCalls?.map(tc => tc.name),
    hasGenerativeUI: !!m.metadata?.['generativeUI'],
    isToolCallOnly: isToolCallOnlyMessage(m),
  })));
  console.log('[ChatMessages] groupedMessages:', groupedMessages.map(g => ({
    type: g.type,
    messageCount: g.messages.length,
    followingToolCallsCount: g.followingToolCalls.length,
  })));

  return (
    <div className="flex flex-col gap-4">
      {groupedMessages.map((group) => {
        const firstMessage = group.messages[0];
        if (!firstMessage) return null;

        if (group.type === 'human') {
          return (
            <HumanMessage
              key={firstMessage.id || `human-${group.index}`}
              message={firstMessage}
              isLoading={isLoading}
              onEdit={(newContent) => onEditMessage(group.index, newContent)}
            />
          );
        }

        if (group.type === 'tool-calls') {
          // Render all tool call UIs together with AI avatar
          return (
            <div key={`tool-calls-${group.index}`} className="flex items-start gap-3">
              <AgentAvatar />
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {group.messages.map((msg, idx) => {
                  // If message has multiple tool calls, use ToolCallsRenderer
                  if (msg.toolCalls && msg.toolCalls.length > 1) {
                    return (
                      <ToolCallsRenderer
                        key={msg.id || `tool-renderer-${group.index}-${idx}`}
                        message={msg}
                        toolResults={toolResults}
                      />
                    );
                  }
                  // For single tool call, use generativeUI if available
                  const ui = renderGenerativeUI(msg);
                  if (ui) {
                    return <Fragment key={msg.id || `tool-${group.index}-${idx}`}>{ui}</Fragment>;
                  }
                  // Fallback to ToolCallsRenderer
                  if (msg.toolCalls && msg.toolCalls.length === 1) {
                    return (
                      <ToolCallsRenderer
                        key={msg.id || `tool-renderer-fallback-${group.index}-${idx}`}
                        message={msg}
                        toolResults={toolResults}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        }

        // Assistant message with text content
        return (
          <div key={firstMessage.id || `assistant-${group.index}`}>
            <AssistantMessage
              message={firstMessage}
              isLoading={isLoading}
              handleRegenerate={() => onRegenerate(group.index)}
            />
            {/* Render generative UI if available (for messages with both text and UI) */}
            {firstMessage.metadata?.['generativeUI'] ? (
              <div className="mt-2 ml-11">
                {renderGenerativeUI(firstMessage)}
              </div>
            ) : null}
            {/* Render following tool call UIs (when AI sends text then tool call) */}
            {group.followingToolCalls.length > 0 && (
              <div className="mt-2 ml-11 flex flex-col gap-2">
                {group.followingToolCalls.map((msg, idx) => {
                  // If message has multiple tool calls, use ToolCallsRenderer
                  if (msg.toolCalls && msg.toolCalls.length > 1) {
                    return (
                      <ToolCallsRenderer
                        key={msg.id || `following-tool-renderer-${group.index}-${idx}`}
                        message={msg}
                        toolResults={toolResults}
                      />
                    );
                  }
                  // For single tool call, use generativeUI if available
                  const ui = renderGenerativeUI(msg);
                  if (ui) {
                    return <Fragment key={msg.id || `following-tool-${group.index}-${idx}`}>{ui}</Fragment>;
                  }
                  // Fallback to ToolCallsRenderer
                  if (msg.toolCalls && msg.toolCalls.length === 1) {
                    return (
                      <ToolCallsRenderer
                        key={msg.id || `following-tool-renderer-fallback-${group.index}-${idx}`}
                        message={msg}
                        toolResults={toolResults}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Show loading when waiting for AI response */}
      {showLoading && <AssistantLoading />}
    </div>
  );
}

export const ChatMessages = memo(ChatMessagesComponent);
