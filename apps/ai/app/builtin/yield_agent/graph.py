"""
Yield Agent - DeFi yield farming opportunities using DeFiLlama.

This agent helps users discover and analyze yield farming opportunities
across multiple chains and protocols.
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

# DeFiLlama Yields API
DEFILLAMA_YIELDS_API = "https://yields.llama.fi"

# Cache for pools data
pools_cache = {"data": None, "timestamp": 0}
CACHE_TTL = 5 * 60  # 5 minutes

YIELD_SYSTEM_PROMPT = """You are a DeFi yield farming assistant using DeFiLlama data.

## CRITICAL RULE - ALWAYS USE TOOLS:
You MUST call tools for ANY user question. NEVER respond with general knowledge.
- User asks about yields → CALL get_yield_pools or get_yield_stats IMMEDIATELY
- User asks about specific chain → CALL get_top_yields_by_chain IMMEDIATELY
- User asks about stablecoins → CALL get_stablecoin_yields IMMEDIATELY
- User asks about specific token → CALL search_pools_by_token IMMEDIATELY

DO NOT explain what you're about to do. Just call the tool directly.

## Available Tools:
1. get_yield_pools(chain, project, min_tvl, min_apy, stablecoin_only, limit) - Search yield pools
2. get_top_yields_by_chain(chain, limit, min_tvl) - Top yields on a specific chain
3. get_yield_history(pool_id) - Historical APY for a pool
4. get_yield_stats(top_n) - Overall market statistics
5. search_pools_by_token(token, limit, min_tvl) - Find pools for a token
6. get_stablecoin_yields(chain, limit, min_tvl) - Safe stablecoin yields

## Tool Selection:
- "Best yields" / "Top APY" → get_yield_pools(limit=10)
- "Yields on Ethereum/Arbitrum" → get_top_yields_by_chain("Ethereum")
- "Stablecoin yields" / "Safe yields" → get_stablecoin_yields()
- "ETH/USDC yields" → search_pools_by_token("ETH")
- "Market overview" → get_yield_stats()

