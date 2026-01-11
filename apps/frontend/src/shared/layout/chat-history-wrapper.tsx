"use client";

import { ThreadProvider } from "@/providers/thread";
import { ChatHistorySidebar } from "@/shared/layout/chat-history-sidebar";

export function ChatHistoryWrapper() {
  return (
    <ThreadProvider>
      <ChatHistorySidebar />
    </ThreadProvider>
  );
}
