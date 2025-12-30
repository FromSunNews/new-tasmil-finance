import type { Address, Hex } from 'viem';

/**
 * SFC (Staking Finance Contract) on U2U Solaris
 * This is the main staking contract for U2U network
 */
export const U2U_SFC_CONTRACT: Address = '0xfc00face00000000000000000000000000000000';

/**
 * SFC Contract ABI - Only the functions we need
 */
export const SFC_ABI = [
  // Staking functions
  {
    name: 'delegate',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'validatorID', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'undelegate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'validatorID', type: 'uint256' },
      { name: 'wrID', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'validatorID', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'restakeRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'validatorID', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'lockStake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'validatorID', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [],
  },
  // Query functions
  {
    name: 'getStake',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'validatorID', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getUnlockedStake',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'validatorID', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pendingRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'validatorID', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'rewardsStash',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'validatorID', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getLockupInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'validatorID', type: 'uint256' },
    ],
    outputs: [
      { name: 'lockedAmount', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'fromEpoch', type: 'uint256' },
    ],
  },
] as const;

/**
 * Standard ERC20 Token ABI
 */
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
