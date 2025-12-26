import { createPublicClient, http } from 'viem';
import { getChainById, SUPPORTED_CHAINS } from './chains.js';

// Cache for reusable clients by chain ID
const clientCache = new Map<number, ReturnType<typeof createPublicClient>>();

/**
 * Get or create a PublicClient for a specific chain
 * Clients are cached for reuse to avoid creating new instances on every call
 * 
 * @param chainId - The chain ID (e.g., 1 for mainnet, 137 for polygon)
 * @param rpcUrl - Optional custom RPC URL (defaults to chain's public RPC)
 * @returns PublicClient instance for the specified chain
 * @throws Error if the chain ID is not supported
 */
export function getClient(chainId: number, rpcUrl?: string) {
  const chain = getChainById(chainId);
  
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}. Please use one of: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`);
  }

  // Check if we already have a client for this chain
  if (clientCache.has(chainId) && !rpcUrl) {
    return clientCache.get(chainId)!;
  }

  // Create new client
  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  // Cache it if using default RPC
  if (!rpcUrl) {
    clientCache.set(chainId, client);
  }

  return client;
}

