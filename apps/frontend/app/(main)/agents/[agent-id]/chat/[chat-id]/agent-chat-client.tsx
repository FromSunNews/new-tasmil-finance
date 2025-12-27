"use client";

import { useEffect } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { useNavigation } from "@/context/nav-context";
import type { ChatMessage } from "@/lib/types";

// Agent display names mapping
const agentDisplayNames: Record<string, string> = {
  staking: "Staking Agent",
  research: "Research Agent",
  yield: "Yield Agent",
  bridge: "Bridge Agent",
};

interface AgentChatClientProps {
  chatId: string;
  initialChatModel: string;
  initialMessages: ChatMessage[];
  agentId: string;
  autoResume: boolean;
}

export function AgentChatClient({
  chatId,
  initialChatModel,
  initialMessages,
  agentId,
  autoResume,
}: AgentChatClientProps) {
  const { setNavItems } = useNavigation();

  useEffect(() => {
    const agentName = agentDisplayNames[agentId] || "DeFi Agent";
    setNavItems({
      title: agentName,
      icon: `/agents/${agentId}-agent.svg`,
    });
  }, [agentId, setNavItems]);

  console.log("[AgentChatClient] Rendering with:", {
    chatId,
    messagesCount: initialMessages.length,
    initialMessages: initialMessages.slice(0, 2),
    agentId,
  });

  return (
    <>
      <Chat
        autoResume={autoResume}
        id={chatId}
        initialChatModel={initialChatModel}
        initialMessages={initialMessages}
        agentId={agentId}
      />
      <DataStreamHandler />
    </>
  );
}

