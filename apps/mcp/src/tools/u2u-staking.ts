/**
 * U2U Staking Tools
 * 
 * These tools handle staking operations and user-specific staking queries on U2U Solaris network.
 * Agent: u2_staking_agent
 * Tools: 10
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { encodeFunctionData, decodeFunctionResult, parseEther, formatEther, type Address } from 'viem';
import { build_txn, query } from '../utils/blockchain.js';
import { U2U_SFC_CONTRACT, SFC_ABI } from '../utils/contracts.js';

const U2U_CHAIN_ID = 39; // U2U Solaris Mainnet

/**
 * Register all U2U staking tools with the MCP server
 */
export function registerU2UStakingTools(server: McpServer) {
  // Transaction Tools (5 tools)
  
  // u2u_staking_delegate
  server.registerTool(
    "u2u_staking_delegate",
    {
      description: "Stake U2U tokens to a validator to earn rewards. Use this when users want to stake their U2U tokens.",
      inputSchema: {
        validatorID: z.string().describe('Validator ID to delegate to (e.g., "1", "2", "3")'),
        amount: z.string().describe('Amount of U2U tokens to stake (e.g., "100.0", "50.5")'),
        delegatorAddress: z.string().optional().describe('Delegator address (optional, uses connected wallet)'),
      },
    },
    async (args) => {
      try {
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

        // Serialize BigInt values to strings for JSON
        const serializedTxData = {
          ...txData,
          value: txData.value.toString(),
          gas: txData.gas?.toString(),
          gasPrice: txData.gasPrice?.toString(),
          maxFeePerGas: txData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas?.toString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                action: 'delegate',
                validatorID: args.validatorID,
                amount: args.amount,
                amountFormatted: `${args.amount} U2U`,
                transactionData: serializedTxData,
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
  );

  // u2u_staking_undelegate
  server.registerTool(
    "u2u_staking_undelegate",
    {
      description: "Unstake U2U tokens from a validator. Use this when users want to unstake their tokens.",
      inputSchema: {
        validatorID: z.string().describe('Validator ID to undelegate from'),
        amount: z.string().describe('Amount of U2U tokens to unstake'),
        wrID: z.string().optional().describe('Withdrawal Request ID (optional)'),
        delegatorAddress: z.string().optional().describe('Delegator address (optional)'),
      },
    },
    async (args) => {
      try {
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

        // Serialize BigInt values to strings for JSON
        const serializedTxData = {
          ...txData,
          value: txData.value.toString(),
          gas: txData.gas?.toString(),
          gasPrice: txData.gasPrice?.toString(),
          maxFeePerGas: txData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas?.toString(),
        };

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
                transactionData: serializedTxData,
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
  );

  // u2u_staking_claim_rewards
  server.registerTool(
    "u2u_staking_claim_rewards",
    {
      description: "Claim pending rewards from a validator. Use this when users want to claim their earned rewards.",
      inputSchema: {
        validatorID: z.string().describe('Validator ID to claim rewards from'),
        delegatorAddress: z.string().optional().describe('Delegator address (optional)'),
      },
    },
    async (args) => {
      try {
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

        // Serialize BigInt values to strings for JSON
        const serializedTxData = {
          ...txData,
          value: txData.value.toString(),
          gas: txData.gas?.toString(),
          gasPrice: txData.gasPrice?.toString(),
          maxFeePerGas: txData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas?.toString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                action: 'u2u_staking_claim_rewards',
                validatorID: args.validatorID,
                transactionData: serializedTxData,
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
  );

  // u2u_staking_restake_rewards
  server.registerTool(
    "u2u_staking_restake_rewards",
    {
      description: "Restake (compound) rewards from a validator. Use this when users want to compound their rewards.",
      inputSchema: {
        validatorID: z.string().describe('Validator ID to restake rewards for'),
        delegatorAddress: z.string().optional().describe('Delegator address (optional)'),
      },
    },
    async (args) => {
      try {
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

        // Serialize BigInt values to strings for JSON
        const serializedTxData = {
          ...txData,
          value: txData.value.toString(),
          gas: txData.gas?.toString(),
          gasPrice: txData.gasPrice?.toString(),
          maxFeePerGas: txData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas?.toString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                action: 'u2u_staking_restake_rewards',
                validatorID: args.validatorID,
                transactionData: serializedTxData,
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
  );

  // u2u_staking_lock_stake
  server.registerTool(
    "u2u_staking_lock_stake",
    {
      description: "Lock stake for additional rewards. Use this when users want to lock their stake for bonus rewards.",
      inputSchema: {
        validatorID: z.string().describe('Validator ID to lock stake for'),
        amount: z.string().describe('Amount of U2U tokens to lock'),
        lockupDuration: z.string().describe('Lockup duration in days (e.g., "7", "14", "30")'),
        delegatorAddress: z.string().optional().describe('Delegator address (optional)'),
      },
    },
    async (args) => {
      try {
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

        // Serialize BigInt values to strings for JSON
        const serializedTxData = {
          ...txData,
          value: txData.value.toString(),
          gas: txData.gas?.toString(),
          gasPrice: txData.gasPrice?.toString(),
          maxFeePerGas: txData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas?.toString(),
        };

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
                transactionData: serializedTxData,
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
  );

  // Query Tools (5 tools)

  // u2u_staking_get_user_stake
  server.registerTool(
    "u2u_staking_get_user_stake",
    {
      description: "Get amount user has staked to a validator",
      inputSchema: {
        validatorID: z.string().describe('Validator ID'),
        delegatorAddress: z.string().describe('Delegator address'),
      },
    },
    async (args) => {
      try {
        const result = await query({
          chainId: U2U_CHAIN_ID,
          to: U2U_SFC_CONTRACT,
          data: encodeFunctionData({
            abi: SFC_ABI,
            functionName: 'getStake',
            args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
          }),
        });

        let stakeAmount = 0n;
        if (result && result !== '0x') {
            stakeAmount = decodeFunctionResult({
                abi: SFC_ABI,
                functionName: 'getStake',
                data: result
            }) as bigint;
        }

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
  );

  // u2u_staking_get_unlocked_stake
  server.registerTool(
    "u2u_staking_get_unlocked_stake",
    {
      description: "Get amount of stake that can be withdrawn",
      inputSchema: {
        validatorID: z.string().describe('Validator ID'),
        delegatorAddress: z.string().describe('Delegator address'),
      },
    },
    async (args) => {
      try {
        const result = await query({
          chainId: U2U_CHAIN_ID,
          to: U2U_SFC_CONTRACT,
          data: encodeFunctionData({
            abi: SFC_ABI,
            functionName: 'getUnlockedStake',
            args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
          }),
        });

        let unlockedAmount = 0n;
        if (result && result !== '0x') {
            unlockedAmount = decodeFunctionResult({
                abi: SFC_ABI,
                functionName: 'getUnlockedStake',
                data: result
            }) as bigint;
        }

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
  );

  // u2u_staking_get_pending_rewards
  server.registerTool(
    "u2u_staking_get_pending_rewards",
    {
      description: "Get unclaimed rewards available",
      inputSchema: {
        validatorID: z.string().describe('Validator ID'),
        delegatorAddress: z.string().describe('Delegator address'),
      },
    },
    async (args) => {
      try {
        const result = await query({
          chainId: U2U_CHAIN_ID,
          to: U2U_SFC_CONTRACT,
          data: encodeFunctionData({
            abi: SFC_ABI,
            functionName: 'pendingRewards',
            args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
          }),
        });

        let rewardsAmount = 0n;
        if (result && result !== '0x') {
            rewardsAmount = decodeFunctionResult({
                abi: SFC_ABI,
                functionName: 'pendingRewards',
                data: result
            }) as bigint;
        }

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
  );

  // u2u_staking_get_rewards_stash
  server.registerTool(
    "u2u_staking_get_rewards_stash",
    {
      description: "Get stashed/stored rewards amount",
      inputSchema: {
        validatorID: z.string().describe('Validator ID'),
        delegatorAddress: z.string().describe('Delegator address'),
      },
    },
    async (args) => {
      try {
        const result = await query({
          chainId: U2U_CHAIN_ID,
          to: U2U_SFC_CONTRACT,
          data: encodeFunctionData({
            abi: SFC_ABI,
            functionName: 'rewardsStash',
            args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
          }),
        });

        let stashAmount = 0n;
        if (result && result !== '0x') {
            stashAmount = decodeFunctionResult({
                abi: SFC_ABI,
                functionName: 'rewardsStash',
                data: result
            }) as bigint;
        }

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
  );

  // u2u_staking_get_lockup_info
  server.registerTool(
    "u2u_staking_get_lockup_info",
    {
      description: "Get details about locked stake (amount, end date, duration)",
      inputSchema: {
        validatorID: z.string().describe('Validator ID'),
        delegatorAddress: z.string().describe('Delegator address'),
      },
    },
    async (args) => {
      try {
        const result = await query({
          chainId: U2U_CHAIN_ID,
          to: U2U_SFC_CONTRACT,
          data: encodeFunctionData({
            abi: SFC_ABI,
            functionName: 'getLockupInfo',
            args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
          }),
        });

        let lockedAmount = 0n;
        let endTime = 0n;
        let duration = 0n;
        let fromEpoch = 0n;

        if (result && result !== '0x') {
            const decoded = decodeFunctionResult({
                abi: SFC_ABI,
                functionName: 'getLockupInfo',
                data: result
            }) as [bigint, bigint, bigint, bigint];
            
            [lockedAmount, endTime, duration, fromEpoch] = decoded;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                validatorID: args.validatorID,
                delegatorAddress: args.delegatorAddress,
                lockupInfo: {
                  lockedAmount: {
                      raw: lockedAmount.toString(),
                      formatted: formatEther(lockedAmount) + ' U2U'
                  },
                  endTime: endTime.toString(),
                  duration: duration.toString(),
                  fromEpoch: fromEpoch.toString()
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
  );
}
