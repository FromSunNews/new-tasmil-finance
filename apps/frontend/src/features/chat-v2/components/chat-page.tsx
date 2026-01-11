"use client";

// 🎨 Chat page - top-level page component

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChatProvider, CopilotKitWrapper } from '@/features/chat-v2/providers';
import { ChatContainer } from '@/features/chat-v2/components/chat-container';

interface ChatPageProps {
  agentId: string;
  chatId: string;
}

export function ChatPage({ agentId, chatId }: ChatPageProps) {
  const router = useRouter();

  // Handle new thread creation - redirect to the new thread URL
  const handleNewThread = useCallback((threadId: string) => {
    router.replace(`/chat/${agentId}/${threadId}`);
  }, [router, agentId]);

  // Determine initial thread ID - use chatId directly for CopilotKit
  // CopilotKitWrapper will handle 'new' case internally
  const initialThreadId = chatId === 'new' ? null : chatId;

  return (
    <CopilotKitWrapper threadId={chatId} agentId={agentId}>
      <ChatProvider initialThreadId={initialThreadId}>
        <ChatContainer
          agentId={agentId}
          chatId={chatId}
          onNewThread={handleNewThread}
        />
      </ChatProvider>
    </CopilotKitWrapper>
  );
}
