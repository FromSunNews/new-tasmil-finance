"""
Research Agent - Cryptocurrency research and market analysis.

This agent helps users research, analyze, and understand cryptocurrencies
and the broader crypto market using CoinGecko and DeFiLlama APIs.
"""

import os
import json
import httpx
from copilotkit import CopilotKitState
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.tools import StructuredTool
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import Command
from pydantic import BaseModel, Field
from structlog import get_logger
from typing import Optional, List
from typing_extensions import Literal
import time

load_dotenv()

logger = get_logger(__name__)

# API endpoints
COINGECKO_API_BASE = "https://api.coingecko.com/api/v3"
DEFILLAMA_API_BASE = "https://api.llama.fi"
CRYPTOCOMPARE_API_BASE = "https://min-api.cryptocompare.com/data"

RESEARCH_SYSTEM_PROMPT = """You are a professional cryptocurrency research analyst AI assistant.

## CRITICAL RULE - ALWAYS USE TOOLS:
You MUST call tools for ANY user question. NEVER respond with general knowledge.
- User asks about price → CALL get_crypto_price IMMEDIATELY
- User asks about market → CALL get_global_market_data or get_top_coins IMMEDIATELY
- User asks about trending → CALL get_trending_coins IMMEDIATELY
- User asks about DeFi → CALL get_defi_tvl IMMEDIATELY
- User asks about news → CALL get_crypto_news IMMEDIATELY

DO NOT explain what you're about to do. Just call the tool directly.

## Available Tools:
1. get_crypto_price(coin_id) - Get price for a coin (e.g., "bitcoin", "ethereum")
2. get_top_coins(limit) - Get top coins by market cap
3. get_trending_coins() - Get trending cryptocurrencies
4. search_coins(query) - Search for a coin by name/symbol
5. get_global_market_data() - Get overall market statistics
6. get_defi_tvl(protocol) - Get DeFi TVL data
7. get_crypto_news(categories) - Get latest crypto news

## Tool Selection:
- "What's the price of X?" → get_crypto_price("x")
- "Top coins" / "Best crypto" → get_top_coins(10)
- "What's trending?" → get_trending_coins()
- "Market overview" → get_global_market_data()
- "DeFi TVL" → get_defi_tvl()
- "Crypto news" → get_crypto_news()

## Rules:
- Call 1-2 tools per response (avoid rate limits)
- NEVER make up data - always use tools
- After getting tool results, summarize clearly
- Include DYOR disclaimer for investment questions"""


class AgentState(CopilotKitState):
    """State schema for the research agent."""
    pass


# ============================================================================
# Pydantic models for tool inputs
# ============================================================================

class GetCryptoPriceInput(BaseModel):
    coin_id: str = Field(description="CoinGecko coin ID (e.g., 'bitcoin', 'ethereum', 'solana')")

class GetTopCoinsInput(BaseModel):
    limit: int = Field(default=10, description="Number of coins to return (1-50, default 10)")

class GetTrendingCoinsInput(BaseModel):
    """Input for getting trending coins."""
    pass

class SearchCoinsInput(BaseModel):
    query: str = Field(description="Search query (coin name or symbol)")

class GetGlobalMarketDataInput(BaseModel):
    """Input for getting global market data."""
    pass

class GetDefiTVLInput(BaseModel):
    protocol: Optional[str] = Field(default=None, description="Protocol name (e.g., 'aave', 'uniswap'). Leave empty for top protocols.")

class GetCryptoNewsInput(BaseModel):
    categories: Optional[str] = Field(default=None, description="News categories (e.g., 'BTC', 'ETH', 'Trading')")


# ============================================================================
# Research Tools Implementation - Returns JSON for UI rendering
# ============================================================================

