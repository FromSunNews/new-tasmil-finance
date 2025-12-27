"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { memo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { ChatMessage } from "@repo/api";
import { Suggestion } from "./elements/suggestion";
import { ChevronDownIcon, ChevronUpIcon, RefreshIcon } from "./icons";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

// Agent-specific suggestions
const agentSuggestions = {
  staking: [
    // Staking Query Actions - Balance & Account
    "What's my U2U balance?",
    "Check my wallet balance on U2U network",
    "Show my account balance",
    
    // Staking Query Actions - Network Info
    "Show current epoch on U2U network",
    "What's the total stake in the network?",
    "What's the total active stake?",
    "Show network staking statistics",
    
    // Staking Query Actions - Validator Info
    "Check validator 1 information",
    "Show validator 2 details",
    "What's validator 1 self-stake amount?",
    "Check validator 3 self-stake amount",
    
    // Staking Query Actions - My Stakes & Rewards
    "How much have I staked to validator 1?",
    "Check my stake on validator 2",
    "Show my pending rewards from validator 1",
    "Show my pending rewards from validator 2",
    "Check my rewards stash for validator 1",
    "What's my lockup info for validator 1?",
    "Show my unlocked stake for validator 2",
    
    // Staking Operation Actions - Delegate
    "I want to stake 100 U2U to validator 1",
    "Stake 50 U2U to validator 2",
    "Help me delegate 200 U2U to validator 1",
    
    // Staking Operation Actions - Undelegate
    "Help me unstake 50 U2U from validator 1",
    "I want to unstake 100 U2U from validator 2",
    "Undelegate 75 U2U from validator 1",
    
    // Staking Operation Actions - Rewards
    "I want to claim my rewards from validator 1",
    "Claim rewards from validator 2",
    "Restake my rewards on validator 1",
    "Restake my rewards on validator 2",
    
    // Staking Operation Actions - Lock
    "Lock 200 U2U for 30 days on validator 1",
    "Lock 100 U2U for 14 days on validator 2",
    "I want to lock stake for 7 days",
    
    // Advanced Staking Queries - APR & Statistics
    "What's the APR for staking 1000 U2U to validator 1?",
    "Show me all validators information",
    "Get staking APR for validator 2 with 500 U2U",
    "Display overall network staking statistics",
    "Show me the best validators to stake with",
    "What's the current staking APR for 100 U2U?",
    
    // General Staking Help
    "Help me understand U2U staking",
    "What are the risks of staking?",
    "How do I choose the best validator?",
  ],
  
  research: [
    // Price & Market Data
    "What's the current price of Bitcoin?",
    "Show me Ethereum's market cap and volume",
    "Get the price of Solana and its 24h change",
    "What are the top 10 cryptocurrencies by market cap?",
    
    // Technical Analysis
    "Analyze Bitcoin's RSI and MACD indicators",
    "Calculate moving averages for Ethereum",
    "Show me Bollinger Bands for BNB",
    "What's the volatility of Cardano?",
    
    // Investment Analysis
    "Give me an investment score for Bitcoin",
    "Should I invest in Ethereum right now?",
    "Compare Bitcoin vs Ethereum for investment",
    "What are the best altcoins to invest in?",
    
    // Market Research
    "What are the trending cryptocurrencies today?",
    "Show me the global crypto market statistics",
    "What's the total DeFi TVL right now?",
    "Which coins are gaining the most today?",
    
    // News & Updates
    "What's the latest crypto news?",
    "Any recent updates about Bitcoin?",
    "Show me market developments today",
    "What's happening in the DeFi space?",
    
    // Comparison & Research
    "Compare Solana vs Cardano",
    "Research Polygon's fundamentals",
    "Generate a research report for Chainlink",
    "What are the pros and cons of investing in Avalanche?",
    
    // Market Trends
    "What are the best performing coins this week?",
    "Show me coins with highest volume today",
    "Which cryptocurrencies are oversold?",
    "What's the market sentiment right now?",
  ],
  
  yield: [
    // General Yield Discovery
    "Show me the best yield opportunities right now",
    "What are the top APY pools across all chains?",
    "Find high yield farming opportunities",
    "Show me yield pools with over 20% APY",
    
    // Chain-Specific Yields
    "What are the best yields on Ethereum?",
    "Show me top APY pools on Arbitrum",
    "Find yield opportunities on BSC",
    "What's the best yield on Polygon?",
    "Show me Solana yield farming options",
    "Top yields on Avalanche",
    
    // Token-Specific Yields
    "Where can I get the best yield for ETH?",
    "Find USDC yield opportunities",
    "Best yields for WBTC",
    "Where to farm DAI for best APY?",
    "Show me USDT yield pools",
    
    // Stablecoin Yields
    "What are the best stablecoin yields?",
    "Show me safe stablecoin farming options",
    "Low risk yield opportunities",
    "Best stablecoin APY on Ethereum",
    "Safe yields with high TVL",
    
    // Protocol-Specific
    "Show me Aave yield pools",
    "What yields does Uniswap offer?",
    "Curve Finance yield opportunities",
    "Compound lending rates",
    "GMX yield options",
    
    // Market Overview
    "Give me a yield market overview",
    "Which chains have the highest yields?",
    "Show me yield statistics across DeFi",
    "Compare yields across different chains",
    "What's the average DeFi yield right now?",
    
    // Risk Assessment
    "Show me high TVL yield pools",
    "Find yields with low impermanent loss risk",
    "Safe yield farming recommendations",
    "Which pools have the most liquidity?",
  ],
  
  bridge: [
    // General Bridge Questions
    "Show me available bridge routes",
    "What tokens can I bridge?",
    "What chains are supported for bridging?",
    "How do I bridge tokens to U2U?",
    
    // Bridge from U2U
    "Bridge 100 USDT from U2U to Ethereum",
    "Bridge 50 USDC from U2U to BSC",
    "Bridge tokens from U2U to Polygon",
    "Bridge U2U to Arbitrum",
    
    // Bridge to U2U
    "Bridge 100 USDT from Ethereum to U2U",
    "Bridge USDC from BSC to U2U",
    "Bridge tokens from Polygon to U2U",
    "How to bridge from Arbitrum to U2U?",
    
    // Quote & Fees
    "What's the fee to bridge USDT to Ethereum?",
    "Get a bridge quote for 100 USDC",
    "How much does it cost to bridge to BSC?",
    "Show me bridge fees for U2U",
    
    // Bridge Limits
    "What's the minimum amount to bridge?",
    "What's the maximum bridge amount?",
    "Show me bridge limits for USDT",
    
    // Chain-Specific
    "Bridge to Ethereum",
    "Bridge to BSC",
    "Bridge to Polygon",
    "Bridge to Arbitrum",
    "Bridge to Optimism",
    "Bridge to Avalanche",
    
    // Help & Info
    "How long does bridging take?",
    "Is bridging safe?",
    "What is Owlto Bridge?",
    "Help me understand cross-chain bridging",
  ],
  
  // Default suggestions for unknown agents or general chat
  default: [
    "What can you help me with?",
    "Tell me about cryptocurrency market trends",
    "How do I get started with crypto investing?",
    "What's the difference between Bitcoin and Ethereum?",
    "Explain blockchain technology to me",
    "What are the risks of cryptocurrency investing?",
    "How do I choose a crypto wallet?",
    "What is DeFi and how does it work?",
  ]
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const params = useParams();
  const agentId = params?.["agent-id"] as string;
  
  // Debug log to check agentId
  console.log("SuggestedActions - Current agentId:", agentId);
  
  // Get suggestions based on current agent
  const getSuggestionsForAgent = (agentId: string | undefined) => {
    if (!agentId) return agentSuggestions.default;
    
    // Map agent ID to suggestions
    switch (agentId) {
      case "staking":
        return agentSuggestions.staking;
      case "research":
        return agentSuggestions.research;
      case "yield":
        return agentSuggestions.yield;
      case "bridge":
        return agentSuggestions.bridge;
      default:
        return agentSuggestions.default;
    }
  };
  
  const availableSuggestions = getSuggestionsForAgent(agentId);
  console.log("SuggestedActions - Available suggestions count:", availableSuggestions.length);
  
  // Randomly select 4 suggestions to show - use timestamp to ensure refresh
  const getRandomSuggestions = () => {
    const shuffled = [...availableSuggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  // Use state to store suggestions and collapse state
  const [suggestedActions, setSuggestedActions] = useState(() => getRandomSuggestions());
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapse state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('suggestions-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  // Save collapse state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('suggestions-collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);
  
  // Refresh suggestions every time the component mounts (when AI finishes responding)
  useEffect(() => {
    setSuggestedActions(getRandomSuggestions());
  }, [availableSuggestions.length]); // Refresh when agent changes
  
  // Get agent display name for UI
  const getAgentDisplayName = (agentId: string | undefined) => {
    switch (agentId) {
      case "staking":
        return "Staking Agent";
      case "research":
        return "Research Agent";
      case "yield":
        return "Yield Agent";
      case "bridge":
        return "Bridge Agent";
      default:
        return "General Assistant";
    }
  };
  
  const agentDisplayName = getAgentDisplayName(agentId);

  return (
    <div className="w-full py-2">
      {/* Header with collapse/expand controls */}
      <div className="flex flex-col items-center justify-between rounded-lg gap-1">
        <span className="text-xs text-muted-foreground">
          Suggestions for {agentDisplayName}
        </span>
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <button
              onClick={() => setSuggestedActions(getRandomSuggestions())}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
              type="button"
              title="Refresh suggestions"
            >
              <RefreshIcon size={14} />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            type="button"
            title={isCollapsed ? "Show suggestions" : "Hide suggestions"}
          >
            {isCollapsed ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
          </button>
        </div>
      </div>
      
      {/* Suggestions grid with animation */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="grid w-full gap-2 sm:grid-cols-2"
              data-testid="suggested-actions"
            >
              {suggestedActions.map((suggestedAction: string, index: number) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  initial={{ opacity: 0, y: 20 }}
                  key={suggestedAction}
                  transition={{ delay: 0.05 * index }}
                >
                  <Suggestion
                    className="h-auto w-full whitespace-normal p-3 text-left"
                    onClick={(suggestion) => {
                      // Preserve current route instead of hardcoding /chat/
                      const currentPath = window.location.pathname;
                      if (!currentPath.includes(chatId)) {
                        window.history.replaceState({}, "", `${currentPath}/${chatId}`);
                      }
                      sendMessage({
                        role: "user",
                        parts: [{ type: "text", text: suggestion }],
                      });
                    }}
                    suggestion={suggestedAction}
                  >
                    {suggestedAction}
                  </Suggestion>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);