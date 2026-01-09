// Bridge-related types will be defined here
export interface BridgeOperation {
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
}

export type BridgeState =
  | { status: 'idle' }
  | { status: 'confirming'; operation: BridgeOperation }
  | { status: 'pending'; txHash: string }
  | { status: 'success'; txHash: string }
  | { status: 'error'; error: string };