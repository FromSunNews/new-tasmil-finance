import { createPublicClient, http, type PublicClient, defineChain } from "viem";
import { mainnet } from "viem/chains";

// Define U2U Chain manually if not available in viem/chains
export const u2u_solaris = defineChain({
  id: 39,
  name: 'U2U Solaris Mainnet',
  network: 'u2u-solaris',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: { http: ['https://rpc-mainnet.u2u.xyz'] },
    public: { http: ['https://rpc-mainnet.u2u.xyz'] },
  },
  blockExplorers: {
    default: { name: 'U2U Explorer', url: 'https://u2uscan.xyz' },
  },
});

// Basic chain config mapping
const CHAINS: Record<number, any> = {
    1: mainnet,
    39: u2u_solaris,
};

// Cache clients
const clients: Record<number, PublicClient> = {};

export function getClient(chainId: number): PublicClient {
    if (clients[chainId]) {
        return clients[chainId];
    }

    const chain = CHAINS[chainId];
    if (!chain) {
        throw new Error(`Chain ID ${chainId} not supported`);
    }

    const client = createPublicClient({
        chain,
        transport: http(),
    });

    clients[chainId] = client as PublicClient;
    return clients[chainId];
}
