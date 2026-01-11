// ⚡ CopilotKit actions - Public exports
export { useStakingAction } from '@/features/chat-v2/actions/staking.action';
export { useBridgeAction } from '@/features/chat-v2/actions/bridge.action';
export { useYieldAction } from '@/features/chat-v2/actions/yield.action';
export { usePortfolioAction } from '@/features/chat-v2/actions/portfolio.action';

// Combined hook to register all DeFi actions
import { useStakingAction } from '@/features/chat-v2/actions/staking.action';
import { useBridgeAction } from '@/features/chat-v2/actions/bridge.action';
import { useYieldAction } from '@/features/chat-v2/actions/yield.action';
import { usePortfolioAction } from '@/features/chat-v2/actions/portfolio.action';

export function useDefiActions() {
  useStakingAction();
  useBridgeAction();
  useYieldAction();
  usePortfolioAction();
}
