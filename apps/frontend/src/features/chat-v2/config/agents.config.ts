// ⚙️ Agent configurations - centralized agent definitions
// Agent IDs must match backend LANGSERVE_GRAPHS keys (e.g., staking_agent, bridge_agent)

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  suggestions: string[];
  capabilities?: string[];
  supportedChains?: string[];
}

export const AGENTS: Record<string, AgentConfig> = {
  // Staking Agent - U2U Network staking operations
  staking_agent: {
    id: 'staking_agent',
    name: 'Staking Agent',
    description: 'Stake tokens and manage validators on U2U Network',
    icon: '/agents/staking-agent.svg',
    supportedChains: ['U2U'],
    suggestions: [
      "What's my staked balance?",
      "Show me all validators",
      "Stake 100 U2U to validator 1",
      "Check my pending rewards",
      "What's the current staking APR?",
      "Help me understand U2U staking",
      "Show network staking statistics",
      "Claim my rewards from validator 1",
    ],
    capabilities: ['stake', 'unstake', 'claim_rewards', 'view_validators'],
  },
  
  // Research Agent - Crypto market research and analysis
  research_agent: {
    id: 'research_agent',
    name: 'Research Agent',
    description: 'Analyze crypto markets, prices, and trends',
    icon: '/agents/research-agent.svg',
    supportedChains: [],
    suggestions: [
      "What's the current price of Bitcoin?",
      "Analyze Ethereum's market trends",
      "Show trending cryptocurrencies",
      "What are the top 10 coins by market cap?",
      "Get the latest crypto news",
      "Show me DeFi TVL data",
      "What's the global market overview?",
      "Search for Solana information",
    ],
    capabilities: ['price_lookup', 'market_analysis', 'news_search', 'defi_tvl'],
  },
  
  // Yield Agent - DeFi yield farming opportunities
  yield_agent: {
    id: 'yield_agent',
    name: 'Yield Agent',
    description: 'Find and compare DeFi yield opportunities',
    icon: '/agents/yield-agent.svg',
    supportedChains: ['Ethereum', 'Arbitrum', 'BSC', 'Polygon', 'Avalanche', 'Optimism'],
    suggestions: [
      "What are the best yields on Ethereum?",
      "Show stablecoin yields",
      "Find high APY pools over 20%",
      "Compare yields across chains",
      "Find USDC yield opportunities",
      "Show me Aave yield pools",
      "Give me a yield market overview",
      "Search for ETH yield pools",
    ],
    capabilities: ['yield_search', 'pool_analysis', 'apy_comparison', 'stablecoin_yields'],
  },
  
  // Bridge Agent - Cross-chain token bridging
  bridge_agent: {
    id: 'bridge_agent',
    name: 'Bridge Agent',
    description: 'Bridge tokens between U2U and other chains',
    icon: '/agents/bridge-agent.svg',
    supportedChains: ['U2U', 'Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Optimism'],
    suggestions: [
      "Show available bridge routes",
      "What are the bridge fees?",
      "Supported chains for bridging",
      "How do I bridge tokens to U2U?",
      "Get a quote for bridging 100 USDT",
      "Bridge from Ethereum to U2U",
      "How long does bridging take?",
      "What tokens can I bridge?",
    ],
    capabilities: ['bridge_tokens', 'route_search', 'fee_estimation', 'get_quote'],
  },
} as const;

export const DEFAULT_AGENT: AgentConfig = {
  id: 'default',
  name: 'DeFi Agent',
  description: 'General DeFi assistant',
  suggestions: [
    "What can you help me with?",
    "Show me yield opportunities",
    "Check crypto prices",
    "Help me stake tokens",
    "Tell me about cryptocurrency market trends",
    "How do I get started with crypto investing?",
  ],
  capabilities: [],
};

export function getAgentConfig(agentId: string): AgentConfig {
  return AGENTS[agentId] ?? DEFAULT_AGENT;
}

export function getAgentSuggestions(agentId: string, count = 4): string[] {
  const config = getAgentConfig(agentId);
  // Shuffle and return random suggestions
  const shuffled = [...config.suggestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get all agent IDs
export function getAllAgentIds(): string[] {
  return Object.keys(AGENTS);
}

// Get agent by ID with fallback
export function getAgent(agentId: string): AgentConfig | null {
  return AGENTS[agentId] ?? null;
}
