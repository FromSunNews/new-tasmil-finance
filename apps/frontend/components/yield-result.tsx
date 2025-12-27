"use client";

import { TrendingUp, TrendingDown, AlertCircle, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface YieldResultProps {
  result: any;
  toolType: string;
}

// Format large numbers
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return `${num.toFixed(2)}`;
};

// Format percentage
const formatPercent = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
};

// APY indicator with color
const APYIndicator = ({ value }: { value: number | undefined | null }) => {
  if (value === undefined || value === null) return <span className="text-muted-foreground">N/A</span>;
  
  const getColor = () => {
    if (value >= 20) return "text-green-500";
    if (value >= 10) return "text-yellow-500";
    return "text-blue-500";
  };
  
  return (
    <span className={cn("flex items-center gap-1 font-medium", getColor())}>
      <TrendingUp className="h-3 w-3" />
      {value.toFixed(2)}%
    </span>
  );
};

// Risk indicator
const RiskIndicator = ({ risk }: { risk: string | undefined }) => {
  if (!risk) return null;
  
  const getRiskColor = (risk: string) => {
    if (risk.toLowerCase().includes("no")) return "text-green-500 bg-green-500/10";
    if (risk.toLowerCase().includes("low")) return "text-yellow-500 bg-yellow-500/10";
    return "text-red-500 bg-red-500/10";
  };
  
  return (
    <span className={cn("px-2 py-1 rounded text-xs font-medium", getRiskColor(risk))}>
      {risk}
    </span>
  );
};

