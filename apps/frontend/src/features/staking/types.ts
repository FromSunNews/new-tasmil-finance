// Staking-related types will be defined here
export type StakingAmount = string & { readonly brand: unique symbol };
export type ValidatorID = number & { readonly brand: unique symbol };
export type StakingReward = string & { readonly brand: unique symbol };

export interface StakingOperation {
  type: 'delegate' | 'undelegate' | 'claim' | 'restake';
  validatorId: ValidatorID;
  amount?: StakingAmount;
  lockupDuration?: number;
}

export type StakingState =
  | { status: 'idle' }
  | { status: 'confirming'; operation: StakingOperation }
  | { status: 'pending'; txHash: string }
  | { status: 'success'; txHash: string; receipt: any }
  | { status: 'error'; error: string };