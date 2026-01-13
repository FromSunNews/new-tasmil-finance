"""
Yield Agent - DeFi yield farming opportunities via MCP.

This agent helps users discover and analyze yield farming opportunities
across multiple chains and protocols by calling MCP tools.
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

YIELD_SYSTEM_PROMPT = """You are a DeFi yield farming assistant using DeFiLlama data.

## CRITICAL RULE - ALWAYS USE TOOLS:
You MUST call tools for ANY user question. NEVER respond with general knowledge.
- User asks about yields → CALL yield_get_yield_pools or yield_get_yield_stats IMMEDIATELY
- User asks about specific chain → CALL yield_get_top_yields_by_chain IMMEDIATELY
- User asks about stablecoins → CALL yield_get_stablecoin_yields IMMEDIATELY
- User asks about specific token → CALL yield_search_pools_by_token IMMEDIATELY

DO NOT explain what you're about to do. Just call the tool directly.

## Available Tools:
1. yield_get_yield_pools(chain, project, minTvl, minApy, stablecoinOnly, limit) - Search yield pools
2. yield_get_top_yields_by_chain(chain, limit, minTvl) - Top yields on a specific chain
3. yield_get_yield_history(poolId) - Historical APY for a pool
4. yield_get_yield_stats(topN) - Overall market statistics
5. yield_search_pools_by_token(token, limit, minTvl) - Find pools for a token
6. yield_get_stablecoin_yields(chain, limit, minTvl) - Safe stablecoin yields

## Tool Selection:
- "Best yields" / "Top APY" → yield_get_yield_pools(limit=10)
- "Yields on Ethereum/Arbitrum" → yield_get_top_yields_by_chain("Ethereum")
- "Stablecoin yields" / "Safe yields" → yield_get_stablecoin_yields()
- "ETH/USDC yields" → yield_search_pools_by_token("ETH")
- "Market overview" → yield_get_yield_stats()

## Rules:
- Call tools IMMEDIATELY without explanation
- NEVER make up yield data - always use tools
- After getting results, summarize with APY, TVL, risk
- Warn about high APY = high risk"""


class AgentState(CopilotKitState):
    """State schema for the yield agent."""
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

class GetYieldPoolsInput(BaseModel):
    chain: Optional[str] = Field(default=None, description="Filter by blockchain (e.g., 'Ethereum', 'Arbitrum', 'BSC')")
    project: Optional[str] = Field(default=None, description="Filter by protocol (e.g., 'aave-v3', 'uniswap-v3')")
    minTvl: Optional[float] = Field(default=100000, description="Minimum TVL in USD")
    minApy: Optional[float] = Field(default=None, description="Minimum APY percentage")
    stablecoinOnly: Optional[bool] = Field(default=False, description="Only show stablecoin pools")
    limit: int = Field(default=15, description="Number of pools to return (1-30)")

class GetTopYieldsByChainInput(BaseModel):
    chain: str = Field(description="Blockchain name (e.g., 'Ethereum', 'Arbitrum', 'BSC')")
    limit: int = Field(default=10, description="Number of top pools to return")
    minTvl: Optional[float] = Field(default=50000, description="Minimum TVL in USD")

class GetYieldHistoryInput(BaseModel):
    poolId: str = Field(description="The pool ID from DeFiLlama")

class GetYieldStatsInput(BaseModel):
    topN: int = Field(default=10, description="Number of top chains to include")

class SearchPoolsByTokenInput(BaseModel):
    token: str = Field(description="Token symbol to search for (e.g., 'ETH', 'USDC')")
    limit: int = Field(default=10, description="Number of pools to return")
    minTvl: Optional[float] = Field(default=50000, description="Minimum TVL in USD")

class GetStablecoinYieldsInput(BaseModel):
    chain: Optional[str] = Field(default=None, description="Filter by blockchain")
    limit: int = Field(default=10, description="Number of pools to return")
    minTvl: Optional[float] = Field(default=100000, description="Minimum TVL in USD")


# ============================================================================
# Create tools that call MCP server
# ============================================================================

def create_yield_tools():
    """Create yield tools that call MCP server via HTTP."""
    return [
        StructuredTool.from_function(
            func=lambda chain=None, project=None, minTvl=100000, minApy=None, stablecoinOnly=False, limit=15: call_mcp_tool(
                "yield_get_yield_pools",
                {k: v for k, v in {"chain": chain, "project": project, "minTvl": minTvl, "minApy": minApy, "stablecoinOnly": stablecoinOnly, "limit": limit}.items() if v is not None}
            ),
            name="yield_get_yield_pools",
            description="Get yield farming pools with filtering. Use for general yield searches.",
            args_schema=GetYieldPoolsInput,
        ),
        StructuredTool.from_function(
            func=lambda chain, limit=10, minTvl=50000: call_mcp_tool(
                "yield_get_top_yields_by_chain",
                {"chain": chain, "limit": limit, "minTvl": minTvl}
            ),
            name="yield_get_top_yields_by_chain",
            description="Get top yield opportunities for a specific blockchain.",
            args_schema=GetTopYieldsByChainInput,
        ),
        StructuredTool.from_function(
            func=lambda poolId: call_mcp_tool("yield_get_yield_history", {"poolId": poolId}),
            name="yield_get_yield_history",
            description="Get historical APY data for a specific yield pool.",
            args_schema=GetYieldHistoryInput,
        ),
        StructuredTool.from_function(
            func=lambda topN=10: call_mcp_tool("yield_get_yield_stats", {"topN": topN}),
            name="yield_get_yield_stats",
            description="Get overall yield statistics and market overview.",
            args_schema=GetYieldStatsInput,
        ),
        StructuredTool.from_function(
            func=lambda token, limit=10, minTvl=50000: call_mcp_tool(
                "yield_search_pools_by_token",
                {"token": token, "limit": limit, "minTvl": minTvl}
            ),
            name="yield_search_pools_by_token",
            description="Search yield pools by token symbol (e.g., ETH, USDC).",
            args_schema=SearchPoolsByTokenInput,
        ),
        StructuredTool.from_function(
            func=lambda chain=None, limit=10, minTvl=100000: call_mcp_tool(
                "yield_get_stablecoin_yields",
                {k: v for k, v in {"chain": chain, "limit": limit, "minTvl": minTvl}.items() if v is not None}
            ),
            name="yield_get_stablecoin_yields",
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
    
    logger.info("yield_agent_tools", backend_tools=[t.name for t in tools], frontend_tools=[t.get("name") for t in fe_tools])
    
    model_with_tools = model.bind_tools(all_tools, parallel_tool_calls=False)
    
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
