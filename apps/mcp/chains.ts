import { defineChain, type Chain } from 'viem';
import {
  mainnet,
  sepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
  bsc,
  bscTestnet,
  avalanche,
  avalancheFuji,
} from 'viem/chains';

// Define U2U custom chains
export const u2uMainnet = defineChain({
  id: 39,
  name: 'U2U Solaris Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Unicorn Ultra',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.u2u.xyz'],
      webSocket: ['wss://ws-mainnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'U2U Explorer', url: 'https://u2uscan.xyz' },
  },
});

export const u2uTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Unicorn Ultra',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
      webSocket: ['wss://ws-nebulas-testnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'U2U Testnet Explorer', url: 'https://testnet.u2uscan.xyz' },
  },
});

// Map of supported chains by chain ID
export const SUPPORTED_CHAINS: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  137: polygon,
  80002: polygonAmoy,
  42161: arbitrum,
  421614: arbitrumSepolia,
  10: optimism,
  11155420: optimismSepolia,
  8453: base,
  84532: baseSepolia,
  56: bsc,
  97: bscTestnet,
  43114: avalanche,
  43113: avalancheFuji,
  39: u2uMainnet,
  2484: u2uTestnet,
};

/**
 * Get chain configuration by chain ID
 * @param chainId - The chain ID
 * @returns Chain configuration or undefined if not supported
 */
export function getChainById(chainId: number): Chain | undefined {
  return SUPPORTED_CHAINS[chainId];
}

