"use client";

// 🎨 Assistant message component - matches old UI styling

import { memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CommandBar } from '@/features/chat/thread/messages/shared';
import { MarkdownText } from '@/features/chat/thread/components/markdown-text';
import { ToolCalls } from '@/features/chat/thread/messages/tool-calls';
import { useChatState } from '@/features/chat-v2/providers';
import type { UniversalMessage } from '@/features/chat-v2/types';
import { getTextFromContent } from '@/features/chat-v2/types';

interface AssistantMessageProps {
  message: UniversalMessage;
  isLoading?: boolean;
  handleRegenerate?: () => void;
  className?: string;
}

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

function AssistantMessageComponent({ 
  message, 
  isLoading = false,
  handleRegenerate: _handleRegenerate,
  className 
}: AssistantMessageProps) {
  const contentString = getTextFromContent(message.content);
  const { hideToolCalls } = useChatState();

  // Convert toolCalls to old format for ToolCalls component
  const toolCalls = message.toolCalls?.map(tc => ({
    id: tc.id,
    name: tc.name,
    args: tc.args,
    result: tc.result,
    status: tc.status,
  }));

  const hasToolCalls = toolCalls && toolCalls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    toolCalls?.some((tc) => tc.args && Object.keys(tc.args).length > 0);

  return (
    <div className={cn('group mr-auto flex w-full items-start gap-3', className)}>
      <AgentAvatar />
      <div className="flex w-full flex-col gap-2 min-w-0">
        {/* 1. Tool Calls (Running state) */}
        {!hideToolCalls && hasToolCalls && toolCallsHaveContents && (
          <ToolCalls toolCalls={toolCalls!} />
        )}

        {/* 2. AI Text Response */}
        {contentString.length > 0 && (
          <div className="py-1">
            <MarkdownText>{contentString}</MarkdownText>
          </div>
        )}

        {/* Copy only - regenerate disabled */}
        {contentString.length > 0 && (
          <div className="mr-auto flex items-center gap-2">
            <CommandBar
              content={contentString}
              isLoading={isLoading}
              isAiMessage={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const AssistantMessage = memo(AssistantMessageComponent);
