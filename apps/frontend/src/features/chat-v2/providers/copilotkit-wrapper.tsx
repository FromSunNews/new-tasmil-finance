"use client";

/**
 * 🔌 CopilotKit Wrapper
 * 
 * Wraps CopilotKit with proper threadId handling.
 * Uses key prop to force remount when thread changes.
 */

import { CopilotKit } from "@copilotkit/react-core";
import { type ReactNode, useMemo } from "react";

interface CopilotKitWrapperProps {
  children: ReactNode;
  threadId?: string | null;
  agentId?: string;
}

export function CopilotKitWrapper({ 
  children, 
  threadId,
  agentId = "staking_agent" 
}: CopilotKitWrapperProps) {
  const isNewChat = !threadId || threadId === 'new';
  const effectiveThreadId = isNewChat ? undefined : threadId;
  
  // Generate unique key for new chats to force fresh CopilotKit instance
  // For existing threads, use threadId as key
  const copilotKey = useMemo(() => {
    return isNewChat ? `new-${Date.now()}` : threadId;
  }, [isNewChat, threadId]);

  return (
    <CopilotKit
      key={copilotKey}
      publicLicenseKey="ck_pub_a5222175043d4a16f4dfdbf4ddca42a1"
      runtimeUrl="/api/copilotkit"
      agent={agentId}
      threadId={effectiveThreadId}
    >
      {children}
    </CopilotKit>
  );
}
