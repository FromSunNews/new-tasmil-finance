"use client";

// 🔌 CopilotKit wrapper with threadId support for message persistence

import { CopilotKit } from "@copilotkit/react-core";
import { type ReactNode } from "react";

interface CopilotKitWrapperProps {
  children: ReactNode;
  threadId?: string | null;
  agentId?: string;
}

/**
 * Wrapper component that provides CopilotKit with threadId
 * This ensures messages are persisted to the correct LangGraph thread
 * 
 * IMPORTANT: We use `key` prop to force CopilotKit to remount when threadId changes.
 * This ensures that when navigating from /new to /{threadId}, CopilotKit
 * reinitializes with the correct threadId for message persistence.
 */
export function CopilotKitWrapper({ 
  children, 
  threadId,
  agentId = "staking_agent" 
}: CopilotKitWrapperProps) {
  // Only pass threadId if it's a valid UUID (not 'new' or null)
  const effectiveThreadId = threadId && threadId !== 'new' ? threadId : undefined;
  
  // Use threadId as key to force remount when it changes
  // This ensures CopilotKit is properly initialized with the new threadId
  const copilotKey = effectiveThreadId || 'new-chat';

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
