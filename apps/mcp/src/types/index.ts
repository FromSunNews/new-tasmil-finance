import type { Address, Hex } from 'viem';

/**
 * Common tool result type for MCP tools
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Transaction build result
 */
export interface TransactionData {
  chainId: number;
  to: Address;
  value: bigint;
  data?: Hex;
  gas?: bigint;
  gasPrice?: bigint;
  nonce?: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

/**
 * Bridge pair information
 */
export interface BridgePair {
  tokenName: string;
  fromChain: string;
  toChain: string;
  fromTokenAddress: Address;
  toTokenAddress: Address;
  minAmount: string;
  maxAmount: string;
  contractAddress: Address;
}

/**
 * Validator information
 */
export interface ValidatorInfo {
  validatorID: number;
  status: string;
  createdEpoch: string;
  createdTime: string;
  authAddress: Address;
  isActive: boolean;
  totalStake?: string;
  selfStake?: string;
  delegatorCount?: number;
}

/**
 * Lockup information
 */
export interface LockupInfo {
  lockedAmount: string;
  endDate: string;
  durationDays: number;
  fromEpoch: string;
}

/**
 * Staking statistics
 */
export interface StakingStatistics {
  totalStaked: string;
  totalDelegated: string;
  totalSelfStaked: string;
  totalValidator: number;
  totalDelegator: number;
}
