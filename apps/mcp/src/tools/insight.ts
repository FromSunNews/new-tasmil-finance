/**
 * Insight Tools
 * 
 * These tools allow users to query token information, market data, and other insights.
 * Agent: insight_agent
 * Tools: 19
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { encodeFunctionData, decodeFunctionResult, formatUnits, type Address, getContract, getAddress } from "viem";
import { query } from "../../index.js";
import { ERC20_ABI } from "../utils/contracts.js";
import { getClient } from "../client.js";

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
      try {
        const chainId = parseInt(args.chainId);
        const tokenAddress = args.tokenAddress as Address;

        // Create client for multicall or parallel queries
        const client = getClient(chainId);
        const tokenContract = getContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            client,
        });

        // Parallel execution
        const [name, symbol, decimals, totalSupply] = await Promise.all([
            tokenContract.read.name(),
            tokenContract.read.symbol(),
            tokenContract.read.decimals(),
            tokenContract.read.totalSupply(),
        ]);

        return {
          content: [{ type: 'text', text: JSON.stringify({
              success: true,
              tokenAddress,
              chainId,
              info: {
                  name,
                  symbol,
                  decimals,
                  totalSupply: {
                      raw: totalSupply.toString(),
                      formatted: formatUnits(totalSupply, decimals)
                  }
              }
          }, null, 2) }],
        };
      } catch (error) {
         return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );

  // insight_get_token_price
  server.registerTool(
    "insight_get_token_price",
    {
      description: "Get current price of a token in USD.",
      inputSchema: {
        tokenSymbol: z.string().describe('Token symbol (e.g., "U2U", "ETH")'),
      },
    },
    async (args) => {
        try {
             // Logic adapted from price-service.ts
             const COINGECKO_IDS: Record<string, string> = {
                U2U: "u2u-network",
                ETH: "ethereum",
                USDT: "tether",
                USDC: "usd-coin",
                BNB: "binancecoin",
                DAI: "dai",
                WETH: "weth",
              };

            const coinId = COINGECKO_IDS[args.tokenSymbol.toUpperCase()];
            if (!coinId) {
                 return {
                    content: [{ type: 'text', text: JSON.stringify({ success: false, message: "Token symbol not supported for price lookup" }) }],
                    isError: true
                 };
            }

            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Accept": "application/json"
                    }
                }
            );

            if (!response.ok) {
                 throw new Error(`CoinGecko API Error: ${response.statusText}`);
            }

            const data: any = await response.json();
            const priceData = data[coinId];

            return {
                content: [{ type: 'text', text: JSON.stringify({
                    success: true,
                    symbol: args.tokenSymbol,
                    priceUsd: priceData.usd,
                    change24h: priceData.usd_24h_change
                }, null, 2) }],
            };

        } catch (error) {
             return {
                content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
                isError: true,
            };
        }
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
      try {
        const chainId = parseInt(args.chainId);
        // Normalize addresses (handles checksums)
        let tokenAddress: Address;
        let walletAddress: Address;
        
        try {
            tokenAddress = getAddress(args.tokenAddress);
            walletAddress = getAddress(args.walletAddress);
        } catch (e) {
             return {
                content: [{ type: 'text', text: JSON.stringify({ success: false, error: "Invalid address format" }) }],
                isError: true,
             };
        }

        const client = getClient(chainId);

        // Native Token Case (Zero Address)
        if (tokenAddress === "0x0000000000000000000000000000000000000000") {
            const balance = await client.getBalance({ address: walletAddress });
            const symbol = chainId === 39 ? "U2U" : "ETH"; 
            const decimals = 18;

            return {
                content: [{ type: 'text', text: JSON.stringify({
                    success: true,
                    token: symbol,
                    type: "Native",
                    chainId,
                    wallet: walletAddress,
                    balance: {
                        raw: balance.toString(),
                        formatted: formatUnits(balance, decimals)
                    }
                }, null, 2) }],
            };
        }

        const tokenContract = getContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            client,
        });

        const [balance, decimals, symbol] = await Promise.all([
            tokenContract.read.balanceOf([walletAddress]),
            tokenContract.read.decimals(),
            tokenContract.read.symbol(),
        ]);

        return {
        content: [{ type: 'text', text: JSON.stringify({
            success: true,
            token: symbol,
            type: "ERC20",
            chainId,
            wallet: walletAddress,
            balance: {
                raw: balance.toString(),
                formatted: formatUnits(balance, decimals)
            }
        }, null, 2) }],
        };
      } catch (error) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
            isError: true,
            };
      }
    }
  );
  
  // insight_get_gas_price
  server.registerTool(
    "insight_get_gas_price",
    {
      description: "Get current gas price for a network.",
      inputSchema: {
        chainId: z.string().describe('Chain ID'),
      },
    },
    async (args) => {
       try {
           const chainId = parseInt(args.chainId);
           const client = getClient(chainId);
           const gasPrice = await client.getGasPrice();

           return {
            content: [{ type: 'text', text: JSON.stringify({
                success: true,
                chainId,
                gasPrice: {
                    raw: gasPrice.toString(),
                    formatted: formatUnits(gasPrice, 9) + ' Gwei'
                }
            }, null, 2) }],
           };
       } catch (error) {
           return {
            content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
            isError: true,
            };
       }
    }
  );

  // Market Data Tools (Mock/Placeholder for now as logic relies on complex indexing)

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
            content: [{ type: 'text', text: `Market cap for ${args.tokenAddress} on chain ${args.chainId} (Logic requires CoinGecko Pro or similar)` }],
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
            content: [{ type: 'text', text: `Volume for ${args.tokenAddress} on chain ${args.chainId} (Logic requires CoinGecko Pro or similar)` }],
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
                content: [{ type: 'text', text: `Pools for ${args.tokenA}/${args.tokenB} on chain ${args.chainId} (Requires DEX subgraph integration)` }],
            };
        }
    );

    // Register generic tools
    const genericTools = [
        "insight_get_top_holders",
        "insight_get_token_transfers",
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
                    content: [{ type: 'text', text: `Result for ${toolName} with args ${JSON.stringify(args)}` }],
                };
            }
        );
    }
}
