"use client";

import { PendingMessageProvider } from "@/features/chat-v2/providers";

/**
 * Layout for agent-level chat routes
 * PendingMessageProvider is placed here (not in [chatId]/layout.tsx)
 * so it persists when navigating from /new to /{threadId}
 */
export default function AgentChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <PendingMessageProvider>
      {children}
    </PendingMessageProvider>
  );
}
