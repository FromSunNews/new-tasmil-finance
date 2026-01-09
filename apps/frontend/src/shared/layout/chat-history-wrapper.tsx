"use client";

import { ThreadProvider } from "@/providers/thread";
import { ChatStateProvider } from "@/providers/chat-state-provider";
import { ChatHistorySidebar } from "@/shared/layout/chat-history-sidebar";

export function ChatHistoryWrapper() {
  return (
    <ChatStateProvider>
      <ThreadProvider>
        <ChatHistorySidebar />
      </ThreadProvider>
    </ChatStateProvider>
  );
}
