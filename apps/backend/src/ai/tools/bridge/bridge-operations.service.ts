import { Injectable } from "@nestjs/common";
import { tool } from "ai";
import { Bridge, type BridgeOptions, NetworkType } from "owlto-sdk";
import { z } from "zod";
import { findBridgePair, validateBridgeAmount, type BridgePair } from "./bridge-data";

const DEFAULT_PROVIDER_URLS: Record<string, string> = {
  EthereumMainnet: "wss://ethereum-rpc.publicnode.com",
  U2USolarisMainnet: "https://rpc-mainnet.u2u.xyz",
  AvalancheMainnet: "wss://0xrpc.io/avax",
  BnbMainnet: "wss://bsc-rpc.publicnode.com",
  ArbitrumOneMainnet: "wss://arbitrum-one-rpc.publicnode.com",
  OptimismMainnet: "https://endpoints.omniatech.io/v1/op/mainnet/public",
  LineaMainnet: "https://linea.therpc.io",
  PolygonMainnet: "wss://polygon-bor-rpc.publicnode.com",
  BaseMainnet: "wss://base-rpc.publicnode.com",
};

@Injectable()
export class BridgeOperationsService {
  /**
   * Tool 1: Get available bridge pairs
   */
  getBridgePairsTool() {
    return tool({
      description:
        "Get all available bridge pairs for cross-chain transfers. Use this when users ask about available bridges, supported chains, or what tokens can be bridged.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getBridgePairs tool called");

          const options: BridgeOptions = {};
          const bridge = new Bridge(options);

          const { pairInfos } = await bridge.getAllPairInfos();

          // Filter for U2U pairs
          const u2uPairs = pairInfos.filter(
            (item: any) =>
              item.fromChainName.toLowerCase().includes("u2u") ||
              item.toChainName.toLowerCase().includes("u2u")
          );

          console.log(`Found ${u2uPairs.length} U2U bridge pairs`);

          return {
            success: true,
            action: "getBridgePairs",
            pairs: u2uPairs.map((pair: any) => ({
              tokenName: pair.tokenName,
              fromChainName: pair.fromChainName,
              toChainName: pair.toChainName,
              minValue: pair.minValue,
              maxValue: pair.maxValue,
            })),
            totalPairs: u2uPairs.length,
            message: `Found ${u2uPairs.length} bridge pairs involving U2U`,
          };
        } catch (error) {
          console.error("Error in getBridgePairs:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 2: Get bridge quote
   */
  getBridgeQuoteTool(walletAddress?: string) {
    return tool({
      description:
        "Get a quote for bridging tokens between chains. Use this to show users the estimated fees and amounts before executing a bridge.",
      inputSchema: z.object({
        tokenName: z
          .string()
          .describe("Token symbol to bridge (e.g., 'USDT', 'USDC', 'U2U')"),
        fromChain: z
          .string()
          .describe("Source chain name (e.g., 'EthereumMainnet', 'U2USolarisMainnet', 'BnbMainnet')"),
        toChain: z
          .string()
          .describe("Destination chain name (e.g., 'EthereumMainnet', 'U2USolarisMainnet', 'BnbMainnet')"),
        amount: z.string().describe("Amount to bridge (e.g., '100', '1.5')"),
      }),
      execute: async ({ tokenName, fromChain, toChain, amount }) => {
        try {
          console.log("🔍 getBridgeQuote tool called:", { tokenName, fromChain, toChain, amount });

          const amountNum = Number.parseFloat(amount);
          if (Number.isNaN(amountNum) || amountNum <= 0) {
            return {
              success: false,
              error: "Invalid amount. Please provide a valid amount greater than 0.",
            };
          }

          const bridge = new Bridge({});
          const { pairInfos } = await bridge.getAllPairInfos();
          
          const u2uPairs = pairInfos.filter(
            (item: any) =>
              item.fromChainName.toLowerCase().includes("u2u") ||
              item.toChainName.toLowerCase().includes("u2u")
          );

          const bridgePair = findBridgePair(u2uPairs as BridgePair[], tokenName, fromChain, toChain);
          if (!bridgePair) {
            return {
              success: false,
              error: `No bridge route found for ${tokenName} from ${fromChain} to ${toChain}`,
              availableRoutes: u2uPairs.slice(0, 5).map((p: any) => 
                `${p.tokenName}: ${p.fromChainName} → ${p.toChainName}`
              ),
            };
          }

          const amountValidation = validateBridgeAmount(bridgePair, amount);
          if (!amountValidation.valid) {
            return {
              success: false,
              error: amountValidation.error,
            };
          }

          return {
            success: true,
            action: "getBridgeQuote",
            quote: {
              tokenName,
              fromChain,
              toChain,
              amount: amountNum,
              amountFormatted: `${amount} ${tokenName}`,
              minAmount: bridgePair.minValue.uiValue,
              maxAmount: bridgePair.maxValue.uiValue,
              estimatedTime: "~30 seconds",
            },
            message: `Quote for bridging ${amount} ${tokenName} from ${fromChain} to ${toChain}`,
          };
        } catch (error) {
          console.error("Error in getBridgeQuote:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 3: Initiate cross-chain bridge transaction
   */
  bridgeTokensTool(walletAddress?: string) {
    return tool({
      description:
        "Bridge tokens from one chain to another using Owlto Bridge. Use this when users want to transfer tokens cross-chain. Requires wallet connection.",
      inputSchema: z.object({
        tokenName: z
          .string()
          .describe("Token symbol to bridge (e.g., 'USDT', 'USDC', 'U2U')"),
        fromChain: z
          .string()
          .describe("Source chain name (e.g., 'EthereumMainnet', 'U2USolarisMainnet', 'BnbMainnet')"),
        toChain: z
          .string()
          .describe("Destination chain name (e.g., 'EthereumMainnet', 'U2USolarisMainnet', 'BnbMainnet')"),
        amount: z.string().describe("Amount to bridge (e.g., '100', '1.5')"),
        toAddress: z
          .string()
          .optional()
          .describe("Destination address. Leave empty to use connected wallet address."),
      }),
      execute: async ({ tokenName, fromChain, toChain, amount, toAddress }) => {
        try {
          console.log("🔍 bridgeTokens tool called:", {
            tokenName,
            fromChain,
            toChain,
            amount,
            toAddress,
            walletAddress,
          });

          // Validate inputs
          const amountNum = Number.parseFloat(amount);
          if (Number.isNaN(amountNum) || amountNum <= 0) {
            return {
              success: false,
              error: "Invalid amount. Please provide a valid amount greater than 0.",
            };
          }

          // Get bridge pairs to validate route and limits
          const bridge = new Bridge({});
          const { pairInfos } = await bridge.getAllPairInfos();
          const u2uPairs = pairInfos.filter(
            (item: any) =>
              item.fromChainName.toLowerCase().includes("u2u") ||
              item.toChainName.toLowerCase().includes("u2u")
          );

          // Find matching bridge pair
          const bridgePair = findBridgePair(u2uPairs as BridgePair[], tokenName, fromChain, toChain);
          if (!bridgePair) {
            return {
              success: false,
              error: `No bridge route found for ${tokenName} from ${fromChain} to ${toChain}`,
            };
          }

          // Validate amount against bridge limits
          const amountValidation = validateBridgeAmount(bridgePair, amount);
          if (!amountValidation.valid) {
            return {
              success: false,
              error: amountValidation.error,
            };
          }

          // Handle address resolution
          const actualFromAddress = walletAddress;
          const actualToAddress = toAddress || walletAddress;

          if (!DEFAULT_PROVIDER_URLS[fromChain]) {
            return {
              success: false,
              error: `Unsupported chain: ${fromChain}. Available chains: ${Object.keys(DEFAULT_PROVIDER_URLS).join(", ")}`,
            };
          }

          try {
            // Get bridge transaction details
            console.log("Step 1: Fetching bridge transaction details...");
            const result = await bridge.getBuildTx(
              tokenName,
              fromChain,
              toChain,
              amount,
              actualFromAddress as string,
              actualToAddress as string
            );

            console.log("✓ Bridge transaction built successfully");

            // Validate network type
            if (result.networkType !== NetworkType.NetworkTypeEthereum) {
              return {
                success: false,
                error: "Only Ethereum network type is supported",
              };
            }

            // Return bridge transaction data for UI to handle signing
            return {
              success: true,
              action: "bridge",
              tokenName,
              fromChain,
              toChain,
              amount: amountNum,
              amountFormatted: `${amount} ${tokenName}`,
              fromAddress: actualFromAddress,
              toAddress: actualToAddress,
              message: `Ready to bridge ${amount} ${tokenName} from ${fromChain} to ${toChain}`,
              estimatedTime: "~30s",
              requiresWallet: !walletAddress,
              requiresConfirmation: true,
              bridgePair: {
                fromTokenAddress: bridgePair.fromTokenAddress,
                toTokenAddress: bridgePair.toTokenAddress,
                fromDecimals: bridgePair.fromTokenDecimals,
                toDecimals: bridgePair.toTokenDecimals,
                minAmount: bridgePair.minValue.uiValue,
                maxAmount: bridgePair.maxValue.uiValue,
                contractAddress: bridgePair.contractAddress,
              },
              bridgeData: {
                networkType: result.networkType,
                approveTx: result.txs.approveBody,
                transferTx: result.txs.transferBody,
                providerUrl: DEFAULT_PROVIDER_URLS[fromChain],
              },
            };
          } catch (bridgeError) {
            console.error("Bridge execution error:", bridgeError);
            return {
              success: false,
              error: `Bridge execution failed: ${bridgeError instanceof Error ? bridgeError.message : "Unknown error"}`,
            };
          }
        } catch (error) {
          console.error("Error in bridgeTokens:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 4: Get supported chains
   */
  getSupportedChainsTool() {
    return tool({
      description:
        "Get list of supported chains for bridging. Use this when users ask what chains are supported.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getSupportedChains tool called");

          const supportedChains = Object.keys(DEFAULT_PROVIDER_URLS).map(chain => ({
            name: chain,
            displayName: chain.replace("Mainnet", ""),
          }));

          return {
            success: true,
            chains: supportedChains,
            totalChains: supportedChains.length,
            message: `${supportedChains.length} chains supported for bridging`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Get all tools
   */
  getAllTools(walletAddress?: string) {
    return {
      getBridgePairs: this.getBridgePairsTool(),
      getBridgeQuote: this.getBridgeQuoteTool(walletAddress),
      bridgeTokens: this.bridgeTokensTool(walletAddress),
      getSupportedChains: this.getSupportedChainsTool(),
    };
  }
}
