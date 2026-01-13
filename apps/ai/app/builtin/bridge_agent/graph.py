"""
Bridge Agent - Cross-chain token bridging via MCP.

This agent helps users bridge tokens between different blockchains
by calling MCP tools.
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
from typing_extensions import Literal

load_dotenv()

logger = get_logger(__name__)

# MCP Server URL
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3008/mcp")

BRIDGE_SYSTEM_PROMPT = """You are a cross-chain bridge assistant for Owlto Bridge.

## CRITICAL RULE - ALWAYS USE TOOLS:
You MUST call tools for ANY user question. NEVER respond with general knowledge.
- User asks about bridges/routes → CALL bridge_get_bridge_pairs IMMEDIATELY
- User asks about chains → CALL bridge_get_supported_chains IMMEDIATELY
- User asks about fees/quote → CALL bridge_get_bridge_quote IMMEDIATELY

DO NOT explain what you're about to do. Just call the tool directly.

## Available Tools:
1. bridge_get_bridge_pairs() - Get all available bridge routes
2. bridge_get_bridge_quote(tokenName, fromChain, toChain, amount) - Get quote with fees
3. bridge_get_supported_chains() - Get list of supported blockchains

## Supported Chains:
- U2USolarisMainnet, EthereumMainnet, BnbMainnet, ArbitrumOneMainnet
- OptimismMainnet, PolygonMainnet, AvalancheMainnet, BaseMainnet, LineaMainnet

## Tool Selection:
- "What can I bridge?" / "Available routes" → bridge_get_bridge_pairs()
- "What chains?" / "Supported networks" → bridge_get_supported_chains()
- "Bridge X from A to B" / "How much to bridge?" → bridge_get_bridge_quote(token, from, to, amount)

## Rules:
- Call tools IMMEDIATELY without explanation
- NEVER make up bridge data - always use tools
- After getting results, summarize clearly
- Warn about irreversible transactions"""


class AgentState(CopilotKitState):
    """State schema for the bridge agent."""
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

class GetBridgePairsInput(BaseModel):
    """Input for getting bridge pairs."""
    pass

class GetBridgeQuoteInput(BaseModel):
    tokenName: str = Field(description="Token symbol to bridge (e.g., 'USDT', 'USDC', 'U2U')")
    fromChain: str = Field(description="Source chain name (e.g., 'EthereumMainnet', 'U2USolarisMainnet')")
    toChain: str = Field(description="Destination chain name")
    amount: str = Field(description="Amount to bridge (e.g., '100', '1.5')")

class GetSupportedChainsInput(BaseModel):
    """Input for getting supported chains."""
    pass


# ============================================================================
# Create tools that call MCP server
# ============================================================================

def create_bridge_tools():
    """Create bridge tools that call MCP server via HTTP."""
    return [
        StructuredTool.from_function(
            func=lambda: call_mcp_tool("bridge_get_bridge_pairs", {}),
            name="bridge_get_bridge_pairs",
            description="Get all available bridge pairs for cross-chain transfers. Use when users ask about available bridges or supported routes.",
            args_schema=GetBridgePairsInput,
        ),
        StructuredTool.from_function(
            func=lambda tokenName, fromChain, toChain, amount: call_mcp_tool(
                "bridge_get_bridge_quote",
                {"tokenName": tokenName, "fromChain": fromChain, "toChain": toChain, "amount": amount}
            ),
            name="bridge_get_bridge_quote",
            description="Get a quote for bridging tokens between chains. Shows estimated fees and amounts.",
            args_schema=GetBridgeQuoteInput,
        ),
        StructuredTool.from_function(
            func=lambda: call_mcp_tool("bridge_get_supported_chains", {}),
            name="bridge_get_supported_chains",
            description="Get list of supported chains for bridging.",
            args_schema=GetSupportedChainsInput,
        ),
    ]


tools = create_bridge_tools()


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
    """Chat node for bridge agent."""
    model = init_chat_model("gpt-4o-mini")
    
    logger.info("=== BRIDGE AGENT chat_node called ===", message_count=len(state.get("messages", [])))
    
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
    
    logger.info("bridge_agent_tools", backend_tools=[t.name for t in tools], frontend_tools=[t.get("name") for t in fe_tools])
    
    model_with_tools = model.bind_tools(all_tools, parallel_tool_calls=False)
    
    system_content = BRIDGE_SYSTEM_PROMPT
    if context_str:
        system_content = f"{BRIDGE_SYSTEM_PROMPT}\n\n## CURRENT CONTEXT:\n{context_str}"
    
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
    """Build the bridge agent graph."""
    workflow = StateGraph(AgentState)
    
    workflow.add_node("chat_node", chat_node)
    workflow.add_node("tool_node", ToolNode(tools=tools))
    workflow.add_edge("tool_node", "chat_node")
    workflow.set_entry_point("chat_node")
    
    checkpointer = MemorySaver()
    compiled = workflow.compile(checkpointer=checkpointer)
    compiled.name = "BridgeAgent"
    
    logger.info("bridge_graph_built", tool_count=len(tools))
    return compiled


graph = build_graph()


def get_graph():
    """Get the bridge agent graph."""
    return graph
