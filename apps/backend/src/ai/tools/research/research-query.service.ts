import { Injectable } from "@nestjs/common";
import { tool } from "ai";
import { z } from "zod";

// CoinGecko API (free tier)
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

// DeFiLlama API (free)
const DEFILLAMA_API_BASE = "https://api.llama.fi";

// CryptoCompare API
const CRYPTOCOMPARE_API_BASE = "https://min-api.cryptocompare.com/data";

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  score: number;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  body: string;
  published_on: number;
  categories: string;
}

@Injectable()
export class ResearchQueryService {
  /**
   * Tool 1: Get cryptocurrency price and market data
   */
  getCryptoPriceTool() {
    return tool({
      description:
        "Get current price and market data for a cryptocurrency. Use this when users ask about crypto prices, market cap, or price changes.",
      inputSchema: z.object({
        coinId: z
          .string()
          .describe(
            "CoinGecko coin ID (e.g., 'bitcoin', 'ethereum', 'solana'). Use lowercase."
          ),
      }),
      execute: async ({ coinId }) => {
        try {
          console.log("🔍 getCryptoPrice tool called:", { coinId });

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 800));

          const response = await fetch(
            `${COINGECKO_API_BASE}/coins/${coinId.toLowerCase()}?localization=false&tickers=false&community_data=false&developer_data=false`,
            {
              headers: { Accept: "application/json" },
            }
          );

          if (!response.ok) {
            if (response.status === 429) {
              return {
                success: false,
                error: "Rate limit exceeded. Please try again in a minute.",
              };
            }
            return {
              success: false,
              error: `Coin not found: ${coinId}. Try using the full name like 'bitcoin' or 'ethereum'.`,
            };
          }

          const data = await response.json();
          const marketData = data.market_data;

          return {
            success: true,
            coin: {
              id: data.id,
              symbol: data.symbol.toUpperCase(),
              name: data.name,
              currentPrice: marketData.current_price.usd,
              marketCap: marketData.market_cap.usd,
              marketCapRank: data.market_cap_rank,
              priceChange24h: marketData.price_change_percentage_24h,
              priceChange7d: marketData.price_change_percentage_7d,
              priceChange30d: marketData.price_change_percentage_30d,
              totalVolume24h: marketData.total_volume.usd,
              circulatingSupply: marketData.circulating_supply,
              totalSupply: marketData.total_supply,
              maxSupply: marketData.max_supply,
              ath: marketData.ath.usd,
              athChangePercentage: marketData.ath_change_percentage.usd,
              athDate: marketData.ath_date.usd,
              atl: marketData.atl.usd,
              atlChangePercentage: marketData.atl_change_percentage.usd,
              atlDate: marketData.atl_date.usd,
              high24h: marketData.high_24h.usd,
              low24h: marketData.low_24h.usd,
            },
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
   * Tool 2: Get multiple crypto prices (optimized)
   */
  getMultiplePricesTool() {
    return tool({
      description:
        "Get prices for multiple cryptocurrencies at once. Use this when users want to compare prices or get a market overview.",
      inputSchema: z.object({
        coinIds: z
          .array(z.string())
          .max(10) // Limit to 10 coins to prevent rate limits
          .describe(
            "Array of CoinGecko coin IDs (e.g., ['bitcoin', 'ethereum', 'solana']). Max 10 coins."
          ),
      }),
      execute: async ({ coinIds }) => {
        try {
          console.log("🔍 getMultiplePrices tool called:", { coinIds });

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

          const ids = coinIds.slice(0, 10).map((id) => id.toLowerCase()).join(",");
          const response = await fetch(
            `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d,30d`,
            {
              headers: { Accept: "application/json" },
            }
          );

          if (!response.ok) {
            if (response.status === 429) {
              return {
                success: false,
                error: "Rate limit exceeded. Please try again in a minute.",
              };
            }
            return { success: false, error: "Failed to fetch prices" };
          }

          const data = await response.json();

          return {
            success: true,
            coins: data.map((coin: any) => ({
              id: coin.id,
              symbol: coin.symbol.toUpperCase(),
              name: coin.name,
              currentPrice: coin.current_price,
              marketCap: coin.market_cap,
              marketCapRank: coin.market_cap_rank,
              priceChange24h: coin.price_change_percentage_24h,
              priceChange7d: coin.price_change_percentage_7d_in_currency,
              priceChange30d: coin.price_change_percentage_30d_in_currency,
              totalVolume: coin.total_volume,
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
   * Tool 3: Get trending cryptocurrencies
   */
  getTrendingCoinsTool() {
    return tool({
      description:
        "Get the top trending cryptocurrencies on CoinGecko. Use this when users ask about trending coins, hot coins, or what's popular.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getTrendingCoins tool called");

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 600));

          const response = await fetch(`${COINGECKO_API_BASE}/search/trending`, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            return { success: false, error: "Failed to fetch trending coins" };
          }

          const data = await response.json();

          return {
            success: true,
            trendingCoins: data.coins.map((item: any) => ({
              id: item.item.id,
              name: item.item.name,
              symbol: item.item.symbol.toUpperCase(),
              marketCapRank: item.item.market_cap_rank,
              score: item.item.score,
              priceBtc: item.item.price_btc,
              thumb: item.item.thumb,
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
   * Tool 4: Get top cryptocurrencies by market cap (optimized)
   */
  getTopCoinsTool() {
    return tool({
      description:
        "Get top cryptocurrencies ranked by market cap. Use this when users ask about top coins, biggest cryptos, or market leaders.",
      inputSchema: z.object({
        limit: z
          .number()
          .min(1)
          .max(50) // Reduced from 100 to 50
          .default(10) // Reduced from 20 to 10
          .describe("Number of coins to return (1-50, default 10)"),
      }),
      execute: async ({ limit }) => {
        try {
          console.log("🔍 getTopCoins tool called:", { limit });

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));

          const response = await fetch(
            `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${Math.min(limit, 50)}&page=1&sparkline=false&price_change_percentage=24h,7d`,
            {
              headers: { Accept: "application/json" },
            }
          );

          if (!response.ok) {
            return { success: false, error: "Failed to fetch top coins" };
          }

          const data = await response.json();

          return {
            success: true,
            topCoins: data.map((coin: any) => ({
              rank: coin.market_cap_rank,
              id: coin.id,
              symbol: coin.symbol.toUpperCase(),
              name: coin.name,
              currentPrice: coin.current_price,
              marketCap: coin.market_cap,
              priceChange24h: coin.price_change_percentage_24h,
              priceChange7d: coin.price_change_percentage_7d_in_currency,
              totalVolume: coin.total_volume,
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
   * Tool 5: Search for cryptocurrencies
   */
  searchCoinsTool() {
    return tool({
      description:
        "Search for cryptocurrencies by name or symbol. Use this when users want to find a specific coin or don't know the exact ID.",
      inputSchema: z.object({
        query: z.string().describe("Search query (coin name or symbol)"),
      }),
      execute: async ({ query }) => {
        try {
          console.log("🔍 searchCoins tool called:", { query });

          const response = await fetch(
            `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`,
            {
              headers: { Accept: "application/json" },
            }
          );

          if (!response.ok) {
            return { success: false, error: "Search failed" };
          }

          const data = await response.json();

          return {
            success: true,
            results: data.coins.slice(0, 10).map((coin: any) => ({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              marketCapRank: coin.market_cap_rank,
              thumb: coin.thumb,
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
   * Tool 6: Get crypto news
   */
  getCryptoNewsTool() {
    return tool({
      description:
        "Get latest cryptocurrency news and articles. Use this when users ask about crypto news, market updates, or recent developments.",
      inputSchema: z.object({
        categories: z
          .string()
          .optional()
          .describe(
            "News categories (e.g., 'BTC', 'ETH', 'Trading', 'Regulation'). Leave empty for general news."
          ),
      }),
      execute: async ({ categories }) => {
        try {
          console.log("🔍 getCryptoNews tool called:", { categories });

          let url = `${CRYPTOCOMPARE_API_BASE}/v2/news/?lang=EN`;
          if (categories) {
            url += `&categories=${encodeURIComponent(categories)}`;
          }

          const response = await fetch(url, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            return { success: false, error: "Failed to fetch news" };
          }

          const data = await response.json();

          return {
            success: true,
            news: data.Data.slice(0, 10).map((article: any) => ({
              title: article.title,
              source: article.source,
              url: article.url,
              body: article.body.substring(0, 300) + "...",
              publishedAt: new Date(article.published_on * 1000).toISOString(),
              categories: article.categories,
              tags: article.tags,
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
   * Tool 7: Get DeFi TVL data
   */
  getDefiTVLTool() {
    return tool({
      description:
        "Get Total Value Locked (TVL) data for DeFi protocols. Use this when users ask about DeFi TVL, protocol rankings, or DeFi market size.",
      inputSchema: z.object({
        protocol: z
          .string()
          .optional()
          .describe(
            "Protocol name (e.g., 'aave', 'uniswap', 'lido'). Leave empty for top protocols."
          ),
      }),
      execute: async ({ protocol }) => {
        try {
          console.log("🔍 getDefiTVL tool called:", { protocol });

          if (protocol) {
            // Get specific protocol
            const response = await fetch(
              `${DEFILLAMA_API_BASE}/protocol/${protocol.toLowerCase()}`,
              {
                headers: { Accept: "application/json" },
              }
            );

            if (!response.ok) {
              return {
                success: false,
                error: `Protocol not found: ${protocol}`,
              };
            }

            const data = await response.json();

            return {
              success: true,
              protocol: {
                name: data.name,
                symbol: data.symbol,
                tvl: data.tvl,
                chainTvls: data.chainTvls,
                change1h: data.change_1h,
                change1d: data.change_1d,
                change7d: data.change_7d,
                category: data.category,
                chains: data.chains,
                url: data.url,
                description: data.description,
              },
            };
          } else {
            // Get top protocols
            const response = await fetch(`${DEFILLAMA_API_BASE}/protocols`, {
              headers: { Accept: "application/json" },
            });

            if (!response.ok) {
              return { success: false, error: "Failed to fetch DeFi data" };
            }

            const data = await response.json();

            return {
              success: true,
              topProtocols: data.slice(0, 20).map((p: any) => ({
                name: p.name,
                symbol: p.symbol,
                tvl: p.tvl,
                change1d: p.change_1d,
                change7d: p.change_7d,
                category: p.category,
                chains: p.chains?.slice(0, 5),
              })),
            };
          }
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
   * Tool 8: Get global crypto market data
   */
  getGlobalMarketDataTool() {
    return tool({
      description:
        "Get global cryptocurrency market statistics including total market cap, volume, and BTC dominance. Use this for market overview.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getGlobalMarketData tool called");

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 600));

          const response = await fetch(`${COINGECKO_API_BASE}/global`, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            return { success: false, error: "Failed to fetch global data" };
          }

          const data = await response.json();
          const globalData = data.data;

          return {
            success: true,
            globalMarket: {
              totalMarketCap: globalData.total_market_cap.usd,
              totalVolume24h: globalData.total_volume.usd,
              btcDominance: globalData.market_cap_percentage.btc,
              ethDominance: globalData.market_cap_percentage.eth,
              activeCryptocurrencies: globalData.active_cryptocurrencies,
              markets: globalData.markets,
              marketCapChange24h: globalData.market_cap_change_percentage_24h_usd,
              updatedAt: new Date(globalData.updated_at * 1000).toISOString(),
            },
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
      getCryptoPrice: this.getCryptoPriceTool(),
      getMultiplePrices: this.getMultiplePricesTool(),
      getTrendingCoins: this.getTrendingCoinsTool(),
      getTopCoins: this.getTopCoinsTool(),
      searchCoins: this.searchCoinsTool(),
      getCryptoNews: this.getCryptoNewsTool(),
      getDefiTVL: this.getDefiTVLTool(),
      getGlobalMarketData: this.getGlobalMarketDataTool(),
    };
  }
}
