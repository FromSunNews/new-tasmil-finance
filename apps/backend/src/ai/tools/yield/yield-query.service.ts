import { Injectable } from "@nestjs/common";
import { tool } from "ai";
import { z } from "zod";

// DeFiLlama Yields API
const DEFILLAMA_YIELDS_API = "https://yields.llama.fi";

// Cache for pools data (refresh every 5 minutes)
let poolsCache: { data: YieldPool[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  rewardTokens: string[];
  pool: string;
  apyPct1D: number;
  apyPct7D: number;
  apyPct30D: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta: string;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
  underlyingTokens: string[];
  il7d: number;
  apyBase7d: number;
  apyMean30d: number;
  volumeUsd1d: number;
  volumeUsd7d: number;
}

@Injectable()
export class YieldQueryService {
  /**
   * Fetch pools with caching to reduce API calls
   */
  private async fetchPoolsWithCache(): Promise<YieldPool[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (poolsCache && (now - poolsCache.timestamp) < CACHE_TTL) {
      console.log("📦 Using cached pools data");
      return poolsCache.data;
    }

    console.log("🔄 Fetching fresh pools data from DeFiLlama");
    
    // Add delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));

    const response = await fetch(`${DEFILLAMA_YIELDS_API}/pools`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch yield pools");
    }

    const data = await response.json();
    
    // Update cache
    poolsCache = {
      data: data.data,
      timestamp: now,
    };

    return data.data;
  }

  /**
   * Tool 1: Get all yield pools with filtering
   */
  getYieldPoolsTool() {
    return tool({
      description:
        "Get yield farming pools from DeFiLlama. Use this when users ask about yield opportunities, APY rates, or farming pools. Can filter by chain, project, or minimum TVL.",
      inputSchema: z.object({
        chain: z
          .string()
          .optional()
          .describe("Filter by blockchain (e.g., 'Ethereum', 'Arbitrum', 'BSC', 'Polygon', 'Solana')"),
        project: z
          .string()
          .optional()
          .describe("Filter by project/protocol (e.g., 'aave-v3', 'uniswap-v3', 'curve-dex')"),
        minTvl: z
          .number()
          .optional()
          .default(100000)
          .describe("Minimum TVL in USD (default: 100000)"),
        minApy: z
          .number()
          .optional()
          .describe("Minimum APY percentage"),
        stablecoinOnly: z
          .boolean()
          .optional()
          .describe("Only show stablecoin pools"),
        limit: z
          .number()
          .min(1)
          .max(30)
          .default(15)
          .describe("Number of pools to return (1-30, default 15)"),
      }),
      execute: async ({ chain, project, minTvl, minApy, stablecoinOnly, limit }) => {
        try {
          console.log("🔍 getYieldPools tool called:", { chain, project, minTvl, minApy, stablecoinOnly, limit });

          let pools = await this.fetchPoolsWithCache();

          // Apply filters
          if (chain) {
            pools = pools.filter((p) => 
              p.chain.toLowerCase() === chain.toLowerCase()
            );
          }

          if (project) {
            pools = pools.filter((p) => 
              p.project.toLowerCase().includes(project.toLowerCase())
            );
          }

          if (minTvl) {
            pools = pools.filter((p) => p.tvlUsd >= minTvl);
          }

          if (minApy !== undefined) {
            pools = pools.filter((p) => p.apy >= minApy);
          }

          if (stablecoinOnly) {
            pools = pools.filter((p) => p.stablecoin === true);
          }

          // Sort by APY descending
          pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));

          // Limit results
          pools = pools.slice(0, limit);

          return {
            success: true,
            totalPools: pools.length,
            pools: pools.map((p) => ({
              chain: p.chain,
              project: p.project,
              symbol: p.symbol,
              tvlUsd: p.tvlUsd,
              apy: p.apy,
              apyBase: p.apyBase,
              apyReward: p.apyReward,
              apyChange1D: p.apyPct1D,
              apyChange7D: p.apyPct7D,
              apyChange30D: p.apyPct30D,
              stablecoin: p.stablecoin,
              ilRisk: p.ilRisk,
              rewardTokens: p.rewardTokens,
              poolMeta: p.poolMeta,
            })),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 2: Get top yields by chain
   */
  getTopYieldsByChainTool() {
    return tool({
      description:
        "Get top yield opportunities for a specific blockchain. Use this when users ask about best yields on Ethereum, Arbitrum, BSC, etc.",
      inputSchema: z.object({
        chain: z
          .string()
          .describe("Blockchain name (e.g., 'Ethereum', 'Arbitrum', 'BSC', 'Polygon', 'Solana', 'Avalanche')"),
        limit: z
          .number()
          .min(1)
          .max(15)
          .default(10)
          .describe("Number of top pools to return (1-15, default 10)"),
        minTvl: z
          .number()
          .optional()
          .default(50000)
          .describe("Minimum TVL in USD (default: 50000)"),
      }),
      execute: async ({ chain, limit, minTvl }) => {
        try {
          console.log("🔍 getTopYieldsByChain tool called:", { chain, limit, minTvl });

          let pools = await this.fetchPoolsWithCache();

          // Filter by chain
          pools = pools.filter((p) => 
            p.chain.toLowerCase() === chain.toLowerCase()
          );

          // Filter by minimum TVL
          if (minTvl) {
            pools = pools.filter((p) => p.tvlUsd >= minTvl);
          }

          // Sort by APY descending
          pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));

          // Limit results
          pools = pools.slice(0, limit);

          return {
            success: true,
            chain,
            totalPools: pools.length,
            pools: pools.map((p, index) => ({
              rank: index + 1,
              project: p.project,
              symbol: p.symbol,
              tvlUsd: p.tvlUsd,
              apy: p.apy,
              apyBase: p.apyBase,
              apyReward: p.apyReward,
              stablecoin: p.stablecoin,
              ilRisk: p.ilRisk,
              rewardTokens: p.rewardTokens,
            })),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 3: Get yield pool history
   */
  getYieldHistoryTool() {
    return tool({
      description:
        "Get historical APY data for a specific yield pool. Use this when users want to see how APY has changed over time.",
      inputSchema: z.object({
        poolId: z
          .string()
          .describe("The pool ID from DeFiLlama (e.g., '747c1d2a-c668-4682-b9f9-296708a3dd90')"),
      }),
      execute: async ({ poolId }) => {
        try {
          console.log("🔍 getYieldHistory tool called:", { poolId });

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

          const response = await fetch(`${DEFILLAMA_YIELDS_API}/chart/${poolId}`, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            return { success: false, error: "Failed to fetch yield history. Pool ID may be invalid." };
          }

          const data = await response.json();
          
          // Get last 30 data points
          const history = data.data?.slice(-30) || [];

          return {
            success: true,
            poolId,
            dataPoints: history.length,
            history: history.map((h: any) => ({
              timestamp: h.timestamp,
              tvlUsd: h.tvlUsd,
              apy: h.apy,
              apyBase: h.apyBase,
              apyReward: h.apyReward,
            })),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 4: Get yield statistics/summary
   */
  getYieldStatsTool() {
    return tool({
      description:
        "Get overall yield statistics and summary across all chains. Use this when users ask about general yield market overview.",
      inputSchema: z.object({
        topN: z
          .number()
          .min(5)
          .max(15)
          .default(10)
          .describe("Number of top chains to include in stats (default 10)"),
      }),
      execute: async ({ topN }) => {
        try {
          console.log("🔍 getYieldStats tool called:", { topN });

          const pools = await this.fetchPoolsWithCache();

          // Calculate stats by chain
          const chainStats: Record<string, { totalTvl: number; poolCount: number; avgApy: number; maxApy: number }> = {};
          
          pools.forEach((p) => {
            if (!chainStats[p.chain]) {
              chainStats[p.chain] = { totalTvl: 0, poolCount: 0, avgApy: 0, maxApy: 0 };
            }
            chainStats[p.chain].totalTvl += p.tvlUsd || 0;
            chainStats[p.chain].poolCount += 1;
            chainStats[p.chain].avgApy += p.apy || 0;
            chainStats[p.chain].maxApy = Math.max(chainStats[p.chain].maxApy, p.apy || 0);
          });

          // Calculate averages and sort by TVL
          const chainSummary = Object.entries(chainStats)
            .map(([chain, stats]) => ({
              chain,
              totalTvl: stats.totalTvl,
              poolCount: stats.poolCount,
              avgApy: stats.avgApy / stats.poolCount,
              maxApy: stats.maxApy,
            }))
            .sort((a, b) => b.totalTvl - a.totalTvl)
            .slice(0, topN);

          // Overall stats
          const totalTvl = pools.reduce((sum, p) => sum + (p.tvlUsd || 0), 0);
          const totalPools = pools.length;
          const avgApy = pools.reduce((sum, p) => sum + (p.apy || 0), 0) / totalPools;

          return {
            success: true,
            overview: {
              totalTvl,
              totalPools,
              avgApy,
              chainsCount: Object.keys(chainStats).length,
            },
            topChains: chainSummary,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 5: Search pools by token symbol
   */
  searchPoolsByTokenTool() {
    return tool({
      description:
        "Search yield pools by token symbol. Use this when users ask about yields for specific tokens like ETH, USDC, WBTC, etc.",
      inputSchema: z.object({
        token: z
          .string()
          .describe("Token symbol to search for (e.g., 'ETH', 'USDC', 'WBTC', 'DAI')"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe("Number of pools to return (1-20, default 10)"),
        minTvl: z
          .number()
          .optional()
          .default(50000)
          .describe("Minimum TVL in USD (default: 50000)"),
      }),
      execute: async ({ token, limit, minTvl }) => {
        try {
          console.log("🔍 searchPoolsByToken tool called:", { token, limit, minTvl });

          let pools = await this.fetchPoolsWithCache();

          // Filter by token symbol
          pools = pools.filter((p) => 
            p.symbol.toUpperCase().includes(token.toUpperCase())
          );

          // Filter by minimum TVL
          if (minTvl) {
            pools = pools.filter((p) => p.tvlUsd >= minTvl);
          }

          // Sort by APY descending
          pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));

          // Limit results
          pools = pools.slice(0, limit);

          return {
            success: true,
            token,
            totalPools: pools.length,
            pools: pools.map((p) => ({
              chain: p.chain,
              project: p.project,
              symbol: p.symbol,
              tvlUsd: p.tvlUsd,
              apy: p.apy,
              apyBase: p.apyBase,
              apyReward: p.apyReward,
              stablecoin: p.stablecoin,
              ilRisk: p.ilRisk,
              poolId: p.pool,
            })),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 6: Get stablecoin yields
   */
  getStablecoinYieldsTool() {
    return tool({
      description:
        "Get best stablecoin yield opportunities. Use this when users ask about safe yields, stablecoin farming, or low-risk yield options.",
      inputSchema: z.object({
        chain: z
          .string()
          .optional()
          .describe("Filter by blockchain (optional)"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe("Number of pools to return (1-20, default 10)"),
        minTvl: z
          .number()
          .optional()
          .default(100000)
          .describe("Minimum TVL in USD (default: 100000)"),
      }),
      execute: async ({ chain, limit, minTvl }) => {
        try {
          console.log("🔍 getStablecoinYields tool called:", { chain, limit, minTvl });

          let pools = await this.fetchPoolsWithCache();

          // Filter stablecoins only
          pools = pools.filter((p) => p.stablecoin === true);

          // Filter by chain if specified
          if (chain) {
            pools = pools.filter((p) => 
              p.chain.toLowerCase() === chain.toLowerCase()
            );
          }

          // Filter by minimum TVL
          if (minTvl) {
            pools = pools.filter((p) => p.tvlUsd >= minTvl);
          }

          // Sort by APY descending
          pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));

          // Limit results
          pools = pools.slice(0, limit);

          return {
            success: true,
            totalPools: pools.length,
            pools: pools.map((p, index) => ({
              rank: index + 1,
              chain: p.chain,
              project: p.project,
              symbol: p.symbol,
              tvlUsd: p.tvlUsd,
              apy: p.apy,
              apyBase: p.apyBase,
              apyReward: p.apyReward,
              ilRisk: p.ilRisk,
              poolId: p.pool,
            })),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Get all tools
   */
  getAllTools() {
    return {
      getYieldPools: this.getYieldPoolsTool(),
      getTopYieldsByChain: this.getTopYieldsByChainTool(),
      getYieldHistory: this.getYieldHistoryTool(),
      getYieldStats: this.getYieldStatsTool(),
      searchPoolsByToken: this.searchPoolsByTokenTool(),
      getStablecoinYields: this.getStablecoinYieldsTool(),
    };
  }
}
