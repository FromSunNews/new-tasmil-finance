"use client";

// 🎨 Greeting component - matches old UI styling

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Typography } from '@/shared/ui/typography';

// Agent-specific content
const agentContent: Record<string, { title: string; subtitle: string }> = {
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

interface GreetingProps {
  agentId: string;
}

function GreetingComponent({ agentId }: GreetingProps) {
  // Get content based on current agent
  const getContentForAgent = (id: string) => {
    // Handle both formats: "staking-agent" and "staking"
    const normalizedAgentId = id.replace('-agent', '');
    return agentContent[normalizedAgentId] ?? agentContent['default']!;
  };
  
  const content = getContentForAgent(agentId);
  
  return (
    <div
      className="mt-4 flex size-full flex-col justify-center px-4 md:mt-16"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
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
}

export const Greeting = memo(GreetingComponent);