// Yield Pools Result
const YieldPoolsResult = ({ data }: { data: any }) => {
  const pools = data.pools || [];
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-2">
        Found {data.totalPools} yield opportunities
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {pools.slice(0, 15).map((pool: any, index: number) => (
          <div key={index} className="border border-border/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{pool.symbol}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {pool.chain}
                </span>
                {pool.stablecoin && (
                  <Shield className="h-3 w-3 text-green-500" title="Stablecoin" />
                )}
              </div>
              <APYIndicator value={pool.apy} />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Project:</span>
                <span className="ml-1 font-medium">{pool.project}</span>
              </div>
              <div>
                <span className="text-muted-foreground">TVL:</span>
                <span className="ml-1 font-medium">${formatNumber(pool.tvlUsd)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-muted/30 rounded p-1.5 text-center">
                <div className="text-muted-foreground">Base APY</div>
                <div className="font-medium">{pool.apyBase?.toFixed(2)}%</div>
              </div>
              <div className="bg-muted/30 rounded p-1.5 text-center">
                <div className="text-muted-foreground">Reward APY</div>
                <div className="font-medium">{pool.apyReward?.toFixed(2)}%</div>
              </div>
              <div className="bg-muted/30 rounded p-1.5 text-center">
                <div className="text-muted-foreground">IL Risk</div>
                <RiskIndicator risk={pool.ilRisk} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Top Yields by Chain Result
const TopYieldsByChainResult = ({ data }: { data: any }) => {
  const pools = data.pools || [];
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-2">
        Top yields on {data.chain} ({data.totalPools} pools found)
      </div>
      <div className="max-h-[350px] overflow-y-auto space-y-1">
        {pools.map((pool: any, index: number) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6 text-xs">#{pool.rank}</span>
              <div>
                <span className="font-medium">{pool.symbol}</span>
                <div className="text-xs text-muted-foreground">{pool.project}</div>
              </div>
              {pool.stablecoin && (
                <Shield className="h-3 w-3 text-green-500" title="Stablecoin" />
              )}
            </div>
            <div className="text-right">
              <APYIndicator value={pool.apy} />
              <div className="text-xs text-muted-foreground">
                TVL: ${formatNumber(pool.tvlUsd)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Yield Statistics Result
const YieldStatsResult = ({ data }: { data: any }) => {
  const overview = data.overview || {};
  const topChains = data.topChains || [];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="bg-muted/30 rounded p-3 text-center">
          <div className="text-muted-foreground text-xs">Total TVL</div>
          <div className="font-bold text-lg">${formatNumber(overview.totalTvl)}</div>
        </div>
        <div className="bg-muted/30 rounded p-3 text-center">
          <div className="text-muted-foreground text-xs">Total Pools</div>
          <div className="font-bold text-lg">{overview.totalPools?.toLocaleString()}</div>
        </div>
        <div className="bg-muted/30 rounded p-3 text-center">
          <div className="text-muted-foreground text-xs">Avg APY</div>
          <div className="font-bold text-lg">{overview.avgApy?.toFixed(1)}%</div>
        </div>
        <div className="bg-muted/30 rounded p-3 text-center">
          <div className="text-muted-foreground text-xs">Chains</div>
          <div className="font-bold text-lg">{overview.chainsCount}</div>
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground mb-2">Top Chains by TVL</div>
        <div className="space-y-1">
          {topChains.slice(0, 8).map((chain: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-6 text-xs">#{index + 1}</span>
                <span className="font-medium">{chain.chain}</span>
                <span className="text-xs text-muted-foreground">
                  {chain.poolCount} pools
                </span>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">${formatNumber(chain.totalTvl)}</div>
                <div className="text-xs text-muted-foreground">
                  Avg: {chain.avgApy?.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Token Search Result
const TokenSearchResult = ({ data }: { data: any }) => {
  const pools = data.pools || [];
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-2">
        {data.token} yield opportunities ({data.totalPools} found)
      </div>
      <div className="max-h-[350px] overflow-y-auto space-y-2">
        {pools.map((pool: any, index: number) => (
          <div key={index} className="border border-border/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{pool.symbol}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {pool.chain}
                </span>
                {pool.stablecoin && (
                  <Shield className="h-3 w-3 text-green-500" title="Stablecoin" />
                )}
              </div>
              <APYIndicator value={pool.apy} />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Project:</span>
                <span className="ml-1 font-medium">{pool.project}</span>
              </div>
              <div>
                <span className="text-muted-foreground">TVL:</span>
                <span className="ml-1 font-medium">${formatNumber(pool.tvlUsd)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stablecoin Yields Result
const StablecoinYieldsResult = ({ data }: { data: any }) => {
  const pools = data.pools || [];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Shield className="h-4 w-4 text-green-500" />
        Safe stablecoin yields ({data.totalPools} found)
      </div>
      <div className="max-h-[350px] overflow-y-auto space-y-1">
        {pools.map((pool: any, index: number) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6 text-xs">#{pool.rank}</span>
              <div>
                <span className="font-medium">{pool.symbol}</span>
                <div className="text-xs text-muted-foreground">{pool.project} • {pool.chain}</div>
              </div>
            </div>
            <div className="text-right">
              <APYIndicator value={pool.apy} />
              <div className="text-xs text-muted-foreground">
                TVL: ${formatNumber(pool.tvlUsd)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Error Result
const ErrorResult = ({ error }: { error: string }) => (
  <div className="flex items-center gap-2 text-red-500">
    <AlertCircle className="h-4 w-4" />
    <span>{error}</span>
  </div>
);

// Generic Result (fallback)
const GenericResult = ({ data }: { data: any }) => {
  const summary = data.success !== undefined ? (
    <div className="text-sm">
      <span className={data.success ? "text-green-500" : "text-red-500"}>
        {data.success ? "✓ Success" : "✗ Failed"}
      </span>
      {data.error && <span className="text-red-500 ml-2">{data.error}</span>}
    </div>
  ) : null;
  
  return (
    <div className="space-y-2">
      {summary}
      <div className="text-xs text-muted-foreground">
        Yield data received. Check AI response for details.
      </div>
    </div>
  );
};

export function YieldResult({ result, toolType }: YieldResultProps) {
  if (!result) return null;
  
  // Handle error
  if (result.error || result.success === false) {
    return (
      <div className="p-4">
        <ErrorResult error={result.error || "Operation failed"} />
      </div>
    );
  }
  
  // Route to specific component based on tool type
  switch (toolType) {
    case "tool-getYieldPools":
      return (
        <div className="p-4">
          <YieldPoolsResult data={result} />
        </div>
      );
    
    case "tool-getTopYieldsByChain":
      return (
        <div className="p-4">
          <TopYieldsByChainResult data={result} />
        </div>
      );
    
    case "tool-getYieldStats":
      return (
        <div className="p-4">
          <YieldStatsResult data={result} />
        </div>
      );
    
    case "tool-searchPoolsByToken":
      return (
        <div className="p-4">
          <TokenSearchResult data={result} />
        </div>
      );
    
    case "tool-getStablecoinYields":
      return (
        <div className="p-4">
          <StablecoinYieldsResult data={result} />
        </div>
      );
    
    default:
      return (
        <div className="p-4">
          <GenericResult data={result} />
        </div>
      );
  }
}