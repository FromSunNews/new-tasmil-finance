"use client";

/**
 * 🎨 Tool Calls Renderer
 * 
 * Renders all tool calls in a message using registered renderers.
 * This solves the CopilotKit limitation where only the first tool call gets generativeUI.
 */

import { Fragment } from 'react';
import type { UniversalMessage } from '@/features/chat-v2/types';
import { StakingInfoCard } from '@/features/chat-v2/actions/components';

const STAKING_INFO_TOOLS: Record<string, { type: 'user_stake' | 'pending_rewards' | 'unlocked_stake' | 'lockup_info' | 'rewards_stash' }> = {
  'u2u_staking_get_user_stake': { type: 'user_stake' },
  'u2u_staking_get_pending_rewards': { type: 'pending_rewards' },
  'u2u_staking_get_unlocked_stake': { type: 'unlocked_stake' },
  'u2u_staking_get_lockup_info': { type: 'lockup_info' },
  'u2u_staking_get_rewards_stash': { type: 'rewards_stash' },
};

interface ToolCallsRendererProps {
  message: UniversalMessage;
  toolResults: Map<string, unknown>;
}

/**
 * Render all tool calls in a message
 */
export function ToolCallsRenderer({ message, toolResults }: ToolCallsRendererProps) {
  const toolCalls = message.toolCalls;
  
  if (!toolCalls?.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((toolCall, index) => {
        const config = STAKING_INFO_TOOLS[toolCall.name];
        if (!config) return null;

        // Get result from tool results map or from toolCall itself
        const result = toolResults.get(toolCall.id) ?? toolCall.result;
        
        // Determine status
        let status: 'pending' | 'executing' | 'complete' | 'error' | 'inProgress' = 'pending';
        if (result !== undefined) {
          status = 'complete';
        } else if (toolCall.status === 'running') {
          status = 'executing';
        } else if (toolCall.status === 'error') {
          status = 'error';
        }

        return (
          <Fragment key={toolCall.id || `tool-${index}`}>
            <StakingInfoCard
              type={config.type}
              args={toolCall.args}
              result={result}
              status={status}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
