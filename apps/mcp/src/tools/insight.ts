/**
 * Insight Agent Tools
 * 
 * These tools provide read-only analytics, statistics, and information about tokens, validators, and network state.
 * Agent: insight_agent
 * Tools: 19
 */

import type { Server } from '@modelcontextprotocol/sdk/server';
import { encodeFunctionData, formatEther, formatUnits, type Address } from 'viem';
import { query } from '../utils/blockchain.js';
import { U2U_SFC_CONTRACT, SFC_ABI, ERC20_ABI } from '../utils/contracts.js';
import type { ToolResult } from '../types/index.js';

const U2U_CHAIN_ID = 39;

/**
 * Register all Insight tools with the MCP server
 */
/**
 * Handle Insight tool calls
 */
export async function handleInsightToolCall(request: any) {
  const toolName = request.params.name;

  // ERC20 Token Queries (6 tools)
  if (toolName === 'insight_query_token_balance') {
    try {
      const args = request.params.arguments as { tokenAddress: string; userAddress: string; chainId?: number };
      const result = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'balanceOf', args: [args.userAddress as Address] }),
      });
      const balance = result ? BigInt(result) : 0n;
      // Get decimals for formatting
      const decimalsResult = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'decimals' }),
      });
      const decimals = decimalsResult ? Number(BigInt(decimalsResult)) : 18;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            balance: { raw: balance.toString(), formatted: formatUnits(balance, decimals) },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  if (toolName === 'insight_query_token_supply') {
    try {
      const args = request.params.arguments as { tokenAddress: string; chainId?: number };
      const result = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'totalSupply' }),
      });
      const supply = result ? BigInt(result) : 0n;
      const decimalsResult = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'decimals' }),
      });
      const decimals = decimalsResult ? Number(BigInt(decimalsResult)) : 18;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            totalSupply: { raw: supply.toString(), formatted: formatUnits(supply, decimals) },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  if (toolName === 'insight_query_token_name') {
    try {
      const args = request.params.arguments as { tokenAddress: string; chainId?: number };
      const result = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'name' }),
      });
      // TODO: Decode string result properly
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, name: result }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  if (toolName === 'insight_query_token_symbol') {
    try {
      const args = request.params.arguments as { tokenAddress: string; chainId?: number };
      const result = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'symbol' }),
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, symbol: result }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  if (toolName === 'insight_query_token_decimals') {
    try {
      const args = request.params.arguments as { tokenAddress: string; chainId?: number };
      const result = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'decimals' }),
      });
      const decimals = result ? Number(BigInt(result)) : 0;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, decimals }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  if (toolName === 'insight_query_token_allowance') {
    try {
      const args = request.params.arguments as { tokenAddress: string; owner: string; spender: string; chainId?: number };
      const result = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [args.owner as Address, args.spender as Address],
        }),
      });
      const allowance = result ? BigInt(result) : 0n;
      const decimalsResult = await query({
        chainId: args.chainId || U2U_CHAIN_ID,
        to: args.tokenAddress as Address,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'decimals' }),
      });
      const decimals = decimalsResult ? Number(BigInt(decimalsResult)) : 18;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            allowance: { raw: allowance.toString(), formatted: formatUnits(allowance, decimals) },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  // Network-Level Queries (5 tools) - These would need additional contract calls or RPC methods
  // For now, returning placeholder responses
  
  if (toolName === 'insight_get_account_balance') {
    // TODO: Implement using viem's getBalance
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement account balance query' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_current_epoch') {
    // TODO: Implement SFC currentEpoch query
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement current epoch query' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_total_stake') {
    // TODO: Implement SFC totalStake query
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement total stake query' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_total_active_stake') {
    // TODO: Implement SFC totalActiveStake query
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement total active stake query' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_staking_statistics') {
    // TODO: Implement comprehensive staking stats query
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement staking statistics query' }, null, 2),
      }],
    };
  }

  // Validator Queries (5 tools)
  if (toolName === 'insight_get_validator_id_by_address') {
    // TODO: Implement validator ID lookup
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement validator ID lookup' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_validator_info') {
    // TODO: Implement validator info query
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement validator info query' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_validator_self_stake') {
    // TODO: Implement validator self-stake query
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement validator self-stake query' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_all_validators_info') {
    // TODO: Implement all validators query (likely needs GraphQL)
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement all validators query' }, null, 2),
      }],
    };
  }

  if (toolName === 'insight_get_staking_apr') {
    // TODO: Implement APR calculation
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'TODO: Implement APR calculation' }, null, 2),
      }],
    };
  }

  // User Staking Queries (3 tools) - Similar to U2U Staking agent queries
  if (toolName === 'insight_get_user_stake_info') {
    try {
      const args = request.params.arguments as { validatorID: string; delegatorAddress: string };
      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'getStake',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });
      const stake = result ? BigInt(result) : 0n;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            stake: { raw: stake.toString(), formatted: formatEther(stake) + ' U2U' },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  if (toolName === 'insight_get_user_pending_rewards') {
    try {
      const args = request.params.arguments as { validatorID: string; delegatorAddress: string };
      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'pendingRewards',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });
      const rewards = result ? BigInt(result) : 0n;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            pendingRewards: { raw: rewards.toString(), formatted: formatEther(rewards) + ' U2U' },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  if (toolName === 'insight_get_user_lockup_info') {
    try {
      const args = request.params.arguments as { validatorID: string; delegatorAddress: string };
      const result = await query({
        chainId: U2U_CHAIN_ID,
        to: U2U_SFC_CONTRACT,
        data: encodeFunctionData({
          abi: SFC_ABI,
          functionName: 'getLockupInfo',
          args: [args.delegatorAddress as Address, BigInt(args.validatorID)],
        }),
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            lockupInfo: { raw: result },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
    }
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

/**
 * Tool schemas for Insight agent (19 tools)
 */
export const insightToolSchemas = [
  // ERC20 Token Queries
  { name: 'insight_query_token_balance', description: "Get user's token balance for any ERC20 token", inputSchema: { type: 'object', properties: { tokenAddress: { type: 'string' }, userAddress: { type: 'string' }, chainId: { type: 'number' } }, required: ['tokenAddress', 'userAddress'] } },
  { name: 'insight_query_token_supply', description: 'Get total supply of a token', inputSchema: { type: 'object', properties: { tokenAddress: { type: 'string' }, chainId: { type: 'number' } }, required: ['tokenAddress'] } },
  { name: 'insight_query_token_name', description: 'Get token name', inputSchema: { type: 'object', properties: { tokenAddress: { type: 'string' }, chainId: { type: 'number' } }, required: ['tokenAddress'] } },
  { name: 'insight_query_token_symbol', description: 'Get token symbol/ticker', inputSchema: { type: 'object', properties: { tokenAddress: { type: 'string' }, chainId: { type: 'number' } }, required: ['tokenAddress'] } },
  { name: 'insight_query_token_decimals', description: 'Get token decimals', inputSchema: { type: 'object', properties: { tokenAddress: { type: 'string' }, chainId: { type: 'number' } }, required: ['tokenAddress'] } },
  { name: 'insight_query_token_allowance', description: 'Get approved spending amount for a spender', inputSchema: { type: 'object', properties: { tokenAddress: { type: 'string' }, owner: { type: 'string' }, spender: { type: 'string' }, chainId: { type: 'number' } }, required: ['tokenAddress', 'owner', 'spender'] } },
  // Network-Level Queries
  { name: 'insight_get_account_balance', description: "Get user's native U2U balance", inputSchema: { type: 'object', properties: { address: { type: 'string' } }, required: ['address'] } },
  { name: 'insight_get_current_epoch', description: 'Get current epoch number on network', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'insight_get_total_stake', description: 'Get total amount staked across all validators', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'insight_get_total_active_stake', description: 'Get total active staking amount', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'insight_get_staking_statistics', description: 'Get comprehensive network staking statistics', inputSchema: { type: 'object', properties: {}, required: [] } },
  // Validator Queries
  { name: 'insight_get_validator_id_by_address', description: 'Find validator ID by auth address', inputSchema: { type: 'object', properties: { authAddress: { type: 'string' } }, required: ['authAddress'] } },
  { name: 'insight_get_validator_info', description: 'Get detailed information about a specific validator', inputSchema: { type: 'object', properties: { validatorID: { type: 'string' } }, required: ['validatorID'] } },
  { name: 'insight_get_validator_self_stake', description: 'Get amount validator has self-staked', inputSchema: { type: 'object', properties: { validatorID: { type: 'string' } }, required: ['validatorID'] } },
  { name: 'insight_get_all_validators_info', description: 'Get complete list of all validators with stats', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'insight_get_staking_apr', description: 'Calculate APR for staking with a validator', inputSchema: { type: 'object', properties: { validatorID: { type: 'string' }, amount: { type: 'string' } }, required: ['validatorID'] } },
  // User Staking Queries
  { name: 'insight_get_user_stake_info', description: "Get user's stake amount with a validator", inputSchema: { type: 'object', properties: { validatorID: { type: 'string' }, delegatorAddress: { type: 'string' } }, required: ['validatorID', 'delegatorAddress'] } },
  { name: 'insight_get_user_pending_rewards', description: "Get user's unclaimed rewards", inputSchema: { type: 'object', properties: { validatorID: { type: 'string' }, delegatorAddress: { type: 'string' } }, required: ['validatorID', 'delegatorAddress'] } },
  { name: 'insight_get_user_lockup_info', description: "Get user's locked stake details", inputSchema: { type: 'object', properties: { validatorID: { type: 'string' }, delegatorAddress: { type: 'string' } }, required: ['validatorID', 'delegatorAddress'] } },
];
