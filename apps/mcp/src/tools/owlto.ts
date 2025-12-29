/**
 * Owlto Bridge Tools
 * 
 * These tools allow users to bridge tokens between different chains using the Owlto protocol.
 * Agent: owlto_agent
 * Tools: 2
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as owlto from "owlto-sdk";

/**
 * Register Owlto tools with the MCP server
 * @param server The McpServer instance
 */
export function registerOwltoTools(server: McpServer) {
  // Initialize Bridge instance
  const bridgeOptions: owlto.BridgeOptions = {};
  const bridge = new owlto.Bridge(bridgeOptions);

  // owlto_get_bridge_routes
  server.registerTool(
    "owlto_get_bridge_routes",
    {
      description: "Get available bridge routes/pairs supported by Owlto.",
      inputSchema: {
        fromChain: z.string().optional().describe('Filter by source chain name'),
        toChain: z.string().optional().describe('Filter by destination chain name'),
      },
    },
    async ({ fromChain, toChain }) => {
      try {
        const result = await bridge.getAllPairInfos();
        let pairs = (result.pairInfos as any[]);

        // Filter if params provided
        if (fromChain) {
          pairs = pairs.filter(p => p.fromChainName.toLowerCase().includes(fromChain.toLowerCase()));
        }
        if (toChain) {
          pairs = pairs.filter(p => p.toChainName.toLowerCase().includes(toChain.toLowerCase()));
        }

        // Limit results to avoid overflow, or summarize
        const limitedPairs = pairs.slice(0, 50).map(p => ({
          from: p.fromChainName,
          to: p.toChainName,
          tokens: p.tokenName // Assuming structure based on usage
        }));

        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({ 
              success: true, 
              count: pairs.length, 
              routes: limitedPairs 
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({ 
              success: false, 
              error: (error as Error).message 
            }) 
          }],
          isError: true
        };
      }
    }
  );

  // owlto_bridge_tokens
  server.registerTool(
    "owlto_bridge_tokens",
    {
      description: "Bridge tokens between chains using Owlto.",
      inputSchema: {
        token: z.string().describe('Token symbol (e.g., "USDC", "ETH")'),
        fromChain: z.string().describe('Source chain name (e.g., "EthereumMainnet", "BaseMainnet")'),
        toChain: z.string().describe('Destination chain name (e.g., "U2USolarisMainnet", "ScrollMainnet")'),
        amount: z.string().describe('Amount to bridge (as string)'),
        fromAddress: z.string().describe('Sender wallet address'),
        toAddress: z.string().describe('Recipient wallet address'),
      },
    },
    async (args) => {
      try {
        const result = await bridge.getBuildTx(
          args.token,
          args.fromChain,
          args.toChain,
          args.amount,
          args.fromAddress,
          args.toAddress
        );

        // Map Owlto result to generic build_txn response format
        // Check if approval is needed
        const txs = [];
        
        if (result.txs.approveBody) {
             const approveTx = result.txs.approveBody as any;
             txs.push({
                 type: 'approve',
                 to: approveTx.to,
                 data: approveTx.data,
                 value: approveTx.value ? approveTx.value.toString() : '0',
                 chainId: 0 // Frontend should handle chain switching based on 'fromChain' params from earlier.
             });
        }

        const transferTx = result.txs.transferBody as any;
        txs.push({
            type: 'transfer',
            to: transferTx.to,
            data: transferTx.data,
            value: transferTx.value ? transferTx.value.toString() : '0',
        });

        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({ 
              success: true,
              networkType: result.networkType,
              transactions: txs,
              originalResult: result
            }, null, 2) 
          }],
        };
      } catch (error) {
         return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({ 
              success: false, 
              error: (error as Error).message 
            }) 
          }],
          isError: true
        };
      }
    }
  );
}
