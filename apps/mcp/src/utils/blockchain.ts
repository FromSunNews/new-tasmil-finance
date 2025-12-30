import { getClient } from './client.js';
import type { Address, Hex } from 'viem';

/**
 * Build transaction data from parameters
 * Returns formatted transaction object that can be signed by frontend wallet
 * 
 * This is the CORE INFRASTRUCTURE function used by all transaction tools
 */
export function build_txn(params: {
  chainId: number;
  to: Address;
  value: bigint;
  data?: Hex;
  gas?: bigint;
  gasPrice?: bigint;
  nonce?: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}) {
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
 * This is the CORE INFRASTRUCTURE function used by all transaction tools
 */
export async function submit_txn(
  signedTransaction: Hex,
  chainId: number,
  rpcUrl?: string
): Promise<Hex> {
  const client = getClient(chainId, rpcUrl);

  const hash = await client.sendRawTransaction({
    serializedTransaction: signedTransaction,
  });

  return hash;
}

/**
 * Perform a read-only call to a contract
 * Useful for querying state without creating a transaction
 * 
 * This is the CORE INFRASTRUCTURE function used by all query tools
 */
export async function query(params: {
  chainId: number;
  to: Address;
  data: Hex;
  value?: bigint;
  rpcUrl?: string;
}): Promise<Hex | undefined> {
  const client = getClient(params.chainId, params.rpcUrl);

  const { data } = await client.call({
    to: params.to,
    data: params.data,
    value: params.value,
  });

  return data;
}
