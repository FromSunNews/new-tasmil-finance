/**
 * Yield Tools - DeFi yield farming opportunities using DeFiLlama
 * 
 * These tools help users discover and analyze yield farming opportunities
 * across multiple chains and protocols.
 * Agent: yield_agent
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// DeFiLlama Yields API
const DEFILLAMA_YIELDS_API = "https://yields.llama.fi";

// Cache for pools data
let poolsCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

async function fetchPoolsWithCache(): Promise<any[]> {
  const now = Date.now();
  
  if (poolsCache.data && (now - poolsCache.timestamp) < CACHE_TTL) {
    return poolsCache.data;
  }
  
  await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit
  
  const response = await fetch(`${DEFILLAMA_YIELDS_API}/pools`, {
    headers: { Accept: "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch yield pools");
  }
  
  const data = await response.json();
  poolsCache.data = data.data || [];
  poolsCache.timestamp = now;
  
  return poolsCache.data || [];
}

/**
 * Register Yield tools with the MCP server
 * @param server The McpServer instance
 */
export function registerYieldTools(server: McpServer) {

  // yield_get_yield_pools
  server.registerTool(
    "yield_get_yield_pools",
    {
      description: "Get yield farming pools with filtering. Use for general yield searches.",
      inputSchema: {
        chain: z.string().optional().describe("Filter by blockchain (e.g., 'Ethereum', 'Arbitrum', 'BSC')"),
        project: z.string().optional().describe("Filter by protocol (e.g., 'aave-v3', 'uniswap-v3')"),
        minTvl: z.number().default(100000).describe("Minimum TVL in USD"),
        minApy: z.number().optional().describe("Minimum APY percentage"),
        stablecoinOnly: z.boolean().default(false).describe("Only show stablecoin pools"),
        limit: z.number().min(1).max(30).default(15).describe("Number of pools to return (1-30)"),
      },
    },
    async ({ chain, project, minTvl, minApy, stablecoinOnly, limit }) => {
      try {
        let pools = await fetchPoolsWithCache();
        
        // Apply filters
        if (chain) {
          pools = pools.filter(p => p.chain?.toLowerCase() === chain.toLowerCase());
        }
        if (project) {
          pools = pools.filter(p => p.project?.toLowerCase().includes(project.toLowerCase()));
        }
        if (minTvl) {
          pools = pools.filter(p => (p.tvlUsd || 0) >= minTvl);
        }
        if (minApy !== undefined) {
          pools = pools.filter(p => (p.apy || 0) >= minApy);
        }
        if (stablecoinOnly) {
          pools = pools.filter(p => p.stablecoin === true);
        }
        
        // Sort by APY descending
        pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));
        pools = pools.slice(0, Math.min(limit, 30));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              totalPools: pools.length,
              pools: pools.map(p => ({
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
              }))
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );

  // yield_get_top_yields_by_chain
  server.registerTool(
    "yield_get_top_yields_by_chain",
    {
      description: "Get top yield opportunities for a specific blockchain.",
      inputSchema: {
        chain: z.string().describe("Blockchain name (e.g., 'Ethereum', 'Arbitrum', 'BSC')"),
        limit: z.number().min(1).max(15).default(10).describe("Number of top pools to return"),
        minTvl: z.number().default(50000).describe("Minimum TVL in USD"),
      },
    },
    async ({ chain, limit, minTvl }) => {
      try {
        let pools = await fetchPoolsWithCache();
        
        // Filter by chain
        pools = pools.filter(p => p.chain?.toLowerCase() === chain.toLowerCase());
        
        if (minTvl) {
          pools = pools.filter(p => (p.tvlUsd || 0) >= minTvl);
        }
        
        // Sort by APY descending
        pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));
        pools = pools.slice(0, Math.min(limit, 15));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              chain,
              totalPools: pools.length,
              pools: pools.map((p, i) => ({
                rank: i + 1,
                project: p.project,
                symbol: p.symbol,
                tvlUsd: p.tvlUsd,
                apy: p.apy,
                apyBase: p.apyBase,
                apyReward: p.apyReward,
                stablecoin: p.stablecoin,
                ilRisk: p.ilRisk,
                rewardTokens: p.rewardTokens,
              }))
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );


  // yield_get_yield_history
  server.registerTool(
    "yield_get_yield_history",
    {
      description: "Get historical APY data for a specific yield pool.",
      inputSchema: {
        poolId: z.string().describe("The pool ID from DeFiLlama"),
      },
    },
    async ({ poolId }) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
        
        const response = await fetch(`${DEFILLAMA_YIELDS_API}/chart/${poolId}`, {
          headers: { Accept: "application/json" },
        });
        
        if (!response.ok) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Failed to fetch history. Pool ID may be invalid: ${poolId}` }) }],
            isError: true,
          };
        }
        
        const data = await response.json();
        const history = (data.data || []).slice(-30); // Last 30 data points
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              poolId,
              dataPoints: history.length,
              history: history.map((h: any) => ({
                timestamp: h.timestamp,
                tvlUsd: h.tvlUsd,
                apy: h.apy,
                apyBase: h.apyBase,
                apyReward: h.apyReward,
              }))
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );

  // yield_get_yield_stats
  server.registerTool(
    "yield_get_yield_stats",
    {
      description: "Get overall yield statistics and market overview.",
      inputSchema: {
        topN: z.number().min(1).max(20).default(10).describe("Number of top chains to include"),
      },
    },
    async ({ topN }) => {
      try {
        const pools = await fetchPoolsWithCache();
        
        // Calculate stats by chain
        const chainStats: Record<string, { totalTvl: number; poolCount: number; totalApy: number; maxApy: number }> = {};
        
        for (const p of pools) {
          const chain = p.chain || "Unknown";
          if (!chainStats[chain]) {
            chainStats[chain] = { totalTvl: 0, poolCount: 0, totalApy: 0, maxApy: 0 };
          }
          chainStats[chain].totalTvl += p.tvlUsd || 0;
          chainStats[chain].poolCount += 1;
          chainStats[chain].totalApy += p.apy || 0;
          chainStats[chain].maxApy = Math.max(chainStats[chain].maxApy, p.apy || 0);
        }
        
        // Sort by TVL
        const sortedChains = Object.entries(chainStats)
          .sort((a, b) => b[1].totalTvl - a[1].totalTvl)
          .slice(0, topN);
        
        // Overall stats
        const totalTvl = pools.reduce((sum, p) => sum + (p.tvlUsd || 0), 0);
        const totalPools = pools.length;
        const avgApy = totalPools > 0 ? pools.reduce((sum, p) => sum + (p.apy || 0), 0) / totalPools : 0;
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              overview: {
                totalTvl,
                totalPools,
                avgApy,
                chainsCount: Object.keys(chainStats).length,
              },
              topChains: sortedChains.map(([chain, stats]) => ({
                chain,
                totalTvl: stats.totalTvl,
                poolCount: stats.poolCount,
                avgApy: stats.poolCount > 0 ? stats.totalApy / stats.poolCount : 0,
                maxApy: stats.maxApy,
              }))
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );


  // yield_search_pools_by_token
  server.registerTool(
    "yield_search_pools_by_token",
    {
      description: "Search yield pools by token symbol (e.g., ETH, USDC).",
      inputSchema: {
        token: z.string().describe("Token symbol to search for (e.g., 'ETH', 'USDC')"),
        limit: z.number().min(1).max(20).default(10).describe("Number of pools to return"),
        minTvl: z.number().default(50000).describe("Minimum TVL in USD"),
      },
    },
    async ({ token, limit, minTvl }) => {
      try {
        let pools = await fetchPoolsWithCache();
        
        // Filter by token symbol
        pools = pools.filter(p => p.symbol?.toUpperCase().includes(token.toUpperCase()));
        
        if (minTvl) {
          pools = pools.filter(p => (p.tvlUsd || 0) >= minTvl);
        }
        
        // Sort by APY descending
        pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));
        pools = pools.slice(0, Math.min(limit, 20));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              token: token.toUpperCase(),
              totalPools: pools.length,
              pools: pools.map(p => ({
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
              }))
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );

  // yield_get_stablecoin_yields
  server.registerTool(
    "yield_get_stablecoin_yields",
    {
      description: "Get best stablecoin yield opportunities (low risk).",
      inputSchema: {
        chain: z.string().optional().describe("Filter by blockchain"),
        limit: z.number().min(1).max(20).default(10).describe("Number of pools to return"),
        minTvl: z.number().default(100000).describe("Minimum TVL in USD"),
      },
    },
    async ({ chain, limit, minTvl }) => {
      try {
        let pools = await fetchPoolsWithCache();
        
        // Filter stablecoins only
        pools = pools.filter(p => p.stablecoin === true);
        
        if (chain) {
          pools = pools.filter(p => p.chain?.toLowerCase() === chain.toLowerCase());
        }
        
        if (minTvl) {
          pools = pools.filter(p => (p.tvlUsd || 0) >= minTvl);
        }
        
        // Sort by APY descending
        pools.sort((a, b) => (b.apy || 0) - (a.apy || 0));
        pools = pools.slice(0, Math.min(limit, 20));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              totalPools: pools.length,
              pools: pools.map((p, i) => ({
                rank: i + 1,
                chain: p.chain,
                project: p.project,
                symbol: p.symbol,
                tvlUsd: p.tvlUsd,
                apy: p.apy,
                apyBase: p.apyBase,
                apyReward: p.apyReward,
                ilRisk: p.ilRisk,
                poolId: p.pool,
              }))
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );
}
