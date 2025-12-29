/**
 * Insight Tools
 * 
 * These tools allow users to query token information, market data, and other insights.
 * Agent: insight_agent
 * Tools: 19
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register Insight tools with the MCP server
 * @param server The McpServer instance
 */
export function registerInsightTools(server: McpServer) {
  // Token Information Tools
  
  // insight_get_token_info
  server.registerTool(
    "insight_get_token_info",
    {
      description: "Get basic information about a token (name, symbol, decimals, total supply).",
      inputSchema: {
        tokenAddress: z.string().describe('Token contract address'),
        chainId: z.string().describe('Chain ID (e.g., "39", "1")'),
      },
    },
    async (args) => {
      // TODO: Implement actual token info query
      return {
        content: [{ type: 'text', text: `Token info for ${args.tokenAddress} on chain ${args.chainId} (Mock)` }],
      };
    }
  );

  // insight_get_token_price
  server.registerTool(
    "insight_get_token_price",
    {
      description: "Get current price of a token in USD.",
      inputSchema: {
        tokenAddress: z.string().describe('Token contract address'),
        chainId: z.string().describe('Chain ID'),
      },
    },
    async (args) => {
      // TODO: Implement actual price query
      return {
        content: [{ type: 'text', text: `Price for ${args.tokenAddress} on chain ${args.chainId} (Mock)` }],
      };
    }
  );

  // insight_get_token_balance
  server.registerTool(
    "insight_get_token_balance",
    {
      description: "Get token balance for a specific wallet address.",
      inputSchema: {
        tokenAddress: z.string().describe('Token contract address'),
        walletAddress: z.string().describe('Wallet address'),
        chainId: z.string().describe('Chain ID'),
      },
    },
    async (args) => {
      // TODO: Implement actual balance query
      return {
        content: [{ type: 'text', text: `Balance of ${args.tokenAddress} for ${args.walletAddress} on chain ${args.chainId} (Mock)` }],
      };
    }
  );
  
  // Market Data Tools

  // insight_get_market_cap
  server.registerTool(
    "insight_get_market_cap",
    {
      description: "Get market capitalization for a token.",
      inputSchema: {
        tokenAddress: z.string().describe('Token contract address'),
        chainId: z.string().describe('Chain ID'),
      },
    },
    async (args) => {
        return {
            content: [{ type: 'text', text: `Market cap for ${args.tokenAddress} on chain ${args.chainId} (Mock)` }],
        };
    }
  );

  // insight_get_trading_volume
  server.registerTool(
    "insight_get_trading_volume",
    {
      description: "Get 24h trading volume for a token.",
      inputSchema: {
        tokenAddress: z.string().describe('Token contract address'),
        chainId: z.string().describe('Chain ID'),
      },
    },
    async (args) => {
        return {
            content: [{ type: 'text', text: `Volume for ${args.tokenAddress} on chain ${args.chainId} (Mock)` }],
        };
    }
  );

    // insight_search_pools
    server.registerTool(
        "insight_search_pools",
        {
            description: "Search for liquidity pools for a token pair.",
            inputSchema: {
                tokenA: z.string().describe('Token A address'),
                tokenB: z.string().describe('Token B address'),
                chainId: z.string().describe('Chain ID'),
            },
        },
        async (args) => {
            return {
                content: [{ type: 'text', text: `Pools for ${args.tokenA}/${args.tokenB} on chain ${args.chainId} (Mock)` }],
            };
        }
    );

    // Register generic tools
    const genericTools = [
        "insight_get_top_holders",
        "insight_get_token_transfers",
        "insight_get_gas_price",
        "insight_get_block_info",
        "insight_get_transaction_status",
        "insight_get_network_stats",
        "insight_get_validator_info",
        "insight_get_governance_proposals",
        "insight_get_yield_farming_info",
        "insight_get_lending_rates",
        "insight_get_nft_info",
        "insight_get_nft_floor_price",
        "insight_get_contract_abi"
    ] as const;

    for (const toolName of genericTools) {
        server.registerTool(
            toolName,
            {
                description: `Get ${toolName.replace('insight_get_', '').replace(/_/g, ' ')}.`,
                inputSchema: {
                     query: z.string().describe('Query parameters or ID'),
                     chainId: z.string().optional().describe('Chain ID'),
                },
            },
            async (args) => {
                return {
                    content: [{ type: 'text', text: `Result for ${toolName} with args ${JSON.stringify(args)} (Mock)` }],
                };
            }
        );
    }
}