## Rules:
- Call tools IMMEDIATELY without explanation
- NEVER make up yield data - always use tools
- After getting results, summarize with APY, TVL, risk
- Warn about high APY = high risk"""


class AgentState(CopilotKitState):
    """State schema for the yield agent."""
    pass


# ============================================================================
# Pydantic models for tool inputs
# ============================================================================

class GetYieldPoolsInput(BaseModel):
    chain: Optional[str] = Field(default=None, description="Filter by blockchain (e.g., 'Ethereum', 'Arbitrum', 'BSC')")
    project: Optional[str] = Field(default=None, description="Filter by protocol (e.g., 'aave-v3', 'uniswap-v3')")
    min_tvl: Optional[float] = Field(default=100000, description="Minimum TVL in USD")
    min_apy: Optional[float] = Field(default=None, description="Minimum APY percentage")
    stablecoin_only: Optional[bool] = Field(default=False, description="Only show stablecoin pools")
    limit: int = Field(default=15, description="Number of pools to return (1-30)")

class GetTopYieldsByChainInput(BaseModel):
    chain: str = Field(description="Blockchain name (e.g., 'Ethereum', 'Arbitrum', 'BSC')")
    limit: int = Field(default=10, description="Number of top pools to return")
    min_tvl: Optional[float] = Field(default=50000, description="Minimum TVL in USD")

class GetYieldHistoryInput(BaseModel):
    pool_id: str = Field(description="The pool ID from DeFiLlama")

class GetYieldStatsInput(BaseModel):
    top_n: int = Field(default=10, description="Number of top chains to include")

class SearchPoolsByTokenInput(BaseModel):
    token: str = Field(description="Token symbol to search for (e.g., 'ETH', 'USDC')")
    limit: int = Field(default=10, description="Number of pools to return")
    min_tvl: Optional[float] = Field(default=50000, description="Minimum TVL in USD")

class GetStablecoinYieldsInput(BaseModel):
    chain: Optional[str] = Field(default=None, description="Filter by blockchain")
    limit: int = Field(default=10, description="Number of pools to return")
    min_tvl: Optional[float] = Field(default=100000, description="Minimum TVL in USD")


# ============================================================================
# Yield Tools Implementation - Returns JSON for UI rendering
# ============================================================================

def fetch_pools_with_cache() -> list:
    """Fetch pools with caching to reduce API calls."""
    global pools_cache
    now = time.time()
    
    if pools_cache["data"] and (now - pools_cache["timestamp"]) < CACHE_TTL:
        logger.info("using_cached_pools_data")
        return pools_cache["data"]
    
    logger.info("fetching_fresh_pools_data")
    time.sleep(0.3)  # Rate limit protection
    
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            f"{DEFILLAMA_YIELDS_API}/pools",
            headers={"Accept": "application/json"}
        )
        
        if not response.is_success:
            raise Exception("Failed to fetch yield pools")
        
        data = response.json()
        pools_cache["data"] = data.get("data", [])
        pools_cache["timestamp"] = now
        
        return pools_cache["data"]


def get_yield_pools(
    chain: Optional[str] = None,
    project: Optional[str] = None,
    min_tvl: float = 100000,
    min_apy: Optional[float] = None,
    stablecoin_only: bool = False,
    limit: int = 15
) -> str:
    """Get yield farming pools with filtering."""
    try:
        logger.info("get_yield_pools called", chain=chain, project=project, min_tvl=min_tvl)
        
        pools = fetch_pools_with_cache()
        
        # Apply filters
        if chain:
            pools = [p for p in pools if p.get("chain", "").lower() == chain.lower()]
        
        if project:
            pools = [p for p in pools if project.lower() in p.get("project", "").lower()]
        
        if min_tvl:
            pools = [p for p in pools if (p.get("tvlUsd") or 0) >= min_tvl]
        
        if min_apy is not None:
            pools = [p for p in pools if (p.get("apy") or 0) >= min_apy]
        
        if stablecoin_only:
            pools = [p for p in pools if p.get("stablecoin") is True]
        
        # Sort by APY descending
        pools.sort(key=lambda x: x.get("apy") or 0, reverse=True)
        pools = pools[:min(limit, 30)]
        
        return json.dumps({
            "success": True,
            "totalPools": len(pools),
            "pools": [
                {
                    "chain": p.get("chain"),
                    "project": p.get("project"),
                    "symbol": p.get("symbol"),
                    "tvlUsd": p.get("tvlUsd"),
                    "apy": p.get("apy"),
                    "apyBase": p.get("apyBase"),
                    "apyReward": p.get("apyReward"),
                    "apyChange1D": p.get("apyPct1D"),
                    "apyChange7D": p.get("apyPct7D"),
                    "apyChange30D": p.get("apyPct30D"),
                    "stablecoin": p.get("stablecoin"),
                    "ilRisk": p.get("ilRisk"),
                    "rewardTokens": p.get("rewardTokens"),
                    "poolMeta": p.get("poolMeta"),
                }
                for p in pools
            ]
        })
        
    except Exception as e:
        logger.error("get_yield_pools_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_top_yields_by_chain(chain: str, limit: int = 10, min_tvl: float = 50000) -> str:
    """Get top yield opportunities for a specific blockchain."""
    try:
        logger.info("get_top_yields_by_chain called", chain=chain, limit=limit)
        
        pools = fetch_pools_with_cache()
        
        # Filter by chain
        pools = [p for p in pools if p.get("chain", "").lower() == chain.lower()]
        
        if min_tvl:
            pools = [p for p in pools if (p.get("tvlUsd") or 0) >= min_tvl]
        
        # Sort by APY descending
        pools.sort(key=lambda x: x.get("apy") or 0, reverse=True)
        pools = pools[:min(limit, 15)]
        
        return json.dumps({
            "success": True,
            "chain": chain,
            "totalPools": len(pools),
            "pools": [
                {
                    "rank": i + 1,
                    "project": p.get("project"),
                    "symbol": p.get("symbol"),
                    "tvlUsd": p.get("tvlUsd"),
                    "apy": p.get("apy"),
                    "apyBase": p.get("apyBase"),
                    "apyReward": p.get("apyReward"),
                    "stablecoin": p.get("stablecoin"),
                    "ilRisk": p.get("ilRisk"),
                    "rewardTokens": p.get("rewardTokens"),
                }
                for i, p in enumerate(pools)
            ]
        })
        
    except Exception as e:
        logger.error("get_top_yields_by_chain_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_yield_history(pool_id: str) -> str:
    """Get historical APY data for a specific yield pool."""
    try:
        logger.info("get_yield_history called", pool_id=pool_id)
        time.sleep(0.5)  # Rate limit
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{DEFILLAMA_YIELDS_API}/chart/{pool_id}",
                headers={"Accept": "application/json"}
            )
            
            if not response.is_success:
                return json.dumps({"success": False, "error": f"Failed to fetch history. Pool ID may be invalid: {pool_id}"})
            
            data = response.json()
            history = data.get("data", [])[-30:]  # Last 30 data points
            
            return json.dumps({
                "success": True,
                "poolId": pool_id,
                "dataPoints": len(history),
                "history": [
                    {
                        "timestamp": h.get("timestamp"),
                        "tvlUsd": h.get("tvlUsd"),
                        "apy": h.get("apy"),
                        "apyBase": h.get("apyBase"),
                        "apyReward": h.get("apyReward"),
                    }
                    for h in history
                ]
            })
            
    except Exception as e:
        logger.error("get_yield_history_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_yield_stats(top_n: int = 10) -> str:
    """Get overall yield statistics and summary across all chains."""
    try:
        logger.info("get_yield_stats called", top_n=top_n)
        
        pools = fetch_pools_with_cache()
        
        # Calculate stats by chain
        chain_stats = {}
        for p in pools:
            chain = p.get("chain", "Unknown")
            if chain not in chain_stats:
                chain_stats[chain] = {"totalTvl": 0, "poolCount": 0, "totalApy": 0, "maxApy": 0}
            
            chain_stats[chain]["totalTvl"] += p.get("tvlUsd") or 0
            chain_stats[chain]["poolCount"] += 1
            chain_stats[chain]["totalApy"] += p.get("apy") or 0
            chain_stats[chain]["maxApy"] = max(chain_stats[chain]["maxApy"], p.get("apy") or 0)
        
        # Sort by TVL and calculate averages
        sorted_chains = sorted(
            chain_stats.items(),
            key=lambda x: x[1]["totalTvl"],
            reverse=True
        )[:top_n]
        
        # Overall stats
        total_tvl = sum(p.get("tvlUsd") or 0 for p in pools)
        total_pools = len(pools)
        avg_apy = sum(p.get("apy") or 0 for p in pools) / total_pools if total_pools > 0 else 0
        
        return json.dumps({
            "success": True,
            "overview": {
                "totalTvl": total_tvl,
                "totalPools": total_pools,
                "avgApy": avg_apy,
                "chainsCount": len(chain_stats),
            },
            "topChains": [
                {
                    "chain": chain,
                    "totalTvl": stats["totalTvl"],
                    "poolCount": stats["poolCount"],
                    "avgApy": stats["totalApy"] / stats["poolCount"] if stats["poolCount"] > 0 else 0,
                    "maxApy": stats["maxApy"],
                }
                for chain, stats in sorted_chains
            ]
        })
        
    except Exception as e:
        logger.error("get_yield_stats_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def search_pools_by_token(token: str, limit: int = 10, min_tvl: float = 50000) -> str:
    """Search yield pools by token symbol."""
    try:
        logger.info("search_pools_by_token called", token=token, limit=limit)
        
        pools = fetch_pools_with_cache()
        
        # Filter by token symbol
        pools = [p for p in pools if token.upper() in p.get("symbol", "").upper()]
        
        if min_tvl:
            pools = [p for p in pools if (p.get("tvlUsd") or 0) >= min_tvl]
        
        # Sort by APY descending
        pools.sort(key=lambda x: x.get("apy") or 0, reverse=True)
        pools = pools[:min(limit, 20)]
        
        return json.dumps({
            "success": True,
            "token": token.upper(),
            "totalPools": len(pools),
            "pools": [
                {
                    "chain": p.get("chain"),
                    "project": p.get("project"),
                    "symbol": p.get("symbol"),
                    "tvlUsd": p.get("tvlUsd"),
                    "apy": p.get("apy"),
                    "apyBase": p.get("apyBase"),
                    "apyReward": p.get("apyReward"),
                    "stablecoin": p.get("stablecoin"),
                    "ilRisk": p.get("ilRisk"),
                    "poolId": p.get("pool"),
                }
                for p in pools
            ]
        })
        
    except Exception as e:
        logger.error("search_pools_by_token_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_stablecoin_yields(chain: Optional[str] = None, limit: int = 10, min_tvl: float = 100000) -> str:
    """Get best stablecoin yield opportunities."""
    try:
        logger.info("get_stablecoin_yields called", chain=chain, limit=limit)
        
        pools = fetch_pools_with_cache()
        
        # Filter stablecoins only
        pools = [p for p in pools if p.get("stablecoin") is True]
        
        if chain:
            pools = [p for p in pools if p.get("chain", "").lower() == chain.lower()]
        
        if min_tvl:
            pools = [p for p in pools if (p.get("tvlUsd") or 0) >= min_tvl]
        
        # Sort by APY descending
        pools.sort(key=lambda x: x.get("apy") or 0, reverse=True)
        pools = pools[:min(limit, 20)]
        
        return json.dumps({
            "success": True,
            "totalPools": len(pools),
            "pools": [
                {
                    "rank": i + 1,
                    "chain": p.get("chain"),
                    "project": p.get("project"),
                    "symbol": p.get("symbol"),
                    "tvlUsd": p.get("tvlUsd"),
                    "apy": p.get("apy"),
                    "apyBase": p.get("apyBase"),
                    "apyReward": p.get("apyReward"),
                    "ilRisk": p.get("ilRisk"),
                    "poolId": p.get("pool"),
                }
                for i, p in enumerate(pools)
            ]
        })
        
    except Exception as e:
        logger.error("get_stablecoin_yields_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def create_yield_tools():
    """Create yield tools."""
    return [
        StructuredTool.from_function(
            func=lambda chain=None, project=None, min_tvl=100000, min_apy=None, stablecoin_only=False, limit=15: get_yield_pools(chain, project, min_tvl, min_apy, stablecoin_only, limit),
            name="get_yield_pools",
            description="Get yield farming pools with filtering. Use for general yield searches.",
            args_schema=GetYieldPoolsInput,
        ),
        StructuredTool.from_function(
            func=lambda chain, limit=10, min_tvl=50000: get_top_yields_by_chain(chain, limit, min_tvl),
            name="get_top_yields_by_chain",
            description="Get top yield opportunities for a specific blockchain.",
            args_schema=GetTopYieldsByChainInput,
        ),
        StructuredTool.from_function(
            func=lambda pool_id: get_yield_history(pool_id),
            name="get_yield_history",
            description="Get historical APY data for a specific yield pool.",
            args_schema=GetYieldHistoryInput,
        ),
        StructuredTool.from_function(
            func=lambda top_n=10: get_yield_stats(top_n),
            name="get_yield_stats",
            description="Get overall yield statistics and market overview.",
            args_schema=GetYieldStatsInput,
        ),
        StructuredTool.from_function(
            func=lambda token, limit=10, min_tvl=50000: search_pools_by_token(token, limit, min_tvl),
            name="search_pools_by_token",
            description="Search yield pools by token symbol (e.g., ETH, USDC).",
            args_schema=SearchPoolsByTokenInput,
        ),
        StructuredTool.from_function(
            func=lambda chain=None, limit=10, min_tvl=100000: get_stablecoin_yields(chain, limit, min_tvl),
            name="get_stablecoin_yields",
            description="Get best stablecoin yield opportunities (low risk).",
            args_schema=GetStablecoinYieldsInput,
        ),
    ]


tools = create_yield_tools()


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
    """Chat node for yield agent."""
    model = init_chat_model("gpt-4o-mini")
    
    logger.info("=== YIELD AGENT chat_node called ===", message_count=len(state.get("messages", [])))
    
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
    
    logger.info("yield_agent_tools", backend_tools=[t.name for t in tools], frontend_tools=[t.get("name") for t in fe_tools])
    
    model_with_tools = model.bind_tools(all_tools, parallel_tool_calls=False)
    
    # Build system prompt with context
    system_content = YIELD_SYSTEM_PROMPT
    if context_str:
        system_content = f"{YIELD_SYSTEM_PROMPT}\n\n## CURRENT CONTEXT:\n{context_str}"
    
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
    """Build the yield agent graph."""
    workflow = StateGraph(AgentState)
    
    workflow.add_node("chat_node", chat_node)
    workflow.add_node("tool_node", ToolNode(tools=tools))
    workflow.add_edge("tool_node", "chat_node")
    workflow.set_entry_point("chat_node")
    
    checkpointer = MemorySaver()
    compiled = workflow.compile(checkpointer=checkpointer)
    compiled.name = "YieldAgent"
    
    logger.info("yield_graph_built", tool_count=len(tools))
    return compiled


graph = build_graph()


def get_graph():
    """Get the yield agent graph."""
    return graph
