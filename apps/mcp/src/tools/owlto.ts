/**
 * Owlto Bridge Tools
 * 
 * These tools handle cross-chain token bridging operations using the Owlto Bridge protocol.
 * Agent: owlto_agent
 * Tools: 2
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register Owlto tools with the MCP server
 */
export function registerOwltoTools(server: McpServer) {
  // owlto_get_bridge_routes
  server.registerTool(
    "owlto_get_bridge_routes",
    {
      description: "Get all available cross-chain bridge pairs involving U2U. Use this when users ask about available bridges or supported chains.",
      inputSchema: {},
    },
    async () => {
      try {
        // TODO: Integrate with Owlto SDK to get actual bridge pairs
        // For now, return mock data structure
        const mockPairs = [
          {
            tokenName: 'USDT',
            fromChain: 'EthereumMainnet',
            toChain: 'U2USolarisMainnet',
            minAmount: '10',
            maxAmount: '10000',
          },
          {
            tokenName: 'USDC',
            fromChain: 'EthereumMainnet',
            toChain: 'U2USolarisMainnet',
            minAmount: '10',
            maxAmount: '10000',
          },
        ];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                pairs: mockPairs,
                totalPairs: mockPairs.length,
                message: `Found ${mockPairs.length} bridge pairs involving U2U`,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // owlto_bridge_tokens
  server.registerTool(
    "owlto_bridge_tokens",
    {
      description: "Transfer tokens from one blockchain to another using Owlto Bridge. Use this when users want to transfer tokens cross-chain.",
      inputSchema: {
        tokenName: z.string().describe('Token symbol to bridge (e.g., "USDT", "USDC", "U2U")'),
        fromChain: z.string().describe('Source chain name (e.g., "EthereumMainnet", "U2USolarisMainnet")'),
        toChain: z.string().describe('Destination chain name (e.g., "EthereumMainnet", "U2USolarisMainnet")'),
        amount: z.string().describe('Amount to bridge (e.g., "100", "1.5")'),
        fromAddress: z.string().optional().describe('Source address. Use "my-wallet" for connected wallet or leave empty for connected wallet.'),
        toAddress: z.string().optional().describe('Destination address. Use "my-wallet" for connected wallet or leave empty for connected wallet.'),
      },
    },
    async (args) => {
      try {
        // Validate inputs
        const amountNum = parseFloat(args.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Invalid amount. Please provide a valid amount greater than 0.',
                }),
              },
            ],
            isError: true,
          };
        }

        // TODO: Integrate with Owlto SDK to build actual bridge transaction
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                action: 'bridge',
                tokenName: args.tokenName,
                fromChain: args.fromChain,
                toChain: args.toChain,
                amount: amountNum,
                amountFormatted: `${args.amount} ${args.tokenName}`,
                fromAddress: args.fromAddress || 'wallet-address-required',
                toAddress: args.toAddress || 'wallet-address-required',
                message: `Ready to bridge ${args.amount} ${args.tokenName} from ${args.fromChain} to ${args.toChain}`,
                requiresWallet: true,
                requiresConfirmation: true,
                // Transaction data will be built using build_txn() when Owlto SDK is integrated
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
