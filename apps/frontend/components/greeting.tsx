import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Typography } from "./ui/typography";

// Agent-specific content
const agentContent = {
  staking: {
    title: "Your Staking Assistant",
    subtitle: "Ready to help you stake, delegate, and manage your U2U rewards?"
  },
  research: {
    title: "Your Crypto Research Analyst", 
    subtitle: "What cryptocurrency would you like to analyze today?"
  },
  yield: {
    title: "Your DeFi Yield Hunter",
    subtitle: "Ready to find the best yield opportunities across all chains?"
  },
  bridge: {
    title: "Your Cross-Chain Bridge Assistant",
    subtitle: "Ready to help you bridge tokens between U2U and other chains?"
  },
  default: {
    title: "Your Intelligent DeFi Assistant",
    subtitle: "How can I help you today?"
  }
};

export const Greeting = () => {
  const params = useParams();
  const agentId = params?.["agent-id"] as string;
  
  // Debug log
  console.log("Greeting - Current agentId:", agentId);
  
  // Get content based on current agent
  const getContentForAgent = (agentId: string | undefined) => {
    if (!agentId) return agentContent.default;
    
    switch (agentId) {
      case "staking":
        return agentContent.staking;
      case "research":
        return agentContent.research;
      case "yield":
        return agentContent.yield;
      case "bridge":
        return agentContent.bridge;
      default:
        return agentContent.default;
    }
  };
  
  const content = getContentForAgent(agentId);
  console.log("Greeting - Selected content:", content);
  
  return (
    <div
      className="mt-4 flex size-full flex-col justify-center px-4 md:mt-16 "
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className=""
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <Typography className="font-semibold text-[30px]">
          {content.title}
        </Typography>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className=""
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <Typography className="text-2xl text-muted-foreground md:text-3xl">
          {content.subtitle}
        </Typography>
      </motion.div>
    </div>
  );
};
