#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { build_txn, submit_txn, query } from "./index.js";
import { SUPPORTED_CHAINS } from "./chains.js";

// Create server instance
const server = new McpServer({
    name: "blockchain-transaction-server",
    version: "1.0.0",
});

// Helper function to get supported chain IDs list
function getSupportedChainsList(): string {
    return Object.entries(SUPPORTED_CHAINS)
        .map(([id, chain]) => `${id} (${chain.name})`)
        .join(", ");
}

// Register build_txn tool
server.registerTool(
    "build_transaction",
    {
        description: `Build a blockchain transaction object that can be signed by a wallet. Supported chains: ${getSupportedChainsList()}`,
        inputSchema: {
            chainId: z
                .number()
                .describe("Chain ID (e.g., 1 for Ethereum Mainnet, 137 for Polygon, 39 for U2U Mainnet)"),
            to: z
                .string()
                .regex(/^0x[a-fA-F0-9]{40}$/)
                .describe("Recipient address (0x prefixed hex string)"),
            value: z
                .string()
                .describe("Amount to send in wei (as string to handle large numbers)"),
            data: z
                .string()
                .regex(/^0x[a-fA-F0-9]*$/)
                .optional()
                .describe("Optional transaction data for contract calls (0x prefixed hex string)"),
            gas: z
                .string()
                .optional()
                .describe("Optional gas limit (as string)"),
            gasPrice: z
                .string()
                .optional()
                .describe("Optional gas price for legacy transactions (as string, in wei)"),
            maxFeePerGas: z
                .string()
                .optional()
                .describe("Optional max fee per gas for EIP-1559 transactions (as string, in wei)"),
            maxPriorityFeePerGas: z
                .string()
                .optional()
                .describe("Optional priority fee for EIP-1559 transactions (as string, in wei)"),
            nonce: z
                .number()
                .optional()
                .describe("Optional transaction nonce"),
        },
    },
    async ({ chainId, to, value, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce }) => {
        try {
            const txData = build_txn({
                chainId,
                to: to as `0x${string}`,
                value: BigInt(value),
                data: data as `0x${string}` | undefined,
                gas: gas ? BigInt(gas) : undefined,
                gasPrice: gasPrice ? BigInt(gasPrice) : undefined,
                maxFeePerGas: maxFeePerGas ? BigInt(maxFeePerGas) : undefined,
                maxPriorityFeePerGas: maxPriorityFeePerGas ? BigInt(maxPriorityFeePerGas) : undefined,
                nonce,
            });

            // Convert BigInt values to strings for JSON serialization
            const serializedTxData = {
                chainId: txData.chainId,
                to: txData.to,
                value: txData.value.toString(),
                data: txData.data,
                gas: txData.gas?.toString(),
                gasPrice: txData.gasPrice?.toString(),
                maxFeePerGas: txData.maxFeePerGas?.toString(),
                maxPriorityFeePerGas: txData.maxPriorityFeePerGas?.toString(),
                nonce: txData.nonce,
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(serializedTxData, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error building transaction: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// Register submit_txn tool
server.registerTool(
    "submit_transaction",
    {
        description: "Submit a signed transaction to the blockchain network and broadcast it",
        inputSchema: {
            signedTransaction: z
                .string()
                .regex(/^0x[a-fA-F0-9]+$/)
                .describe("The serialized signed transaction (0x prefixed hex string)"),
            chainId: z
                .number()
                .describe("Chain ID to submit to (e.g., 1 for Ethereum Mainnet, 137 for Polygon)"),
            rpcUrl: z
                .string()
                .url()
                .optional()
                .describe("Optional custom RPC URL (defaults to chain's public RPC)"),
        },
    },
    async ({ signedTransaction, chainId, rpcUrl }) => {
        try {
            const txHash = await submit_txn(
                signedTransaction as `0x${string}`,
                chainId,
                rpcUrl
            );

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            transactionHash: txHash,
                            message: `Transaction submitted successfully on chain ${chainId}`,
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
);

// Register query tool
server.registerTool(
    "query_contract",
    {
        description: "Perform a read-only call to a smart contract (does not create a transaction)",
        inputSchema: {
            chainId: z
                .number()
                .describe("Chain ID (e.g., 1 for Ethereum Mainnet, 137 for Polygon)"),
            to: z
                .string()
                .regex(/^0x[a-fA-F0-9]{40}$/)
                .describe("Contract address (0x prefixed hex string)"),
            data: z
                .string()
                .regex(/^0x[a-fA-F0-9]+$/)
                .describe("Encoded function call data (0x prefixed hex string)"),
            value: z
                .string()
                .optional()
                .describe("Optional value to send with call (as string, in wei)"),
            rpcUrl: z
                .string()
                .url()
                .optional()
                .describe("Optional custom RPC URL"),
        },
    },
    async ({ chainId, to, data, value, rpcUrl }) => {
        try {
            const result = await query({
                chainId,
                to: to as `0x${string}`,
                data: data as `0x${string}`,
                value: value ? BigInt(value) : undefined,
                rpcUrl,
            });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            result: result || "0x",
                            message: "Contract query executed successfully",
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
);

// Register get_supported_chains tool
server.registerTool(
    "get_supported_chains",
    {
        description: "Get a list of all supported blockchain networks with their chain IDs and details",
        inputSchema: {},
    },
    async () => {
        const chains = Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => ({
            chainId: parseInt(id),
            name: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls.default.http,
            blockExplorers: chain.blockExplorers?.default,
        }));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        supportedChains: chains,
                        totalChains: chains.length,
                    }, null, 2),
                },
            ],
        };
    }
);

// Main function to start the server
async function main() {
    const transport = new StreamableHTTPServerTransport();
    await server.connect(transport);

    console.error("Blockchain Transaction MCP Server running on stdio");
    console.error(`Serving ${Object.keys(SUPPORTED_CHAINS).length} blockchain networks`);
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
