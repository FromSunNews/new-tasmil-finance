"""
Bridge Agent - Cross-chain token bridging using Owlto Bridge.

This agent helps users bridge tokens between different blockchains,
with a focus on U2U Network.
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

# Owlto Bridge API
OWLTO_API_BASE = "https://owlto.finance/api/v1"

BRIDGE_SYSTEM_PROMPT = """You are a cross-chain bridge assistant for Owlto Bridge.

## CRITICAL RULE - ALWAYS USE TOOLS:
You MUST call tools for ANY user question. NEVER respond with general knowledge.
- User asks about bridges/routes → CALL get_bridge_pairs IMMEDIATELY
- User asks about chains → CALL get_supported_chains IMMEDIATELY
- User asks about fees/quote → CALL get_bridge_quote IMMEDIATELY

DO NOT explain what you're about to do. Just call the tool directly.

## Available Tools:
1. get_bridge_pairs() - Get all available bridge routes
2. get_bridge_quote(token_name, from_chain, to_chain, amount) - Get quote with fees
3. get_supported_chains() - Get list of supported blockchains

## Supported Chains:
- U2USolarisMainnet, EthereumMainnet, BnbMainnet, ArbitrumOneMainnet
- OptimismMainnet, PolygonMainnet, AvalancheMainnet, BaseMainnet, LineaMainnet

## Tool Selection:
- "What can I bridge?" / "Available routes" → get_bridge_pairs()
- "What chains?" / "Supported networks" → get_supported_chains()
- "Bridge X from A to B" / "How much to bridge?" → get_bridge_quote(token, from, to, amount)

