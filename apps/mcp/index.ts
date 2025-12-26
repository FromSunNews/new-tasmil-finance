import { getChainById, SUPPORTED_CHAINS } from './chains.js';
import { getClient } from './client.js';

// Re-export for convenience
export { getChainById, u2uMainnet, u2uTestnet } from './chains.js';
export { getClient } from './client.js';

/**
 * Build transaction data from frontend parameters
 * Returns formatted transaction object that can be signed by frontend wallet
 * 
 * @param params - Transaction parameters from frontend
 * @param params.chainId - REQUIRED: The chain ID (1 for mainnet, 137 for polygon, etc.)
 * @param params.to - Recipient address
 * @param params.value - Amount to send in wei
 * @param params.data - Optional transaction data (for contract calls)
 * @param params.gas - Optional gas limit
 * @param params.gasPrice - Optional gas price (for legacy transactions)
 * @param params.maxFeePerGas - Optional max fee per gas (for EIP-1559 transactions)
 * @param params.maxPriorityFeePerGas - Optional priority fee (for EIP-1559 transactions)
 * @param params.nonce - Optional transaction nonce
 * @returns Formatted transaction object ready to be signed
 */
export function build_txn(params: {
  chainId: number;
  to: `0x${string}`;
  value: bigint;
  data?: `0x${string}`;
  gas?: bigint;
  gasPrice?: bigint;
  nonce?: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}) {
  // Validate chain is supported
  const chain = getChainById(params.chainId);
  if (!chain) {
    throw new Error(
      `Unsupported chain ID: ${params.chainId}. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`
    );
  }

  return {
    chainId: params.chainId,
    to: params.to,
    value: params.value,
    data: params.data,
    gas: params.gas,
    gasPrice: params.gasPrice,
    nonce: params.nonce,
    maxFeePerGas: params.maxFeePerGas,
    maxPriorityFeePerGas: params.maxPriorityFeePerGas,
  };
}

/**
 * Submit signed transaction to the blockchain
 * Takes the signed transaction data from frontend and broadcasts it
 * 
 * @param signedTransaction - The serialized signed transaction (0x prefixed hex string)
 * @param chainId - The chain ID to submit to (1 for mainnet, 137 for polygon, etc.)
 * @param rpcUrl - Optional custom RPC URL (defaults to chain's public RPC)
 * @returns Transaction hash
 */
export async function submit_txn(
  signedTransaction: `0x${string}`,
  chainId: number,
  rpcUrl?: string
): Promise<`0x${string}`> {
  const client = getClient(chainId, rpcUrl);

  const hash = await client.sendRawTransaction({
    serializedTransaction: signedTransaction,
  });

  return hash;
}

