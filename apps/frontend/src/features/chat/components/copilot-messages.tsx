"use client";

import { useChatState } from "@/providers/chat-state-provider";
import { CommandBar } from "@/features/chat/thread/messages/shared";
import { MarkdownText } from "@/features/chat/thread/components/markdown-text";
import { ToolCalls } from "@/features/chat/thread/messages/tool-calls";
import { MultimodalPreview } from "@/features/chat/thread/components/multimodal-preview";
import { isBase64ContentBlock } from "@/lib/multimodal-utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/shared/ui/textarea";
import { useState } from "react";
import Image from "next/image";

// CopilotKit message types
interface CopilotToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status?: "pending" | "running" | "complete" | "error";
}

interface CopilotMessage {
  id: string;
  type: "human" | "ai";
  content: string | ContentBlock[];
  toolCalls?: CopilotToolCall[];
}

interface ContentBlock {
  type: string;
  text?: string;
  image_url?: { url: string };
  [key: string]: unknown;
}

interface CopilotMessageProps {
  message: CopilotMessage;
  isLoading?: boolean;
}

interface CopilotAssistantMessageProps extends CopilotMessageProps {
  handleRegenerate?: () => void;
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

function getContentString(content: CopilotMessage["content"]): string {
  if (typeof content === "string") return content;
  const texts = content
    .filter((c): c is ContentBlock & { type: "text"; text: string } => c.type === "text" && !!c.text)
    .map((c) => c.text);
  return texts.join(" ");
}

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-0"
    />
  );
}

export function HumanMessage({
  message,
  isLoading = false,
  onEdit,
}: CopilotMessageProps & { onEdit?: (newContent: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);

  const handleSubmitEdit = () => {
    setIsEditing(false);
    onEdit?.(value);
  };

  return (
    <div
      className={cn(
        "group ml-auto flex items-center gap-2",
        isEditing && "w-full max-w-xl"
      )}
    >
      <div className={cn("flex flex-col gap-2", isEditing && "w-full")}>
        {isEditing ? (
          <EditableContent
            value={value}
            setValue={setValue}
            onSubmit={handleSubmitEdit}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {/* Render images and files if present */}
            {Array.isArray(message.content) && message.content.length > 0 && (
              <div className="flex flex-wrap items-end justify-end gap-2">
                {message.content.reduce<React.ReactNode[]>((acc, block, idx) => {
                  if (isBase64ContentBlock(block)) {
                    acc.push(
                      <MultimodalPreview key={idx} block={block} size="md" />
                    );
                  }
                  return acc;
                }, [])}
              </div>
            )}
            {/* Render text if present */}
            {contentString ? (
              <p className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right text-sm whitespace-pre-wrap">
                {contentString}
              </p>
            ) : null}
          </div>
        )}

        <div
          className={cn(
            "ml-auto flex items-center gap-2",
            isEditing && "opacity-100"
          )}
        >
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isEditing={isEditing}
            setIsEditing={(c) => {
              if (c) {
                setValue(contentString);
              }
              setIsEditing(c);
            }}
            handleSubmitEdit={handleSubmitEdit}
            isHumanMessage={true}
          />
        </div>
      </div>
    </div>
  );
}

export function AssistantMessage({
  message,
  isLoading = false,
  handleRegenerate,
}: CopilotAssistantMessageProps) {
  const contentString = getContentString(message.content);
  const { hideToolCalls } = useChatState();

  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.toolCalls?.some((tc) => tc.args && Object.keys(tc.args).length > 0);

  return (
    <div className="group mr-auto flex w-full items-start gap-3">
      <AgentAvatar />
      <div className="flex w-full flex-col gap-2 min-w-0">
        {/* 1. Tool Calls (Running state) */}
        {!hideToolCalls && hasToolCalls && toolCallsHaveContents && (
          <ToolCalls toolCalls={message.toolCalls!} />
        )}

        {/* 2. AI Text Response */}
        {contentString.length > 0 && (
          <div className="py-1">
            <MarkdownText>{contentString}</MarkdownText>
          </div>
        )}

        {/* Command bar - only show if there's text content */}
        {contentString.length > 0 && (
          <div className="mr-auto flex items-center gap-2">
            <CommandBar
              content={contentString}
              isLoading={isLoading}
              isAiMessage={true}
              handleRegenerate={handleRegenerate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-3">
      <AgentAvatar />
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-wave rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-wave rounded-full [animation-delay:0.15s]"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-wave rounded-full [animation-delay:0.3s]"></div>
      </div>
    </div>
  );
}

// Export aliases for compatibility
export const CopilotHumanMessage = HumanMessage;
export const CopilotAssistantMessage = AssistantMessage;
export const CopilotAssistantMessageLoading = AssistantMessageLoading;
