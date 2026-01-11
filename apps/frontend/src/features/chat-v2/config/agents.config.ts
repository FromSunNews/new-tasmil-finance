// ⚙️ Agent configurations - centralized agent definitions

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  suggestions: string[];
  capabilities?: string[];
}

export const AGENTS: Record<string, AgentConfig> = {
  staking: {
    id: 'staking',
    name: 'Staking Agent',
    description: 'Stake tokens and manage validators',
    suggestions: [
      "What's my U2U balance?",
      "Show me all validators",
      "Stake 100 U2U to validator 1",
      "Check my pending rewards",
      "What's the current staking APR?",
      "Help me understand U2U staking",
      "Show network staking statistics",
      "I want to claim my rewards from validator 1",
    ],
    capabilities: ['stake', 'unstake', 'claim_rewards', 'view_validators'],
  },
  
  research: {
    id: 'research',
    name: 'Research Agent',
    description: 'Analyze crypto markets and trends',
    suggestions: [
      "What's the current price of Bitcoin?",
      "Analyze Ethereum's market trends",
      "Compare BTC vs ETH",
      "Show trending cryptocurrencies",
      "What are the top 10 cryptocurrencies by market cap?",
      "Give me an investment score for Bitcoin",
      "What's the latest crypto news?",
      "What's the market sentiment right now?",
    ],
    capabilities: ['price_lookup', 'market_analysis', 'news_search'],
  },
  
  yield: {
    id: 'yield',
    name: 'Yield Agent',
    description: 'Find and compare yield opportunities',
    suggestions: [
      "What are the best yields on Ethereum?",
      "Show stablecoin yields",
      "Find high APY pools",
      "Compare yields across chains",
      "Show me yield pools with over 20% APY",
      "Find USDC yield opportunities",
      "Show me Aave yield pools",
      "Give me a yield market overview",
    ],
    capabilities: ['yield_search', 'pool_analysis', 'apy_comparison'],
  },
  
  bridge: {
    id: 'bridge',
    name: 'Bridge Agent',
    description: 'Bridge tokens across chains',
    suggestions: [
      "Show available bridge routes",
      "Bridge 100 USDT to Ethereum",
      "What are the bridge fees?",
      "Supported chains for bridging",
      "How do I bridge tokens to U2U?",
      "Bridge USDC from BSC to U2U",
      "How long does bridging take?",
      "Is bridging safe?",
    ],
    capabilities: ['bridge_tokens', 'route_search', 'fee_estimation'],
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
