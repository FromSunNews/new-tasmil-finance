/**
 * Owlto Bridge Tools
 * 
 * These tools handle cross-chain token bridging operations using the Owlto Bridge protocol.
 * Agent: owlto_agent
 * Tools: 2
 */

import type { ToolResult } from '../types/index.js';

/**
 * Handle Owlto tool calls
 */
export async function handleOwltoToolCall(request: any): Promise<any> {
  const toolName = request.params.name;

  if (toolName === 'owlto_get_bridge_routes') {
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

      const result: ToolResult = {
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

      return result;
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

  if (toolName === 'owlto_bridge_tokens') {
    try {
      const args = request.params.arguments as {
        tokenName: string;
        fromChain: string;
        toChain: string;
        amount: string;
        fromAddress?: string;
        toAddress?: string;
      };

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
      // For now, return transaction structure
      const result: ToolResult = {
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

      return result;
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

  throw new Error(`Unknown Owlto tool: ${toolName}`);
}

/**
 * Tool schemas for Owlto agent
 */
export const owltoToolSchemas = [
  {
    name: 'owlto_get_bridge_routes',
    description: 'Get all available cross-chain bridge pairs involving U2U. Use this when users ask about available bridges or supported chains.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'owlto_bridge_tokens',
    description: 'Transfer tokens from one blockchain to another using Owlto Bridge. Use this when users want to transfer tokens cross-chain.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenName: {
          type: 'string',
          description: 'Token symbol to bridge (e.g., "USDT", "USDC", "U2U")',
        },
        fromChain: {
          type: 'string',
          description: 'Source chain name (e.g., "EthereumMainnet", "U2USolarisMainnet")',
        },
        toChain: {
          type: 'string',
          description: 'Destination chain name (e.g., "EthereumMainnet", "U2USolarisMainnet")',
        },
        amount: {
          type: 'string',
          description: 'Amount to bridge (e.g., "100", "1.5")',
        },
        fromAddress: {
          type: 'string',
          description: 'Source address. Use "my-wallet" for connected wallet or leave empty for connected wallet.',
        },
        toAddress: {
          type: 'string',
          description: 'Destination address. Use "my-wallet" for connected wallet or leave empty for connected wallet.',
        },
      },
      required: ['tokenName', 'fromChain', 'toChain', 'amount'],
    },
  },
];
