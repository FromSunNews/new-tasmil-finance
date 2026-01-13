"""
Research Agent - Cryptocurrency research and market analysis via MCP.

This agent helps users research, analyze, and understand cryptocurrencies
and the broader crypto market by calling MCP tools.
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
from typing import Optional
from typing_extensions import Literal

load_dotenv()

logger = get_logger(__name__)

# MCP Server URL
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3008/mcp")

RESEARCH_SYSTEM_PROMPT = """You are a professional cryptocurrency research analyst AI assistant.

## CRITICAL RULE - ALWAYS USE TOOLS:
You MUST call tools for ANY user question. NEVER respond with general knowledge.
- User asks about price → CALL research_get_crypto_price IMMEDIATELY
- User asks about market → CALL research_get_global_market_data or research_get_top_coins IMMEDIATELY
- User asks about trending → CALL research_get_trending_coins IMMEDIATELY
- User asks about DeFi → CALL research_get_defi_tvl IMMEDIATELY
- User asks about news → CALL research_get_crypto_news IMMEDIATELY

DO NOT explain what you're about to do. Just call the tool directly.

## Available Tools:
1. research_get_crypto_price(coinId) - Get price for a coin (e.g., "bitcoin", "ethereum")
2. research_get_top_coins(limit) - Get top coins by market cap
3. research_get_trending_coins() - Get trending cryptocurrencies
4. research_search_coins(query) - Search for a coin by name/symbol
5. research_get_global_market_data() - Get overall market statistics
6. research_get_defi_tvl(protocol) - Get DeFi TVL data
7. research_get_crypto_news(categories) - Get latest crypto news

## Tool Selection:
- "What's the price of X?" → research_get_crypto_price("x")
- "Top coins" / "Best crypto" → research_get_top_coins(10)
- "What's trending?" → research_get_trending_coins()
- "Market overview" → research_get_global_market_data()
- "DeFi TVL" → research_get_defi_tvl()
- "Crypto news" → research_get_crypto_news()

## Rules:
- Call 1-2 tools per response (avoid rate limits)
- NEVER make up data - always use tools
- After getting tool results, summarize clearly
- Include DYOR disclaimer for investment questions"""


class AgentState(CopilotKitState):
    """State schema for the research agent."""
    pass


# ============================================================================
# MCP Tool Wrapper - Call MCP server via HTTP
# ============================================================================

def call_mcp_tool(tool_name: str, arguments: dict) -> str:
    """Call an MCP tool via HTTP request using Streamable HTTP transport."""
    try:
        request_body = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(MCP_SERVER_URL, json=request_body, headers=headers)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "")
            
            if "text/event-stream" in content_type:
                lines = response.text.strip().split("\n")
                for line in lines:
                    if line.startswith("data:"):
                        data = line[5:].strip()
                        if data:
                            result = json.loads(data)
                            if "result" in result:
                                content = result.get("result", {}).get("content", [])
                                if content and len(content) > 0:
                                    return content[0].get("text", str(result))
                return str(response.text)
            else:
                result = response.json()
                
                if "error" in result:
                    return json.dumps({"success": False, "error": result['error']})
                
                content = result.get("result", {}).get("content", [])
                if content and len(content) > 0:
                    return content[0].get("text", str(result))
                return str(result.get("result", result))
            
    except Exception as e:
        logger.error("mcp_tool_call_failed", tool=tool_name, error=str(e))
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Pydantic models for tool inputs
# ============================================================================

class GetCryptoPriceInput(BaseModel):
    coinId: str = Field(description="CoinGecko coin ID (e.g., 'bitcoin', 'ethereum', 'solana')")

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
# Create tools that call MCP server
# ============================================================================

def create_research_tools():
    """Create research tools that call MCP server via HTTP."""
    return [
        StructuredTool.from_function(
            func=lambda coinId: call_mcp_tool("research_get_crypto_price", {"coinId": coinId}),
            name="research_get_crypto_price",
            description="Get current price and market data for a cryptocurrency",
            args_schema=GetCryptoPriceInput,
        ),
        StructuredTool.from_function(
            func=lambda limit=10: call_mcp_tool("research_get_top_coins", {"limit": limit}),
            name="research_get_top_coins",
            description="Get top cryptocurrencies ranked by market cap",
            args_schema=GetTopCoinsInput,
        ),
        StructuredTool.from_function(
            func=lambda: call_mcp_tool("research_get_trending_coins", {}),
            name="research_get_trending_coins",
            description="Get the top trending cryptocurrencies",
            args_schema=GetTrendingCoinsInput,
        ),
        StructuredTool.from_function(
            func=lambda query: call_mcp_tool("research_search_coins", {"query": query}),
            name="research_search_coins",
            description="Search for cryptocurrencies by name or symbol",
            args_schema=SearchCoinsInput,
        ),
        StructuredTool.from_function(
            func=lambda: call_mcp_tool("research_get_global_market_data", {}),
            name="research_get_global_market_data",
            description="Get global cryptocurrency market statistics",
            args_schema=GetGlobalMarketDataInput,
        ),
        StructuredTool.from_function(
            func=lambda protocol=None: call_mcp_tool("research_get_defi_tvl", {"protocol": protocol} if protocol else {}),
            name="research_get_defi_tvl",
            description="Get Total Value Locked (TVL) data for DeFi protocols",
            args_schema=GetDefiTVLInput,
        ),
        StructuredTool.from_function(
            func=lambda categories=None: call_mcp_tool("research_get_crypto_news", {"categories": categories} if categories else {}),
            name="research_get_crypto_news",
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
    
    copilotkit_state = state.get("copilotkit", {})
    fe_tools = copilotkit_state.get("actions", [])
    
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
