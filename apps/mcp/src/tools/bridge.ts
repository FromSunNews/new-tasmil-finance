/**
 * Bridge Tools - Cross-chain token bridging using Owlto Bridge
 * 
 * These tools help users bridge tokens between different blockchains,
 * with a focus on U2U Network.
 * Agent: bridge_agent
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Owlto Bridge API
const OWLTO_API_BASE = "https://owlto.finance/api/v1";

// Supported chains
const SUPPORTED_BRIDGE_CHAINS: Record<string, string> = {
  "EthereumMainnet": "wss://ethereum-rpc.publicnode.com",
  "U2USolarisMainnet": "https://rpc-mainnet.u2u.xyz",
  "AvalancheMainnet": "wss://0xrpc.io/avax",
  "BnbMainnet": "wss://bsc-rpc.publicnode.com",
  "ArbitrumOneMainnet": "wss://arbitrum-one-rpc.publicnode.com",
  "OptimismMainnet": "https://endpoints.omniatech.io/v1/op/mainnet/public",
  "LineaMainnet": "https://linea.therpc.io",
  "PolygonMainnet": "wss://polygon-bor-rpc.publicnode.com",
  "BaseMainnet": "wss://base-rpc.publicnode.com",
};

/**
 * Register Bridge tools with the MCP server
 * @param server The McpServer instance
 */
export function registerBridgeTools(server: McpServer) {

  // bridge_get_bridge_pairs
  server.registerTool(
    "bridge_get_bridge_pairs",
    {
      description: "Get all available bridge pairs for cross-chain transfers. Use when users ask about available bridges or supported routes.",
      inputSchema: {},
    },
    async () => {
      try {
        // Mock data - in production, call Owlto API
        const pairs = [
          {
            tokenName: "USDT",
            fromChainName: "U2USolarisMainnet",
            toChainName: "EthereumMainnet",
            minValue: { uiValue: "10 USDT", value: "10" },
            maxValue: { uiValue: "100,000 USDT", value: "100000" },
          },
          {
            tokenName: "USDT",
            fromChainName: "EthereumMainnet",
            toChainName: "U2USolarisMainnet",
            minValue: { uiValue: "10 USDT", value: "10" },
            maxValue: { uiValue: "100,000 USDT", value: "100000" },
          },
          {
            tokenName: "USDC",
            fromChainName: "U2USolarisMainnet",
            toChainName: "BnbMainnet",
            minValue: { uiValue: "10 USDC", value: "10" },
            maxValue: { uiValue: "100,000 USDC", value: "100000" },
          },
          {
            tokenName: "U2U",
            fromChainName: "U2USolarisMainnet",
            toChainName: "EthereumMainnet",
            minValue: { uiValue: "1 U2U", value: "1" },
            maxValue: { uiValue: "10,000 U2U", value: "10000" },
          },
          {
            tokenName: "ETH",
            fromChainName: "EthereumMainnet",
            toChainName: "ArbitrumOneMainnet",
            minValue: { uiValue: "0.01 ETH", value: "0.01" },
            maxValue: { uiValue: "100 ETH", value: "100" },
          },
          {
            tokenName: "ETH",
            fromChainName: "ArbitrumOneMainnet",
            toChainName: "OptimismMainnet",
            minValue: { uiValue: "0.01 ETH", value: "0.01" },
            maxValue: { uiValue: "100 ETH", value: "100" },
          },
        ];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              totalPairs: pairs.length,
              pairs,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );

  // bridge_get_bridge_quote
  server.registerTool(
    "bridge_get_bridge_quote",
    {
      description: "Get a quote for bridging tokens between chains. Shows estimated fees and amounts.",
      inputSchema: {
        tokenName: z.string().describe("Token symbol to bridge (e.g., 'USDT', 'USDC', 'U2U')"),
        fromChain: z.string().describe("Source chain name (e.g., 'EthereumMainnet', 'U2USolarisMainnet')"),
        toChain: z.string().describe("Destination chain name"),
        amount: z.string().describe("Amount to bridge (e.g., '100', '1.5')"),
      },
    },
    async ({ tokenName, fromChain, toChain, amount }) => {
      try {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: "Invalid amount. Please provide a valid amount greater than 0." }) }],
            isError: true,
          };
        }

        // Mock quote - in production, call Owlto API
        const estimatedFee = amountNum * 0.001; // 0.1% fee

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              quote: {
                tokenName,
                fromChain,
                toChain,
                amount,
                amountFormatted: `${amount} ${tokenName}`,
                estimatedFee,
                estimatedFeeFormatted: `~${estimatedFee.toFixed(4)} ${tokenName}`,
                estimatedTime: "~30 seconds",
                minAmount: "10",
                maxAmount: "100000",
              }
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );

  // bridge_get_supported_chains
  server.registerTool(
    "bridge_get_supported_chains",
    {
      description: "Get list of supported chains for bridging.",
      inputSchema: {},
    },
    async () => {
      try {
        const chains = Object.keys(SUPPORTED_BRIDGE_CHAINS).map(chain => ({
          name: chain,
          displayName: chain.replace("Mainnet", "").replace("Solaris", ""),
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              totalChains: chains.length,
              chains,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );
}
