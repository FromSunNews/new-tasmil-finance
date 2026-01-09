// Yield farming related types will be defined here
export interface YieldPool {
  id: string;
  name: string;
  apy: number;
  tvl: string;
  tokens: string[];
}

export interface YieldOperation {
  type: 'deposit' | 'withdraw' | 'harvest';
  poolId: string;
  amount?: string;
}

export type YieldState =
  | { status: 'idle' }
  | { status: 'confirming'; operation: YieldOperation }
  | { status: 'pending'; txHash: string }
  | { status: 'success'; txHash: string }
  | { status: 'error'; error: string };