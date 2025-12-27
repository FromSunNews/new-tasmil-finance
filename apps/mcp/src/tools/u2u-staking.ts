/**
 * U2U Staking Tools
 * 
 * These tools handle staking operations and user-specific staking queries on U2U Solaris network.
 * Agent: u2_staking_agent
 * Tools: 10
 */

import type { Server } from '@modelcontextprotocol/sdk/server';
import { encodeFunctionData, parseEther, formatEther, type Address } from 'viem';
import { build_txn, submit_txn, query } from '../utils/blockchain.js';
import { U2U_SFC_CONTRACT, SFC_ABI } from '../utils/contracts.js';
import type { ToolResult } from '../types/index.js';

const U2U_CHAIN_ID = 39; // U2U Solaris Mainnet

/**
 * Register all U2U staking tools with the MCP server
 */
/**
 * Handle U2U Staking tool calls
 */
export async function handleU2UStakingToolCall(request: any) {
  const toolName = request.params.name;

  // Transaction Tools (5 tools)
  
  if (toolName === 'u2u_staking_delegate') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        amount: string;
        delegatorAddress?: string;
      };

      const validatorID = BigInt(args.validatorID);
      const amount = parseEther(args.amount);

      // Build transaction using core infrastructure
      const txData = build_txn({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        value: amount,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'delegate',
          args: [validatorID],
        }),
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              action: 'u2u_staking_delegate',
              validatorID: args.validatorID,
              amount: args.amount,
              amountFormatted: `${args.amount} U2U`,
              transactionData: txData,
              message: `Ready to stake ${args.amount} U2U to validator ${args.validatorID}`,
              requiresWallet: true,
              requiresConfirmation: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_undelegate') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        amount: string;
        wrID?: string;
        delegatorAddress?: string;
      };

      const validatorID = BigInt(args.validatorID);
      const amount = parseEther(args.amount);
      const wrID = args.wrID ? BigInt(args.wrID) : BigInt(Math.floor(Math.random() * 1_000_000));

      const txData = build_txn({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        value: 0n,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'undelegate',
          args: [validatorID, wrID, amount],
        }),
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              action: 'u2u_staking_undelegate',
              validatorID: args.validatorID,
              amount: args.amount,
              wrID: wrID.toString(),
              transactionData: txData,
              message: `Ready to unstake ${args.amount} U2U from validator ${args.validatorID}`,
              requiresWallet: true,
              requiresConfirmation: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_claim_rewards') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        delegatorAddress?: string;
      };

      const validatorID = BigInt(args.validatorID);

      const txData = build_txn({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        value: 0n,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'claimRewards',
          args: [validatorID],
        }),
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              action: 'u2u_staking_claim_rewards',
              validatorID: args.validatorID,
              transactionData: txData,
              message: `Ready to claim rewards from validator ${args.validatorID}`,
              requiresWallet: true,
              requiresConfirmation: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_restake_rewards') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        delegatorAddress?: string;
      };

      const validatorID = BigInt(args.validatorID);

      const txData = build_txn({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        value: 0n,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'restakeRewards',
          args: [validatorID],
        }),
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              action: 'u2u_staking_restake_rewards',
              validatorID: args.validatorID,
              transactionData: txData,
              message: `Ready to restake rewards for validator ${args.validatorID}`,
              requiresWallet: true,
              requiresConfirmation: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_lock_stake') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        amount: string;
        lockupDuration: string;
        delegatorAddress?: string;
      };

      const validatorID = BigInt(args.validatorID);
      const durationDays = parseInt(args.lockupDuration);
      const durationSeconds = BigInt(durationDays * 24 * 60 * 60);

      const txData = build_txn({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        value: 0n,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'lockStake',
          args: [validatorID, durationSeconds],
        }),
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              action: 'u2u_staking_lock_stake',
              validatorID: args.validatorID,
              amount: args.amount,
              lockupDurationDays: durationDays,
              transactionData: txData,
              message: `Ready to lock ${args.amount} U2U for ${durationDays} days on validator ${args.validatorID}`,
              requiresWallet: true,
              requiresConfirmation: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  // Query Tools (5 tools)

  if (toolName === 'u2u_staking_get_user_stake') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        delegatorAddress: string;
      };

      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'getStake',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });

      const stakeAmount = result ? BigInt(result) : 0n;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              validatorID: args.validatorID,
              delegatorAddress: args.delegatorAddress,
              stake: {
                raw: stakeAmount.toString(),
                formatted: formatEther(stakeAmount) + ' U2U',
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_get_unlocked_stake') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        delegatorAddress: string;
      };

      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'getUnlockedStake',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });

      const unlockedAmount = result ? BigInt(result) : 0n;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              validatorID: args.validatorID,
              delegatorAddress: args.delegatorAddress,
              unlockedStake: {
                raw: unlockedAmount.toString(),
                formatted: formatEther(unlockedAmount) + ' U2U',
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_get_pending_rewards') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        delegatorAddress: string;
      };

      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'pendingRewards',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });

      const rewardsAmount = result ? BigInt(result) : 0n;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              validatorID: args.validatorID,
              delegatorAddress: args.delegatorAddress,
              pendingRewards: {
                raw: rewardsAmount.toString(),
                formatted: formatEther(rewardsAmount) + ' U2U',
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_get_rewards_stash') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        delegatorAddress: string;
      };

      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'rewardsStash',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });

      const stashAmount = result ? BigInt(result) : 0n;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              validatorID: args.validatorID,
              delegatorAddress: args.delegatorAddress,
              rewardsStash: {
                raw: stashAmount.toString(),
                formatted: formatEther(stashAmount) + ' U2U',
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  if (toolName === 'u2u_staking_get_lockup_info') {
    try {
      const args = request.params.arguments as {
        validatorID: string;
        delegatorAddress: string;
      };

      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'getLockupInfo',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });

      // Parse the result (tuple of 4 values)
      // TODO: Properly decode the tuple result
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              validatorID: args.validatorID,
              delegatorAddress: args.delegatorAddress,
              lockupInfo: {
                raw: result,
                // TODO: Parse and format the lockup info properly
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

/**
 * Tool schemas for U2U Staking agent
 */
export const u2uStakingToolSchemas = [
  // Transaction tools
  {
    name: 'u2u_staking_delegate',
    description: 'Stake U2U tokens to a validator to earn rewards. Use this when users want to stake their U2U tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID to delegate to (e.g., "1", "2", "3")' },
        amount: { type: 'string', description: 'Amount of U2U tokens to stake (e.g., "100.0", "50.5")' },
        delegatorAddress: { type: 'string', description: 'Delegator address (optional, uses connected wallet)' },
      },
      required: ['validatorID', 'amount'],
    },
  },
  {
    name: 'u2u_staking_undelegate',
    description: 'Unstake U2U tokens from a validator. Use this when users want to unstake their tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID to undelegate from' },
        amount: { type: 'string', description: 'Amount of U2U tokens to unstake' },
        wrID: { type: 'string', description: 'Withdrawal Request ID (optional)' },
        delegatorAddress: { type: 'string', description: 'Delegator address (optional)' },
      },
      required: ['validatorID', 'amount'],
    },
  },
  {
    name: 'u2u_staking_claim_rewards',
    description: 'Claim pending rewards from a validator. Use this when users want to claim their earned rewards.',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID to claim rewards from' },
        delegatorAddress: { type: 'string', description: 'Delegator address (optional)' },
      },
      required: ['validatorID'],
    },
  },
  {
    name: 'u2u_staking_restake_rewards',
    description: 'Restake (compound) rewards from a validator. Use this when users want to compound their rewards.',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID to restake rewards for' },
        delegatorAddress: { type: 'string', description: 'Delegator address (optional)' },
      },
      required: ['validatorID'],
    },
  },
  {
    name: 'u2u_staking_lock_stake',
    description: 'Lock stake for additional rewards. Use this when users want to lock their stake for bonus rewards.',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID to lock stake for' },
        amount: { type: 'string', description: 'Amount of U2U tokens to lock' },
        lockupDuration: { type: 'string', description: 'Lockup duration in days (e.g., "7", "14", "30")' },
        delegatorAddress: { type: 'string', description: 'Delegator address (optional)' },
      },
      required: ['validatorID', 'amount', 'lockupDuration'],
    },
  },
  // Query tools
  {
    name: 'u2u_staking_get_user_stake',
    description: 'Get amount user has staked to a validator',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID' },
        delegatorAddress: { type: 'string', description: 'Delegator address' },
      },
      required: ['validatorID', 'delegatorAddress'],
    },
  },
  {
    name: 'u2u_staking_get_unlocked_stake',
    description: 'Get amount of stake that can be withdrawn',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID' },
        delegatorAddress: { type: 'string', description: 'Delegator address' },
      },
      required: ['validatorID', 'delegatorAddress'],
    },
  },
  {
    name: 'u2u_staking_get_pending_rewards',
    description: 'Get unclaimed rewards available',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID' },
        delegatorAddress: { type: 'string', description: 'Delegator address' },
      },
      required: ['validatorID', 'delegatorAddress'],
    },
  },
  {
    name: 'u2u_staking_get_rewards_stash',
    description: 'Get stashed/stored rewards amount',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID' },
        delegatorAddress: { type: 'string', description: 'Delegator address' },
      },
      required: ['validatorID', 'delegatorAddress'],
    },
  },
  {
    name: 'u2u_staking_get_lockup_info',
    description: 'Get details about locked stake (amount, end date, duration)',
    inputSchema: {
      type: 'object',
      properties: {
        validatorID: { type: 'string', description: 'Validator ID' },
        delegatorAddress: { type: 'string', description: 'Delegator address' },
      },
      required: ['validatorID', 'delegatorAddress'],
    },
  },
];
