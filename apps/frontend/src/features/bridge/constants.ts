// Bridge-related constants will be defined here
export const SUPPORTED_CHAINS = {
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  BSC: 'bsc',
  ARBITRUM: 'arbitrum',
} as const;

export const BRIDGE_STATUS = {
  IDLE: 'idle',
  CONFIRMING: 'confirming',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;