/**
 * Research Tools - Cryptocurrency research and market analysis
 * 
 * These tools help users research, analyze, and understand cryptocurrencies
 * and the broader crypto market using CoinGecko and DeFiLlama APIs.
 * Agent: research_agent
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// API endpoints
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const DEFILLAMA_API_BASE = "https://api.llama.fi";
const CRYPTOCOMPARE_API_BASE = "https://min-api.cryptocompare.com/data";

/**
 * Register Research tools with the MCP server
 * @param server The McpServer instance
 */
export function registerResearchTools(server: McpServer) {
  
  // research_get_crypto_price
  server.registerTool(
    "research_get_crypto_price",
    {
      description: "Get current price and market data for a cryptocurrency. Use this when users ask about crypto prices, market cap, or price changes.",
      inputSchema: {
        coinId: z.string().describe("CoinGecko coin ID (e.g., 'bitcoin', 'ethereum', 'solana'). Use lowercase."),
      },
    },
    async ({ coinId }) => {
      try {
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 800));

        const response = await fetch(
          `${COINGECKO_API_BASE}/coins/${coinId.toLowerCase()}?localization=false&tickers=false&community_data=false&developer_data=false`,
          { headers: { Accept: "application/json" } }
        );

        if (!response.ok) {
          if (response.status === 429) {
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again in a minute." }) }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Coin not found: ${coinId}. Try using the full name like 'bitcoin' or 'ethereum'.` }) }],
            isError: true,
          };
        }

        const data = await response.json();
        const md = data.market_data;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              coin: {
                id: data.id,
                symbol: data.symbol?.toUpperCase(),
                name: data.name,
                currentPrice: md?.current_price?.usd,
                marketCap: md?.market_cap?.usd,
                marketCapRank: data.market_cap_rank,
                priceChange24h: md?.price_change_percentage_24h,
                priceChange7d: md?.price_change_percentage_7d,
                priceChange30d: md?.price_change_percentage_30d,
                totalVolume24h: md?.total_volume?.usd,
                circulatingSupply: md?.circulating_supply,
                totalSupply: md?.total_supply,
                maxSupply: md?.max_supply,
                ath: md?.ath?.usd,
                athChangePercentage: md?.ath_change_percentage?.usd,
                atl: md?.atl?.usd,
                high24h: md?.high_24h?.usd,
                low24h: md?.low_24h?.usd,
              }
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

  // research_get_top_coins
  server.registerTool(
    "research_get_top_coins",
    {
      description: "Get top cryptocurrencies ranked by market cap. Use this when users ask about top coins, biggest cryptos, or market leaders.",
      inputSchema: {
        limit: z.number().min(1).max(50).default(10).describe("Number of coins to return (1-50, default 10)"),
      },
    },
    async ({ limit }) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const response = await fetch(
          `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${Math.min(limit, 50)}&page=1&sparkline=false&price_change_percentage=24h,7d`,
          { headers: { Accept: "application/json" } }
        );

        if (!response.ok) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to fetch top coins" }) }],
            isError: true,
          };
        }

        const data = await response.json();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              topCoins: data.map((coin: any) => ({
                rank: coin.market_cap_rank,
                id: coin.id,
                symbol: coin.symbol?.toUpperCase(),
                name: coin.name,
                currentPrice: coin.current_price,
                marketCap: coin.market_cap,
                priceChange24h: coin.price_change_percentage_24h,
                priceChange7d: coin.price_change_percentage_7d_in_currency,
                totalVolume: coin.total_volume,
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

  // research_get_trending_coins
  server.registerTool(
    "research_get_trending_coins",
    {
      description: "Get the top trending cryptocurrencies on CoinGecko. Use this when users ask about trending coins, hot coins, or what's popular.",
      inputSchema: {},
    },
    async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const response = await fetch(`${COINGECKO_API_BASE}/search/trending`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to fetch trending coins" }) }],
            isError: true,
          };
        }

        const data = await response.json();
        const coins = data.coins || [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              trendingCoins: coins.slice(0, 10).map((item: any) => ({
                id: item.item?.id,
                name: item.item?.name,
                symbol: item.item?.symbol?.toUpperCase(),
                marketCapRank: item.item?.market_cap_rank,
                score: item.item?.score,
                priceBtc: item.item?.price_btc,
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

  // research_search_coins
  server.registerTool(
    "research_search_coins",
    {
      description: "Search for cryptocurrencies by name or symbol. Use this when users want to find a specific coin.",
      inputSchema: {
        query: z.string().describe("Search query (coin name or symbol)"),
      },
    },
    async ({ query }) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const response = await fetch(
          `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`,
          { headers: { Accept: "application/json" } }
        );

        if (!response.ok) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: "Search failed" }) }],
            isError: true,
          };
        }

        const data = await response.json();
        const coins = (data.coins || []).slice(0, 10);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              results: coins.map((coin: any) => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol?.toUpperCase(),
                marketCapRank: coin.market_cap_rank,
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

  // research_get_global_market_data
  server.registerTool(
    "research_get_global_market_data",
    {
      description: "Get global cryptocurrency market statistics. Use this when users ask about overall market conditions.",
      inputSchema: {},
    },
    async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const response = await fetch(`${COINGECKO_API_BASE}/global`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to fetch global data" }) }],
            isError: true,
          };
        }

        const data = (await response.json()).data || {};

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              globalMarket: {
                totalMarketCap: data.total_market_cap?.usd,
                totalVolume24h: data.total_volume?.usd,
                btcDominance: data.market_cap_percentage?.btc,
                ethDominance: data.market_cap_percentage?.eth,
                activeCryptocurrencies: data.active_cryptocurrencies,
                markets: data.markets,
                marketCapChange24h: data.market_cap_change_percentage_24h_usd,
              }
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

  // research_get_defi_tvl
  server.registerTool(
    "research_get_defi_tvl",
    {
      description: "Get Total Value Locked (TVL) data for DeFi protocols. Use this when users ask about DeFi TVL.",
      inputSchema: {
        protocol: z.string().optional().describe("Protocol name (e.g., 'aave', 'uniswap'). Leave empty for top protocols."),
      },
    },
    async ({ protocol }) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (protocol) {
          const response = await fetch(
            `${DEFILLAMA_API_BASE}/protocol/${protocol.toLowerCase()}`,
            { headers: { Accept: "application/json" } }
          );

          if (!response.ok) {
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: `Protocol not found: ${protocol}` }) }],
              isError: true,
            };
          }

          const data = await response.json();

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                protocol: {
                  name: data.name,
                  symbol: data.symbol,
                  tvl: data.tvl,
                  change1d: data.change_1d,
                  change7d: data.change_7d,
                  category: data.category,
                  chains: (data.chains || []).slice(0, 5),
                  url: data.url,
                }
              }, null, 2)
            }],
          };
        } else {
          const response = await fetch(`${DEFILLAMA_API_BASE}/protocols`, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to fetch DeFi data" }) }],
              isError: true,
            };
          }

          const data = (await response.json()).slice(0, 20);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                topProtocols: data.map((p: any) => ({
                  name: p.name,
                  symbol: p.symbol,
                  tvl: p.tvl,
                  change1d: p.change_1d,
                  change7d: p.change_7d,
                  category: p.category,
                  chains: (p.chains || []).slice(0, 5),
                }))
              }, null, 2)
            }],
          };
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }],
          isError: true,
        };
      }
    }
  );

  // research_get_crypto_news
  server.registerTool(
    "research_get_crypto_news",
    {
      description: "Get latest cryptocurrency news. Use this when users ask about crypto news.",
      inputSchema: {
        categories: z.string().optional().describe("News categories (e.g., 'BTC', 'ETH', 'Trading')"),
      },
    },
    async ({ categories }) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        let url = `${CRYPTOCOMPARE_API_BASE}/v2/news/?lang=EN`;
        if (categories) {
          url += `&categories=${encodeURIComponent(categories)}`;
        }

        const response = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to fetch news" }) }],
            isError: true,
          };
        }

        const data = ((await response.json()).Data || []).slice(0, 10);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              news: data.map((article: any) => ({
                title: article.title,
                source: article.source,
                url: article.url,
                body: (article.body || "").slice(0, 300) + "...",
                categories: article.categories,
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
