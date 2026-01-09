// Staking-related constants will be defined here
export const STAKING_OPERATIONS = {
  DELEGATE: 'delegate',
  UNDELEGATE: 'undelegate',
  CLAIM: 'claim',
  RESTAKE: 'restake',
} as const;

export const STAKING_STATUS = {
  IDLE: 'idle',
  CONFIRMING: 'confirming',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;