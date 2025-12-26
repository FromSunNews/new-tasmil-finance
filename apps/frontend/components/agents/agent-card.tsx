"use client";

import Image from "next/image";
import { LucideIcon, Settings, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

// Map chain name to logo path
const getChainLogo = (chainName: string): string => {
  const chainMap: Record<string, string> = {
    'ethereum': '/images/chains/ethereum.png',
    'eth': '/images/chains/ethereum.png',
    'arbitrum': '/images/chains/arbitrum.png',
    'avalanche': '/images/chains/avalanche.png',
    'avax': '/images/chains/avalanche.png',
    'bnb': '/images/chains/bnb.png',
    'bsc': '/images/chains/bnb.png',
    'core': '/images/chains/core.png',
    'duckchain': '/images/chains/duckchain.png',
    'linea': '/images/chains/linea.png',
    'manta': '/images/chains/manta.png',
    'mantle': '/images/chains/mantle.png',
    'metis': '/images/chains/metis.png',
    'mint': '/images/chains/mint.png',
    'morph': '/images/chains/morph.png',
    'optimism': '/images/chains/optimism.png',
    'op': '/images/chains/optimism.png',
    'overprotocol': '/images/chains/overprotocol.png',
    'polygon': '/images/chains/polygonpos.png',
    'polygonpos': '/images/chains/polygonpos.png',
    'polygonzk': '/images/chains/polygonzk.png',
    'scroll': '/images/chains/scroll.png',
    'taiko': '/images/chains/taiko.png',
    'u2u': '/images/tokens/u2u.png',
    'u2usolaris': '/images/tokens/u2u.png',
    'xlayer': '/images/chains/xlayer.png',
    'zeta': '/images/chains/zeta.png',
    'zircuit': '/images/chains/zircuit.png',
    'zksync': '/images/chains/zksync.png',
  };
  
  const normalized = chainName.toLowerCase().replace(/\s+/g, '');
  return chainMap[normalized] || '/images/chains/default.png';
};

export function AgentCard({ agent, onClick, hasPromptToDeFi = false }: AgentCardProps) {
  const TypeIcon = getTypeIcon(agent.type);
  
  // Extract first few chains for display
  const displayChains = agent.supportedChains.slice(0, 3);
  const extraChains = agent.supportedChains.length - displayChains.length;

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
        <ul className="space-y-2">
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
              <div className="flex items-center gap-1">
                {displayChains.map((chain, index) => (
                  <Avatar key={index} className="h-8 w-8 border border-border">
                    <AvatarImage 
                      src={getChainLogo(chain)} 
                      alt={chain}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xs font-medium bg-secondary">
                      {chain[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {extraChains > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">+{extraChains}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

