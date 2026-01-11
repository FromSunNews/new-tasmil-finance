"use client";

import { useParams } from "next/navigation";
import { ChatPage } from "@/features/chat-v2";

export default function ChatPageRoute() {
  const params = useParams();
  const agentId = params['agentId'] as string;
  const chatId = params['chatId'] as string;

  return <ChatPage agentId={agentId} chatId={chatId} />;
}