def get_crypto_price(coin_id: str) -> str:
    """Get current price and market data for a cryptocurrency."""
    try:
        logger.info("get_crypto_price called", coin_id=coin_id)
        time.sleep(0.8)  # Rate limit protection
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{COINGECKO_API_BASE}/coins/{coin_id.lower()}",
                params={"localization": "false", "tickers": "false", "community_data": "false", "developer_data": "false"},
                headers={"Accept": "application/json"}
            )
            
            if response.status_code == 429:
                return json.dumps({"success": False, "error": "Rate limit exceeded. Please try again in a minute."})
            
            if not response.is_success:
                return json.dumps({"success": False, "error": f"Coin not found: {coin_id}. Try using the full name like 'bitcoin' or 'ethereum'."})
            
            data = response.json()
            md = data.get("market_data", {})
            
            return json.dumps({
                "success": True,
                "coin": {
                    "id": data.get("id"),
                    "symbol": data.get("symbol", "").upper(),
                    "name": data.get("name"),
                    "currentPrice": md.get("current_price", {}).get("usd"),
                    "marketCap": md.get("market_cap", {}).get("usd"),
                    "marketCapRank": data.get("market_cap_rank"),
                    "priceChange24h": md.get("price_change_percentage_24h"),
                    "priceChange7d": md.get("price_change_percentage_7d"),
                    "priceChange30d": md.get("price_change_percentage_30d"),
                    "totalVolume24h": md.get("total_volume", {}).get("usd"),
                    "circulatingSupply": md.get("circulating_supply"),
                    "totalSupply": md.get("total_supply"),
                    "maxSupply": md.get("max_supply"),
                    "ath": md.get("ath", {}).get("usd"),
                    "athChangePercentage": md.get("ath_change_percentage", {}).get("usd"),
                    "atl": md.get("atl", {}).get("usd"),
                    "high24h": md.get("high_24h", {}).get("usd"),
                    "low24h": md.get("low_24h", {}).get("usd"),
                }
            })
            
    except Exception as e:
        logger.error("get_crypto_price_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_top_coins(limit: int = 10) -> str:
    """Get top cryptocurrencies ranked by market cap."""
    try:
        logger.info("get_top_coins called", limit=limit)
        time.sleep(0.5)
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{COINGECKO_API_BASE}/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": min(limit, 50),
                    "page": 1,
                    "sparkline": "false",
                    "price_change_percentage": "24h,7d"
                },
                headers={"Accept": "application/json"}
            )
            
            if not response.is_success:
                return json.dumps({"success": False, "error": "Failed to fetch top coins"})
            
            data = response.json()
            
            return json.dumps({
                "success": True,
                "topCoins": [
                    {
                        "rank": coin.get("market_cap_rank"),
                        "id": coin.get("id"),
                        "symbol": coin.get("symbol", "").upper(),
                        "name": coin.get("name"),
                        "currentPrice": coin.get("current_price"),
                        "marketCap": coin.get("market_cap"),
                        "priceChange24h": coin.get("price_change_percentage_24h"),
                        "priceChange7d": coin.get("price_change_percentage_7d_in_currency"),
                        "totalVolume": coin.get("total_volume"),
                    }
                    for coin in data
                ]
            })
            
    except Exception as e:
        logger.error("get_top_coins_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_trending_coins() -> str:
    """Get the top trending cryptocurrencies."""
    try:
        logger.info("get_trending_coins called")
        time.sleep(0.6)
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{COINGECKO_API_BASE}/search/trending",
                headers={"Accept": "application/json"}
            )
            
            if not response.is_success:
                return json.dumps({"success": False, "error": "Failed to fetch trending coins"})
            
            data = response.json()
            coins = data.get("coins", [])
            
            return json.dumps({
                "success": True,
                "trendingCoins": [
                    {
                        "id": item.get("item", {}).get("id"),
                        "name": item.get("item", {}).get("name"),
                        "symbol": item.get("item", {}).get("symbol", "").upper(),
                        "marketCapRank": item.get("item", {}).get("market_cap_rank"),
                        "score": item.get("item", {}).get("score"),
                        "priceBtc": item.get("item", {}).get("price_btc"),
                    }
                    for item in coins[:10]
                ]
            })
            
    except Exception as e:
        logger.error("get_trending_coins_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def search_coins(query: str) -> str:
    """Search for cryptocurrencies by name or symbol."""
    try:
        logger.info("search_coins called", query=query)
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{COINGECKO_API_BASE}/search",
                params={"query": query},
                headers={"Accept": "application/json"}
            )
            
            if not response.is_success:
                return json.dumps({"success": False, "error": "Search failed"})
            
            data = response.json()
            coins = data.get("coins", [])[:10]
            
            return json.dumps({
                "success": True,
                "results": [
                    {
                        "id": coin.get("id"),
                        "name": coin.get("name"),
                        "symbol": coin.get("symbol", "").upper(),
                        "marketCapRank": coin.get("market_cap_rank"),
                    }
                    for coin in coins
                ]
            })
            
    except Exception as e:
        logger.error("search_coins_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_global_market_data() -> str:
    """Get global cryptocurrency market statistics."""
    try:
        logger.info("get_global_market_data called")
        time.sleep(0.6)
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{COINGECKO_API_BASE}/global",
                headers={"Accept": "application/json"}
            )
            
            if not response.is_success:
                return json.dumps({"success": False, "error": "Failed to fetch global data"})
            
            data = response.json().get("data", {})
            
            return json.dumps({
                "success": True,
                "globalMarket": {
                    "totalMarketCap": data.get("total_market_cap", {}).get("usd"),
                    "totalVolume24h": data.get("total_volume", {}).get("usd"),
                    "btcDominance": data.get("market_cap_percentage", {}).get("btc"),
                    "ethDominance": data.get("market_cap_percentage", {}).get("eth"),
                    "activeCryptocurrencies": data.get("active_cryptocurrencies"),
                    "markets": data.get("markets"),
                    "marketCapChange24h": data.get("market_cap_change_percentage_24h_usd"),
                }
            })
            
    except Exception as e:
        logger.error("get_global_market_data_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_defi_tvl(protocol: Optional[str] = None) -> str:
    """Get Total Value Locked (TVL) data for DeFi protocols."""
    try:
        logger.info("get_defi_tvl called", protocol=protocol)
        
        with httpx.Client(timeout=30.0) as client:
            if protocol:
                response = client.get(
                    f"{DEFILLAMA_API_BASE}/protocol/{protocol.lower()}",
                    headers={"Accept": "application/json"}
                )
                
                if not response.is_success:
                    return json.dumps({"success": False, "error": f"Protocol not found: {protocol}"})
                
                data = response.json()
                
                return json.dumps({
                    "success": True,
                    "protocol": {
                        "name": data.get("name"),
                        "symbol": data.get("symbol"),
                        "tvl": data.get("tvl"),
                        "change1d": data.get("change_1d"),
                        "change7d": data.get("change_7d"),
                        "category": data.get("category"),
                        "chains": data.get("chains", [])[:5],
                        "url": data.get("url"),
                    }
                })
            else:
                response = client.get(
                    f"{DEFILLAMA_API_BASE}/protocols",
                    headers={"Accept": "application/json"}
                )
                
                if not response.is_success:
                    return json.dumps({"success": False, "error": "Failed to fetch DeFi data"})
                
                data = response.json()[:20]
                
                return json.dumps({
                    "success": True,
                    "topProtocols": [
                        {
                            "name": p.get("name"),
                            "symbol": p.get("symbol"),
                            "tvl": p.get("tvl"),
                            "change1d": p.get("change_1d"),
                            "change7d": p.get("change_7d"),
                            "category": p.get("category"),
                            "chains": p.get("chains", [])[:5],
                        }
                        for p in data
                    ]
                })
            
    except Exception as e:
        logger.error("get_defi_tvl_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_crypto_news(categories: Optional[str] = None) -> str:
    """Get latest cryptocurrency news."""
    try:
        logger.info("get_crypto_news called", categories=categories)
        
        url = f"{CRYPTOCOMPARE_API_BASE}/v2/news/?lang=EN"
        if categories:
            url += f"&categories={categories}"
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(url, headers={"Accept": "application/json"})
            
            if not response.is_success:
                return json.dumps({"success": False, "error": "Failed to fetch news"})
            
            data = response.json().get("Data", [])[:10]
            
            return json.dumps({
                "success": True,
                "news": [
                    {
                        "title": article.get("title"),
                        "source": article.get("source"),
                        "url": article.get("url"),
                        "body": article.get("body", "")[:300] + "...",
                        "categories": article.get("categories"),
                    }
                    for article in data
                ]
            })
            
    except Exception as e:
        logger.error("get_crypto_news_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def create_research_tools():
    """Create research tools."""
    return [
        StructuredTool.from_function(
            func=lambda coin_id: get_crypto_price(coin_id),
            name="get_crypto_price",
            description="Get current price and market data for a cryptocurrency",
            args_schema=GetCryptoPriceInput,
        ),
        StructuredTool.from_function(
            func=lambda limit=10: get_top_coins(limit),
            name="get_top_coins",
            description="Get top cryptocurrencies ranked by market cap",
            args_schema=GetTopCoinsInput,
        ),
        StructuredTool.from_function(
            func=lambda: get_trending_coins(),
            name="get_trending_coins",
            description="Get the top trending cryptocurrencies",
            args_schema=GetTrendingCoinsInput,
        ),
        StructuredTool.from_function(
            func=lambda query: search_coins(query),
            name="search_coins",
            description="Search for cryptocurrencies by name or symbol",
            args_schema=SearchCoinsInput,
        ),
        StructuredTool.from_function(
            func=lambda: get_global_market_data(),
            name="get_global_market_data",
            description="Get global cryptocurrency market statistics",
            args_schema=GetGlobalMarketDataInput,
        ),
        StructuredTool.from_function(
            func=lambda protocol=None: get_defi_tvl(protocol),
            name="get_defi_tvl",
            description="Get Total Value Locked (TVL) data for DeFi protocols",
            args_schema=GetDefiTVLInput,
        ),
        StructuredTool.from_function(
            func=lambda categories=None: get_crypto_news(categories),
            name="get_crypto_news",
            description="Get latest cryptocurrency news",
            args_schema=GetCryptoNewsInput,
        ),
    ]


tools = create_research_tools()


def should_route_to_tool_node(tool_calls: list, fe_tools: list) -> bool:
    """Returns True if none of the tool calls are frontend tools."""
    if not tool_calls:
        return False
    fe_tool_names = {tool.get("name") for tool in fe_tools}
    for tool_call in tool_calls:
        tool_name = tool_call.get("name") if isinstance(tool_call, dict) else getattr(tool_call, "name", None)
        if tool_name in fe_tool_names:
            return False
    return True


async def chat_node(
    state: AgentState, config: RunnableConfig
) -> Command[Literal["tool_node", "__end__"]]:
    """Chat node for research agent."""
    model = init_chat_model("gpt-4o-mini")
    
    logger.info("=== RESEARCH AGENT chat_node called ===", message_count=len(state.get("messages", [])))
    
    # Get CopilotKit state
    copilotkit_state = state.get("copilotkit", {})
    fe_tools = copilotkit_state.get("actions", [])
    
    # Get context from CopilotKit (includes wallet address from useCopilotReadable)
    context_items = copilotkit_state.get("context", [])
    context_str = ""
    if context_items:
        context_parts = []
        for item in context_items:
            if isinstance(item, dict):
                value = item.get("value", "")
                description = item.get("description", "")
                if value:
                    context_parts.append(f"{description}: {value}" if description else str(value))
            else:
                context_parts.append(str(item))
        context_str = "\n".join(context_parts)
    
    all_tools = tools + fe_tools
    
    logger.info("research_agent_tools", backend_tools=[t.name for t in tools], frontend_tools=[t.get("name") for t in fe_tools])
    
    model_with_tools = model.bind_tools(all_tools, parallel_tool_calls=False)
    
    # Build system prompt with context
    system_content = RESEARCH_SYSTEM_PROMPT
    if context_str:
        system_content = f"{RESEARCH_SYSTEM_PROMPT}\n\n## CURRENT CONTEXT:\n{context_str}"
    
    system_message = SystemMessage(content=system_content)
    
    response = await model_with_tools.ainvoke(
        [system_message, *state.get("messages", [])],
        config,
    )
    
    tool_calls = response.tool_calls
    if tool_calls and should_route_to_tool_node(tool_calls, fe_tools):
        logger.info("routing_to_tool_node", tool_count=len(tool_calls))
        return Command(goto="tool_node", update={"messages": response})
    
    return Command(goto="__end__", update={"messages": response})


def build_graph():
    """Build the research agent graph."""
    workflow = StateGraph(AgentState)
    
    workflow.add_node("chat_node", chat_node)
    workflow.add_node("tool_node", ToolNode(tools=tools))
    workflow.add_edge("tool_node", "chat_node")
    workflow.set_entry_point("chat_node")
    
    checkpointer = MemorySaver()
    compiled = workflow.compile(checkpointer=checkpointer)
    compiled.name = "ResearchAgent"
    
    logger.info("research_graph_built", tool_count=len(tools))
    return compiled


graph = build_graph()


def get_graph():
    """Get the research agent graph."""
    return graph