## Rules:
- Call tools IMMEDIATELY without explanation
- NEVER make up bridge data - always use tools
- After getting results, summarize clearly
- Warn about irreversible transactions"""


class AgentState(CopilotKitState):
    """State schema for the bridge agent."""
    pass


# ============================================================================
# Pydantic models for tool inputs
# ============================================================================

class GetBridgePairsInput(BaseModel):
    """Input for getting bridge pairs."""
    pass

class GetBridgeQuoteInput(BaseModel):
    token_name: str = Field(description="Token symbol to bridge (e.g., 'USDT', 'USDC', 'U2U')")
    from_chain: str = Field(description="Source chain name (e.g., 'EthereumMainnet', 'U2USolarisMainnet')")
    to_chain: str = Field(description="Destination chain name")
    amount: str = Field(description="Amount to bridge (e.g., '100', '1.5')")

class GetSupportedChainsInput(BaseModel):
    """Input for getting supported chains."""
    pass


# ============================================================================
# Bridge Tools Implementation - Returns JSON for UI rendering
# ============================================================================

DEFAULT_PROVIDER_URLS = {
    "EthereumMainnet": "wss://ethereum-rpc.publicnode.com",
    "U2USolarisMainnet": "https://rpc-mainnet.u2u.xyz",
    "AvalancheMainnet": "wss://0xrpc.io/avax",
    "BnbMainnet": "wss://bsc-rpc.publicnode.com",
    "ArbitrumOneMainnet": "wss://arbitrum-one-rpc.publicnode.com",
    "OptimismMainnet": "https://endpoints.omniatech.io/v1/op/mainnet/public",
    "LineaMainnet": "https://linea.therpc.io",
    "PolygonMainnet": "wss://polygon-bor-rpc.publicnode.com",
    "BaseMainnet": "wss://base-rpc.publicnode.com",
}


def get_bridge_pairs() -> str:
    """Get all available bridge pairs for cross-chain transfers."""
    try:
        logger.info("get_bridge_pairs called")
        
        # Return mock data for now - in production, call Owlto API
        pairs = [
            {
                "tokenName": "USDT",
                "fromChainName": "U2USolarisMainnet",
                "toChainName": "EthereumMainnet",
                "minValue": {"uiValue": "10 USDT", "value": "10"},
                "maxValue": {"uiValue": "100,000 USDT", "value": "100000"},
            },
            {
                "tokenName": "USDT",
                "fromChainName": "EthereumMainnet",
                "toChainName": "U2USolarisMainnet",
                "minValue": {"uiValue": "10 USDT", "value": "10"},
                "maxValue": {"uiValue": "100,000 USDT", "value": "100000"},
            },
            {
                "tokenName": "USDC",
                "fromChainName": "U2USolarisMainnet",
                "toChainName": "BnbMainnet",
                "minValue": {"uiValue": "10 USDC", "value": "10"},
                "maxValue": {"uiValue": "100,000 USDC", "value": "100000"},
            },
            {
                "tokenName": "U2U",
                "fromChainName": "U2USolarisMainnet",
                "toChainName": "EthereumMainnet",
                "minValue": {"uiValue": "1 U2U", "value": "1"},
                "maxValue": {"uiValue": "10,000 U2U", "value": "10000"},
            },
            {
                "tokenName": "ETH",
                "fromChainName": "EthereumMainnet",
                "toChainName": "ArbitrumOneMainnet",
                "minValue": {"uiValue": "0.01 ETH", "value": "0.01"},
                "maxValue": {"uiValue": "100 ETH", "value": "100"},
            },
            {
                "tokenName": "ETH",
                "fromChainName": "ArbitrumOneMainnet",
                "toChainName": "OptimismMainnet",
                "minValue": {"uiValue": "0.01 ETH", "value": "0.01"},
                "maxValue": {"uiValue": "100 ETH", "value": "100"},
            },
        ]
        
        return json.dumps({
            "success": True,
            "totalPairs": len(pairs),
            "pairs": pairs
        })
        
    except Exception as e:
        logger.error("get_bridge_pairs_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_bridge_quote(token_name: str, from_chain: str, to_chain: str, amount: str) -> str:
    """Get a quote for bridging tokens between chains."""
    try:
        logger.info("get_bridge_quote called", token=token_name, from_chain=from_chain, to_chain=to_chain, amount=amount)
        
        amount_num = float(amount)
        if amount_num <= 0:
            return json.dumps({"success": False, "error": "Invalid amount. Please provide a valid amount greater than 0."})
        
        # Mock quote - in production, call Owlto API
        estimated_fee = amount_num * 0.001  # 0.1% fee
        
        return json.dumps({
            "success": True,
            "quote": {
                "tokenName": token_name,
                "fromChain": from_chain,
                "toChain": to_chain,
                "amount": amount,
                "amountFormatted": f"{amount} {token_name}",
                "estimatedFee": estimated_fee,
                "estimatedFeeFormatted": f"~{estimated_fee:.4f} {token_name}",
                "estimatedTime": "~30 seconds",
                "minAmount": "10",
                "maxAmount": "100000",
            }
        })
        
    except Exception as e:
        logger.error("get_bridge_quote_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def get_supported_chains() -> str:
    """Get list of supported chains for bridging."""
    try:
        logger.info("get_supported_chains called")
        
        chains = [
            {"name": chain, "displayName": chain.replace("Mainnet", "").replace("Solaris", "")}
            for chain in DEFAULT_PROVIDER_URLS.keys()
        ]
        
        return json.dumps({
            "success": True,
            "totalChains": len(chains),
            "chains": chains
        })
        
    except Exception as e:
        logger.error("get_supported_chains_failed", error=str(e))
        return json.dumps({"success": False, "error": str(e)})


def create_bridge_tools():
    """Create bridge tools."""
    return [
        StructuredTool.from_function(
            func=lambda: get_bridge_pairs(),
            name="get_bridge_pairs",
            description="Get all available bridge pairs for cross-chain transfers. Use when users ask about available bridges or supported routes.",
            args_schema=GetBridgePairsInput,
        ),
        StructuredTool.from_function(
            func=lambda token_name, from_chain, to_chain, amount: get_bridge_quote(token_name, from_chain, to_chain, amount),
            name="get_bridge_quote",
            description="Get a quote for bridging tokens between chains. Shows estimated fees and amounts.",
            args_schema=GetBridgeQuoteInput,
        ),
        StructuredTool.from_function(
            func=lambda: get_supported_chains(),
            name="get_supported_chains",
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
    
    logger.info("bridge_chat_node_start", message_count=len(state.get("messages", [])))
    
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
    model_with_tools = model.bind_tools(all_tools, parallel_tool_calls=False)
    
    # Build system prompt with context
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
