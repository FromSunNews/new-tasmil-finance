"use client";

import { ChatStateProvider } from "@/providers/chat-state-provider";
import { ArtifactProvider } from "@/features/chat/thread/components";
import { CopilotChatClient } from "./copilot-chat-client";

interface CopilotChatWrapperProps {
  agentId: string;
  chatId: string;
}

export function CopilotChatWrapper({ agentId, chatId }: CopilotChatWrapperProps) {
  // Convert "new" to null for new chats
  const initialThreadId = chatId === "new" ? null : chatId;
  
  return (
    <ChatStateProvider initialThreadId={initialThreadId}>
      <ArtifactProvider>
        <CopilotChatClient agentId={agentId} chatId={chatId} />
      </ArtifactProvider>
    </ChatStateProvider>
  );
}
