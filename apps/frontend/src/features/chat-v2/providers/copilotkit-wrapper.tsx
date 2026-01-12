"use client";

/**
 * 🔌 CopilotKit Wrapper
 * 
 * Wraps CopilotKit with proper threadId handling.
 * Uses key prop to force remount when thread changes.
 * 
 * Supported agents:
 * - staking_agent: U2U Network staking operations
 * - bridge_agent: Cross-chain token bridging
 * - research_agent: Crypto market research
 * - yield_agent: DeFi yield farming
 */

import { CopilotKit } from "@copilotkit/react-core";
import { type ReactNode, useMemo } from "react";

interface CopilotKitWrapperProps {
  children: ReactNode;
  threadId?: string | null;
  agentId?: string;
}

// Valid agent IDs that match backend LANGSERVE_GRAPHS config
export type AgentId = "staking_agent" | "bridge_agent" | "research_agent" | "yield_agent";

export function CopilotKitWrapper({ 
  children, 
  threadId,
  agentId = "staking_agent" 
}: CopilotKitWrapperProps) {
  const isNewChat = !threadId || threadId === 'new';
  const effectiveThreadId = isNewChat ? undefined : threadId;
  
  // Generate unique key that includes agentId to force remount when agent changes
  // For new chats, include timestamp to ensure fresh instance
  const copilotKey = useMemo(() => {
    return isNewChat ? `${agentId}-new-${Date.now()}` : `${agentId}-${threadId}`;
  }, [isNewChat, threadId, agentId]);

  // Debug log
  console.log('[CopilotKitWrapper] agentId:', agentId, 'threadId:', threadId, 'key:', copilotKey);

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
