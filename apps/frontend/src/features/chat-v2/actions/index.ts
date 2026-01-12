// ⚡ CopilotKit actions - Public exports

// 🎨 Tool renders for custom UI (useRenderToolCall)
// These render custom UI when backend tools are called
export { useStakingRenders } from '@/features/chat-v2/actions/staking-renders.action';
export { useBridgeRenders } from '@/features/chat-v2/actions/bridge-renders.action';
export { useYieldRenders } from '@/features/chat-v2/actions/yield-renders.action';
export { useResearchRenders } from '@/features/chat-v2/actions/research.action';

// UI Components
export * from '@/features/chat-v2/actions/components';

// Combined hook to register all DeFi renders
import { useStakingReadOnlyRenders, useStakingWalletTools } from '@/features/chat-v2/actions/staking-renders.action';
import { useBridgeRenders } from '@/features/chat-v2/actions/bridge-renders.action';
import { useYieldRenders } from '@/features/chat-v2/actions/yield-renders.action';
import { useResearchRenders } from '@/features/chat-v2/actions/research.action';

/**
 * Register DeFi actions based on current agent
 * - Staking wallet tools (useHumanInTheLoop) only for staking_agent
 * - Renders (useRenderToolCall) for all agents to display backend tool results
 */
export function useDefiActions(_agentId?: string) {
  // Register read-only renders for all agents (they just display backend tool results)
  useStakingReadOnlyRenders();
  useBridgeRenders();
  useYieldRenders();
  useResearchRenders();
}

/**
 * Register staking wallet tools - ONLY call this for staking_agent
 * This is a separate hook to avoid registering wallet tools for other agents
 */
export function useStakingActions() {
  useStakingWalletTools();
}
