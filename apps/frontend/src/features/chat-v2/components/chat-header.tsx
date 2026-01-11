"use client";

// 🎨 Chat header component

import { memo } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button-v2';
import { useMultiSidebar } from '@/shared/ui/multi-sidebar';
import { getAgentConfig } from '@/features/chat-v2/config';

interface ChatHeaderProps {
  agentId: string;
  chatId: string;
}

function ChatHeaderComponent({ agentId, chatId }: ChatHeaderProps) {
  const router = useRouter();
  const { toggleRightSidebar } = useMultiSidebar();
  
  const config = getAgentConfig(agentId);
  const chatTitle = chatId === 'new' ? 'New Chat' : `Chat with ${config.name}`;

  return (
    <header className="flex shrink-0 items-center gap-3 bg-background px-4 py-3">
      <Button className="h-8 w-8 p-0" onClick={() => router.push('/agents')} variant="outline">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold text-foreground text-lg">{chatTitle}</span>
      <div className="ml-auto">
        <Button className="h-9 w-9 p-0" onClick={toggleRightSidebar} variant="ghost">
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);
