import { Injectable } from "@nestjs/common";
import { tool } from "ai";
import { z } from "zod";

// Technical Analysis Interfaces
export interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  sma200: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  volatility: number;
}

export interface InvestmentScore {
  technicalScore: number;
  momentumScore: number;
  volatilityScore: number;
  riskScore: number;
  overallScore: number;
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  reasoning: string[];
}

@Injectable()
export class ResearchAnalysisService {
  /**
   * Tool 1: Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }
    }

    if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
    const rs = avgGain / avgLoss;
    return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  /**
   * Calculate MACD
   */
  private calculateMACD(prices: number[]) {
    if (prices.length < 26) {
      return { value: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdValue = ema12 - ema26;
    const signal = macdValue * 2 / 11;
    const histogram = macdValue - signal;

    return {
      value: Math.round(macdValue * 1000000) / 1000000,
      signal: Math.round(signal * 1000000) / 1000000,
      histogram: Math.round(histogram * 1000000) / 1000000,
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    if (prices.length < period) {
      return { upper: 0, middle: 0, lower: 0 };
    }

    const recentPrices = prices.slice(-period);
    const middle = this.calculateSMA(prices, period);

    const variance =
      recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: Math.round((middle + stdDev * standardDeviation) * 100) / 100,
      middle: Math.round(middle * 100) / 100,
      lower: Math.round((middle - stdDev * standardDeviation) * 100) / 100,
    };
  }

  /**
   * Calculate Volatility
   */
  private calculateVolatility(prices: number[], period: number = 20): number {
    if (prices.length < period) return 0;

    const recentPrices = prices.slice(-period);
    const returns: number[] = [];

    for (let i = 1; i < recentPrices.length; i++) {
      const ret = (recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1];
      returns.push(ret);
    }

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;

    return Math.round(Math.sqrt(variance) * 100 * 100) / 100;
  }

  /**
   * Tool 1: Analyze crypto with technical indicators
   */
  analyzeCryptoTool() {
    return tool({
      description:
        "Perform technical analysis on a cryptocurrency using RSI, MACD, Moving Averages, and Bollinger Bands. Use this when users ask for technical analysis or trading signals.",
      inputSchema: z.object({
        coinId: z.string().describe("CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')"),
        days: z
          .number()
          .min(7)
          .max(365)
          .default(30)
          .describe("Number of days of historical data (7-365, default 30)"),
      }),
      execute: async ({ coinId, days }) => {
        try {
          console.log("🔍 analyzeCrypto tool called:", { coinId, days });

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Fetch historical price data from CoinGecko
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}/market_chart?vs_currency=usd&days=${days}`,
            { headers: { Accept: "application/json" } }
          );

          if (!response.ok) {
            return {
              success: false,
              error: `Failed to fetch data for ${coinId}`,
            };
          }

          const data = await response.json();
          const prices = data.prices.map((p: number[]) => p[1]);

          if (prices.length < 30) {
            return {
              success: false,
              error: "Not enough historical data for analysis",
            };
          }

          const currentPrice = prices[prices.length - 1];
          const rsi = this.calculateRSI(prices);
          const macd = this.calculateMACD(prices);
          const sma20 = this.calculateSMA(prices, 20);
          const sma50 = this.calculateSMA(prices, 50);
          const sma200 = prices.length >= 200 ? this.calculateSMA(prices, 200) : sma50;
          const bollingerBands = this.calculateBollingerBands(prices);
          const volatility = this.calculateVolatility(prices);

          // Generate signals
          const signals: string[] = [];

          // RSI signals
          if (rsi > 70) signals.push("RSI indicates overbought conditions (bearish)");
          else if (rsi < 30) signals.push("RSI indicates oversold conditions (bullish)");
          else signals.push("RSI is neutral");

          // MACD signals
          if (macd.histogram > 0) signals.push("MACD histogram positive (bullish momentum)");
          else signals.push("MACD histogram negative (bearish momentum)");

          // Moving average signals
          if (currentPrice > sma20 && currentPrice > sma50) {
            signals.push("Price above SMA20 and SMA50 (uptrend)");
          } else if (currentPrice < sma20 && currentPrice < sma50) {
            signals.push("Price below SMA20 and SMA50 (downtrend)");
          }

          // Bollinger Band signals
          if (currentPrice > bollingerBands.upper) {
            signals.push("Price above upper Bollinger Band (potentially overbought)");
          } else if (currentPrice < bollingerBands.lower) {
            signals.push("Price below lower Bollinger Band (potentially oversold)");
          }

          return {
            success: true,
            analysis: {
              coinId,
              currentPrice: Math.round(currentPrice * 100) / 100,
              indicators: {
                rsi,
                macd,
                sma20: Math.round(sma20 * 100) / 100,
                sma50: Math.round(sma50 * 100) / 100,
                sma200: Math.round(sma200 * 100) / 100,
                bollingerBands,
                volatility,
              },
              signals,
              priceVsSMA20: Math.round(((currentPrice - sma20) / sma20) * 100 * 100) / 100,
              priceVsSMA50: Math.round(((currentPrice - sma50) / sma50) * 100 * 100) / 100,
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
   * Tool 2: Calculate investment score
   */
  calculateInvestmentScoreTool() {
    return tool({
      description:
        "Calculate an investment score and recommendation for a cryptocurrency based on technical and fundamental factors. Use this when users ask for investment advice or buy/sell recommendations.",
      inputSchema: z.object({
        coinId: z.string().describe("CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')"),
      }),
      execute: async ({ coinId }) => {
        try {
          console.log("🔍 calculateInvestmentScore tool called:", { coinId });

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1200));

          // Fetch current data
          const [priceResponse, chartResponse] = await Promise.all([
            fetch(
              `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}?localization=false&tickers=false&community_data=false&developer_data=false`
            ),
            fetch(
              `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}/market_chart?vs_currency=usd&days=90`
            ),
          ]);

          if (!priceResponse.ok || !chartResponse.ok) {
            return { success: false, error: `Failed to fetch data for ${coinId}` };
          }

          const priceData = await priceResponse.json();
          const chartData = await chartResponse.json();
          const prices = chartData.prices.map((p: number[]) => p[1]);
          const marketData = priceData.market_data;

          // Calculate indicators
          const rsi = this.calculateRSI(prices);
          const macd = this.calculateMACD(prices);
          const sma20 = this.calculateSMA(prices, 20);
          const sma50 = this.calculateSMA(prices, 50);
          const volatility = this.calculateVolatility(prices);
          const currentPrice = prices[prices.length - 1];

          // Calculate scores
          let technicalScore = 50;
          let momentumScore = 50;
          let volatilityScore = 50;
          let riskScore = 50;

          // Technical Score (RSI, MACD, MAs)
          if (rsi > 70) technicalScore -= (rsi - 70) * 0.8;
          else if (rsi < 30) technicalScore += (30 - rsi) * 0.8;

          if (macd.histogram > 0) technicalScore += Math.min(macd.histogram * 20, 20);
          else technicalScore -= Math.min(Math.abs(macd.histogram) * 20, 20);

          if (currentPrice > sma20 && currentPrice > sma50) technicalScore += 10;
          else if (currentPrice < sma20 && currentPrice < sma50) technicalScore -= 10;

          // Momentum Score
          const priceChange24h = marketData.price_change_percentage_24h || 0;
          const priceChange7d = marketData.price_change_percentage_7d || 0;

          if (priceChange24h > 5) momentumScore += Math.min(priceChange24h * 2, 30);
          else if (priceChange24h < -5) momentumScore -= Math.min(Math.abs(priceChange24h) * 2, 30);

          if (priceChange7d > 10) momentumScore += 10;
          else if (priceChange7d < -10) momentumScore -= 10;

          // Volatility Score (lower volatility = higher score)
          if (volatility < 2) volatilityScore = 80;
          else if (volatility < 5) volatilityScore = 60;
          else if (volatility < 10) volatilityScore = 40;
          else volatilityScore = 20;

          // Risk Score
          riskScore = Math.min(100, volatility * 10);
          if (rsi > 80 || rsi < 20) riskScore += 10;
          if (Math.abs(priceChange24h) > 10) riskScore += 15;

          // Clamp scores
          technicalScore = Math.max(0, Math.min(100, Math.round(technicalScore)));
          momentumScore = Math.max(0, Math.min(100, Math.round(momentumScore)));
          volatilityScore = Math.max(0, Math.min(100, Math.round(volatilityScore)));
          riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

          // Overall Score
          const overallScore = Math.round(
            technicalScore * 0.4 + momentumScore * 0.3 + volatilityScore * 0.2 + (100 - riskScore) * 0.1
          );

          // Recommendation
          let recommendation: InvestmentScore["recommendation"];
          const adjustedScore = overallScore - riskScore * 0.1;

          if (adjustedScore >= 75) recommendation = "strong_buy";
          else if (adjustedScore >= 60) recommendation = "buy";
          else if (adjustedScore >= 40) recommendation = "hold";
          else if (adjustedScore >= 25) recommendation = "sell";
          else recommendation = "strong_sell";

          // Generate reasoning
          const reasoning: string[] = [];
          if (rsi > 70) reasoning.push("RSI indicates overbought conditions");
          else if (rsi < 30) reasoning.push("RSI indicates oversold conditions");

          if (currentPrice > sma50) reasoning.push("Price above 50-day moving average (bullish trend)");
          else reasoning.push("Price below 50-day moving average (bearish trend)");

          if (priceChange24h > 5) reasoning.push("Strong positive momentum in last 24h");
          else if (priceChange24h < -5) reasoning.push("Strong negative momentum in last 24h");

          if (volatility > 8) reasoning.push("High volatility - increased risk");
          else if (volatility < 3) reasoning.push("Low volatility - more stable");

          return {
            success: true,
            score: {
              coinId,
              coinName: priceData.name,
              currentPrice: Math.round(currentPrice * 100) / 100,
              technicalScore,
              momentumScore,
              volatilityScore,
              riskScore,
              overallScore,
              recommendation,
              reasoning,
              metrics: {
                rsi,
                priceChange24h: Math.round(priceChange24h * 100) / 100,
                priceChange7d: Math.round(priceChange7d * 100) / 100,
                volatility,
                marketCapRank: priceData.market_cap_rank,
              },
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
   * Tool 3: Compare multiple cryptocurrencies (optimized)
   */
  compareCryptosTool() {
    return tool({
      description:
        "Compare multiple cryptocurrencies side by side with key metrics and scores. Use this when users want to compare different coins.",
      inputSchema: z.object({
        coinIds: z
          .array(z.string())
          .min(2)
          .max(3) // Reduced from 5 to 3
          .describe("Array of CoinGecko coin IDs to compare (2-3 coins only)"),
      }),
      execute: async ({ coinIds }) => {
        try {
          console.log("🔍 compareCryptos tool called:", { coinIds });

          // Limit to 3 coins and add delays
          const limitedCoinIds = coinIds.slice(0, 3);
          const comparisons = [];

          for (let i = 0; i < limitedCoinIds.length; i++) {
            const coinId = limitedCoinIds[i];
            
            // Add delay between requests
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            try {
              const [priceResponse, chartResponse] = await Promise.all([
                fetch(
                  `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}?localization=false&tickers=false&community_data=false&developer_data=false`
                ),
                fetch(
                  `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}/market_chart?vs_currency=usd&days=30`
                ),
              ]);

              if (!priceResponse.ok) {
                comparisons.push(null);
                continue;
              }

              const priceData = await priceResponse.json();
              const chartData = await chartResponse.json();
              const prices = chartData.prices.map((p: number[]) => p[1]);
              const marketData = priceData.market_data;

              const rsi = this.calculateRSI(prices);
              const volatility = this.calculateVolatility(prices);

              comparisons.push({
                id: coinId,
                name: priceData.name,
                symbol: priceData.symbol.toUpperCase(),
                currentPrice: marketData.current_price.usd,
                marketCap: marketData.market_cap.usd,
                marketCapRank: priceData.market_cap_rank,
                priceChange24h: marketData.price_change_percentage_24h,
                priceChange7d: marketData.price_change_percentage_7d,
                priceChange30d: marketData.price_change_percentage_30d,
                volume24h: marketData.total_volume.usd,
                rsi,
                volatility,
                athChangePercentage: marketData.ath_change_percentage.usd,
              });
            } catch {
              comparisons.push(null);
            }
          }

          const validComparisons = comparisons.filter((c) => c !== null);

          if (validComparisons.length < 2) {
            return {
              success: false,
              error: "Could not fetch data for enough coins to compare",
            };
          }

          // Sort by market cap
          validComparisons.sort((a, b) => (b?.marketCap || 0) - (a?.marketCap || 0));

          return {
            success: true,
            comparison: validComparisons,
            summary: {
              bestPerformer24h: validComparisons.reduce((best, current) =>
                (current?.priceChange24h || 0) > (best?.priceChange24h || 0) ? current : best
              )?.name,
              worstPerformer24h: validComparisons.reduce((worst, current) =>
                (current?.priceChange24h || 0) < (worst?.priceChange24h || 0) ? current : worst
              )?.name,
              lowestVolatility: validComparisons.reduce((lowest, current) =>
                (current?.volatility || 100) < (lowest?.volatility || 100) ? current : lowest
              )?.name,
              highestVolume: validComparisons.reduce((highest, current) =>
                (current?.volume24h || 0) > (highest?.volume24h || 0) ? current : highest
              )?.name,
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
   * Tool 4: Generate research summary
   */
  generateResearchSummaryTool() {
    return tool({
      description:
        "Generate a comprehensive research summary for a cryptocurrency including price analysis, market position, and key insights. Use this for detailed research reports.",
      inputSchema: z.object({
        coinId: z.string().describe("CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')"),
      }),
      execute: async ({ coinId }) => {
        try {
          console.log("🔍 generateResearchSummary tool called:", { coinId });

          const [coinResponse, chartResponse, globalResponse] = await Promise.all([
            fetch(
              `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}?localization=false&tickers=false&community_data=true&developer_data=true`
            ),
            fetch(
              `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}/market_chart?vs_currency=usd&days=90`
            ),
            fetch(`https://api.coingecko.com/api/v3/global`),
          ]);

          if (!coinResponse.ok) {
            return { success: false, error: `Coin not found: ${coinId}` };
          }

          const coinData = await coinResponse.json();
          const chartData = await chartResponse.json();
          const globalData = (await globalResponse.json()).data;
          const prices = chartData.prices.map((p: number[]) => p[1]);
          const marketData = coinData.market_data;

          // Calculate technical indicators
          const rsi = this.calculateRSI(prices);
          const macd = this.calculateMACD(prices);
          const volatility = this.calculateVolatility(prices);
          const sma50 = this.calculateSMA(prices, 50);
          const currentPrice = prices[prices.length - 1];

          // Market dominance
          const marketDominance =
            (marketData.market_cap.usd / globalData.total_market_cap.usd) * 100;

          // Key insights
          const insights: string[] = [];

          // Price trend
          if (marketData.price_change_percentage_30d > 20) {
            insights.push("Strong bullish trend over the past 30 days");
          } else if (marketData.price_change_percentage_30d < -20) {
            insights.push("Significant bearish pressure over the past 30 days");
          }

          // RSI insight
          if (rsi > 70) insights.push("Currently in overbought territory - potential correction ahead");
          else if (rsi < 30) insights.push("Currently oversold - potential buying opportunity");

          // ATH distance
          if (marketData.ath_change_percentage.usd > -20) {
            insights.push("Trading near all-time high levels");
          } else if (marketData.ath_change_percentage.usd < -70) {
            insights.push("Significantly below all-time high - potential recovery play");
          }

          // Volume analysis
          const avgVolume = chartData.total_volumes.reduce((a: number, b: number[]) => a + b[1], 0) / chartData.total_volumes.length;
          const currentVolume = marketData.total_volume.usd;
          if (currentVolume > avgVolume * 1.5) {
            insights.push("Above average trading volume - increased market interest");
          }

          return {
            success: true,
            summary: {
              basicInfo: {
                name: coinData.name,
                symbol: coinData.symbol.toUpperCase(),
                description: coinData.description?.en?.substring(0, 500) || "No description available",
                categories: coinData.categories,
                genesisDate: coinData.genesis_date,
                hashingAlgorithm: coinData.hashing_algorithm,
              },
              marketPosition: {
                currentPrice: Math.round(currentPrice * 100) / 100,
                marketCap: marketData.market_cap.usd,
                marketCapRank: coinData.market_cap_rank,
                marketDominance: Math.round(marketDominance * 1000) / 1000,
                fullyDilutedValuation: marketData.fully_diluted_valuation?.usd,
                volume24h: marketData.total_volume.usd,
                volumeToMarketCap: Math.round((marketData.total_volume.usd / marketData.market_cap.usd) * 100 * 100) / 100,
              },
              pricePerformance: {
                change24h: marketData.price_change_percentage_24h,
                change7d: marketData.price_change_percentage_7d,
                change30d: marketData.price_change_percentage_30d,
                change1y: marketData.price_change_percentage_1y,
                ath: marketData.ath.usd,
                athDate: marketData.ath_date.usd,
                athChangePercentage: marketData.ath_change_percentage.usd,
                atl: marketData.atl.usd,
                atlDate: marketData.atl_date.usd,
              },
              technicalIndicators: {
                rsi,
                macd,
                sma50: Math.round(sma50 * 100) / 100,
                volatility,
                priceVsSMA50: Math.round(((currentPrice - sma50) / sma50) * 100 * 100) / 100,
              },
              supply: {
                circulatingSupply: marketData.circulating_supply,
                totalSupply: marketData.total_supply,
                maxSupply: marketData.max_supply,
                circulatingPercentage: marketData.max_supply
                  ? Math.round((marketData.circulating_supply / marketData.max_supply) * 100 * 100) / 100
                  : null,
              },
              insights,
              links: {
                homepage: coinData.links?.homepage?.[0],
                blockchain: coinData.links?.blockchain_site?.[0],
                twitter: coinData.links?.twitter_screen_name
                  ? `https://twitter.com/${coinData.links.twitter_screen_name}`
                  : null,
                reddit: coinData.links?.subreddit_url,
                github: coinData.links?.repos_url?.github?.[0],
              },
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
      analyzeCrypto: this.analyzeCryptoTool(),
      calculateInvestmentScore: this.calculateInvestmentScoreTool(),
      compareCryptos: this.compareCryptosTool(),
      generateResearchSummary: this.generateResearchSummaryTool(),
    };
  }
}
