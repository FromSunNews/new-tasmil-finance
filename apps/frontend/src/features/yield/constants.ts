// Yield farming related constants will be defined here
export const YIELD_OPERATIONS = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  HARVEST: 'harvest',
} as const;

export const YIELD_STATUS = {
  IDLE: 'idle',
  CONFIRMING: 'confirming',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;