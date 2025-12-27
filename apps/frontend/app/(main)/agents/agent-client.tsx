"use client";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";

type AgentClientProps = {
  id: string;
  initialChatModel: string;
};

export function AgentClient({
  id,
  initialChatModel,
}: AgentClientProps) {
  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={initialChatModel}
        initialMessages={[]}
        // isReadonly={false} // REMOVED: No longer needed
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
