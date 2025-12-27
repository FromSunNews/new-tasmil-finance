"use client";

import Image from "next/image";
import { LucideIcon, Settings, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TokenIcon } from "@web3icons/react/dynamic";

// Agent type from API response
type Agent = {
  id: string;
  name: string;
  description: string[];
  type: 'Strategy' | 'Intelligence';
  icon: string;
  supportedChains: string[];
};

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  hasPromptToDeFi?: boolean;
}

// Map agent type to icon
const getTypeIcon = (type: string): LucideIcon => {
  return type === "Strategy" ? Settings : Sparkles;
};

// Map chain name to token symbol for web3icons
const getChainTokenSymbol = (chainName: string): string => {
  const chainMap: Record<string, string> = {
    'ethereum': 'eth',
    'eth': 'eth',
    'arbitrum': 'arb',
    'avalanche': 'avax',
    'avax': 'avax',
    'bnb': 'bnb',
    'bsc': 'bnb',
    'base': 'base',
    'blast': 'blast',
    'celo': 'celo',
    'fantom': 'ftm',
    'gnosis': 'gno',
    'linea': 'linea',
    'manta': 'manta',
    'mantle': 'mnt',
    'metis': 'metis',
    'mode': 'mode',
    'moonbeam': 'glmr',
    'optimism': 'op',
    'op': 'op',
    'polygon': 'matic',
    'scroll': 'scr',
    'solana': 'sol',
    'aurora': 'aurora',
    'zksync': 'zk',
  };
  
  const normalized = chainName.toLowerCase().replace(/\s+/g, '');
  return chainMap[normalized] || normalized;
};

// Check if chain is U2U (use PNG instead of web3icons)
const isU2UChain = (chainName: string): boolean => {
  const normalized = chainName.toLowerCase().replace(/\s+/g, '');
  return normalized === 'u2u' || normalized === 'u2usolaris';
};

// Chain icon component
function ChainIcon({ chain, size = 36 }: { chain: string; size?: number }) {
  if (isU2UChain(chain)) {
    return (
      <Image
        src="/images/tokens/u2u.png"
        alt="U2U"
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  
  return (
    <TokenIcon
      symbol={getChainTokenSymbol(chain)}
      variant="branded"
      size={size}
    />
  );
}

export function AgentCard({ agent, onClick, hasPromptToDeFi = false }: AgentCardProps) {
  const TypeIcon = getTypeIcon(agent.type);
  
  // Extract first 5 chains for display (group avatar style)
  const displayChains = agent.supportedChains.slice(0, 5);
  const extraChains = agent.supportedChains.length - 5;

  return (
    <Card 
      className="group relative transition-all duration-300 hover:border-muted-foreground/30 cursor-pointer"
      onClick={onClick}
    >
      {hasPromptToDeFi && (
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="gap-1">
            <Sparkles size={12} />
            Prompt-to-DeFi
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        {/* Image and Title in horizontal layout */}
        <div className="flex items-center gap-4">
          {/* Agent Icon */}
            {agent.icon ? (
              <Image
                src={agent.icon}
                alt={agent.name}
                width={80}
                height={80}
                className="rounded object-cover"
              />
            ) : (
              <TypeIcon size={80} className="text-foreground" />
            )}

          {/* Title and Type Badge */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2">{agent.name}</h3>
            <Badge variant="outline" className="gap-1">
              <TypeIcon size={12} />
              {agent.type}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-2 min-h-[72px]">
          {agent.description.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-muted-foreground mt-0.5">•</span>
              {feature}
            </li>
          ))}
        </ul>

        {agent.supportedChains.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Supported Chains</span>
              <div className="flex items-center -space-x-2">
                {displayChains.map((chain, index) => (
                  <Avatar 
                    key={index} 
                    className="h-8 w-8 ring-0 flex items-center justify-center bg-secondary"
                  >
                    <ChainIcon chain={chain} size={22} />
                  </Avatar>
                ))}
                {extraChains > 0 && (
                  <Avatar className="h-8 w-8 z-10">
                    <AvatarFallback className="text-xs font-medium bg-secondary text-muted-foreground">
                      +{extraChains}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
