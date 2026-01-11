import { useCopilotChatSuggestions } from "@copilotkit/react-core";

interface CopilotSuggestionsProps {
  agentId: string;
}

export function CopilotSuggestions({ agentId }: CopilotSuggestionsProps) {
  // Define suggestions based on agent type
  const getSuggestionsConfig = (agentId: string) => {
    switch (agentId) {
      case "staking":
        return {
          instructions: "Suggest 3-4 staking-related actions the user might want to perform, such as staking tokens, checking rewards, or unstaking",
          maxSuggestions: 4,
        };
      case "bridge":
        return {
          instructions: "Suggest 3-4 bridge-related actions like bridging tokens between chains, checking bridge status, or finding best bridge routes",
          maxSuggestions: 4,
        };
      case "yield":
        return {
          instructions: "Suggest 3-4 yield farming actions like starting yield farming, checking pool APYs, or harvesting rewards",
          maxSuggestions: 4,
        };
      case "research":
        return {
          instructions: "Suggest 3-4 research actions like analyzing portfolios, checking token prices, or market analysis",
          maxSuggestions: 4,
        };
      default:
        return {
          instructions: "Suggest 4-5 DeFi actions the user might want to perform, including staking, bridging, yield farming, and portfolio analysis",
          maxSuggestions: 5,
        };
    }
  };

  const config = getSuggestionsConfig(agentId);
  
  useCopilotChatSuggestions(config);

  return null; // This component doesn't render anything, it just configures suggestions
}