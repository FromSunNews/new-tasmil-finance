"""
Staking Agent using LangChain MCP Adapters with CopilotKit integration.

This agent connects to the blockchain MCP server to perform staking-related
operations. The frontend uses useRenderToolCall to render custom UI for each tool.
"""

import os

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

# Environment configuration
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3008/mcp")

# System prompt for the staking agent
STAKING_SYSTEM_PROMPT = """You are a U2U Network staking assistant (Chain ID: 39).

## Backend Tools (Read-only queries - call these directly):
- u2u_staking_get_user_stake(validatorID, delegatorAddress): Get user's staked amount
- u2u_staking_get_pending_rewards(validatorID, delegatorAddress): Get pending rewards
- u2u_staking_get_unlocked_stake(validatorID, delegatorAddress): Get unlocked stake amount
- u2u_staking_get_lockup_info(validatorID, delegatorAddress): Get lockup details
- u2u_staking_get_rewards_stash(validatorID, delegatorAddress): Get stashed rewards

## Frontend Tools (Wallet operations - these require user to sign transaction):
- u2u_staking_delegate(validatorID, amount): Stake tokens to a validator
- u2u_staking_undelegate(validatorID, amount, wrID?): Unstake tokens from a validator
- u2u_staking_claim_rewards(validatorID): Claim pending rewards
- u2u_staking_restake_rewards(validatorID): Compound rewards back to stake
- u2u_staking_lock_stake(validatorID, amount, lockupDuration): Lock stake for bonus rewards

IMPORTANT RULES:
1. DO NOT ask for chain ID - always use U2U Network (Chain ID: 39)
2. When user wants to stake, call u2u_staking_delegate IMMEDIATELY without any explanation first
3. When user wants to check stake/rewards, call the appropriate query tool
4. Call tools directly without asking unnecessary questions or explaining beforehand
5. If user says "stake 1 U2U to validator 1", call u2u_staking_delegate(validatorID="1", amount="1000000000000000000") immediately
6. Amount should be in wei (1 U2U = 10^18 wei)
7. validatorID should always be a string, not a number

## AFTER receiving a response from a wallet operation tool:
The tool will return a result with 'success' (true/false), 'hash' (if successful), and other details.

If success=true:
- Congratulate the user on the successful transaction
- Mention the transaction hash and provide the explorer link: https://u2uscan.xyz/tx/{hash}
- Summarize what was accomplished (e.g., "You have successfully staked 1 U2U to validator 1")

If success=false:
- Acknowledge the failure politely
- Explain what went wrong based on the error message
- Offer to help them try again if they want

Always respond in a friendly, helpful manner. Use natural language, not JSON or technical data dumps.
DO NOT explain what you're about to do before calling a tool - just call it directly."""


class AgentState(CopilotKitState):
    """State schema for the staking agent - inherits CopilotKit fields."""
    pass


def get_mcp_client_config() -> dict:
    """Get the MCP client configuration for connecting to the blockchain server."""
    return {
        "blockchain": {
            "url": MCP_SERVER_URL,
            "transport": "streamable_http",
        }
    }


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


# ============================================================================
# MCP Tool Wrapper - Call MCP server via HTTP instead of using async adapters
# ============================================================================

def call_mcp_tool(tool_name: str, arguments: dict) -> str:
    """Call an MCP tool via HTTP request using Streamable HTTP transport."""
    try:
        # MCP call_tool request
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
            
            # Handle SSE response or JSON response
            content_type = response.headers.get("content-type", "")
            
            if "text/event-stream" in content_type:
                # Parse SSE response
                lines = response.text.strip().split("\n")
                for line in lines:
                    if line.startswith("data:"):
                        data = line[5:].strip()
                        if data:
                            import json
                            result = json.loads(data)
                            if "result" in result:
                                content = result.get("result", {}).get("content", [])
                                if content and len(content) > 0:
                                    return content[0].get("text", str(result))
                return str(response.text)
            else:
                result = response.json()
                
                if "error" in result:
                    return f"Error: {result['error']}"
                
                # Extract content from MCP response
                content = result.get("result", {}).get("content", [])
                if content and len(content) > 0:
                    return content[0].get("text", str(result))
                return str(result.get("result", result))
            
    except Exception as e:
        logger.error("mcp_tool_call_failed", tool=tool_name, error=str(e))
        return f"Error calling {tool_name}: {str(e)}"


# ============================================================================
# Define Pydantic models for tool inputs (READ-ONLY tools only)
# Wallet operation tools are now handled by frontend with useCopilotAction
# ============================================================================

class GetUserStakeInput(BaseModel):
    validatorID: str = Field(description="The validator ID")
    delegatorAddress: str = Field(description="The delegator wallet address")

class GetPendingRewardsInput(BaseModel):
    validatorID: str = Field(description="The validator ID")
    delegatorAddress: str = Field(description="The delegator wallet address")

class GetUnlockedStakeInput(BaseModel):
    validatorID: str = Field(description="The validator ID")
    delegatorAddress: str = Field(description="The delegator wallet address")

class GetLockupInfoInput(BaseModel):
    validatorID: str = Field(description="The validator ID")
    delegatorAddress: str = Field(description="The delegator wallet address")

class GetRewardsStashInput(BaseModel):
    validatorID: str = Field(description="The validator ID")
    delegatorAddress: str = Field(description="The delegator wallet address")


# ============================================================================
# Create tools using StructuredTool (synchronous, serializable)
# Only READ-ONLY tools - wallet operations are handled by frontend
# ============================================================================

def create_staking_tools():
    """Create read-only staking tools that call MCP server via HTTP.
    
    Wallet operation tools (delegate, undelegate, claim_rewards, restake_rewards, lock_stake)
    are now handled by the frontend using useCopilotAction with renderAndWait pattern.
    This ensures transaction results are persisted in thread messages.
    """
    
    tools = [
        StructuredTool.from_function(
            func=lambda validatorID, delegatorAddress: call_mcp_tool("u2u_staking_get_user_stake", {"validatorID": validatorID, "delegatorAddress": delegatorAddress}),
            name="u2u_staking_get_user_stake",
            description="Get user's staked amount with a validator",
            args_schema=GetUserStakeInput,
        ),
        StructuredTool.from_function(
            func=lambda validatorID, delegatorAddress: call_mcp_tool("u2u_staking_get_pending_rewards", {"validatorID": validatorID, "delegatorAddress": delegatorAddress}),
            name="u2u_staking_get_pending_rewards",
            description="Get pending rewards for a delegator",
            args_schema=GetPendingRewardsInput,
        ),
        StructuredTool.from_function(
            func=lambda validatorID, delegatorAddress: call_mcp_tool("u2u_staking_get_unlocked_stake", {"validatorID": validatorID, "delegatorAddress": delegatorAddress}),
            name="u2u_staking_get_unlocked_stake",
            description="Get unlocked stake amount",
            args_schema=GetUnlockedStakeInput,
        ),
        StructuredTool.from_function(
            func=lambda validatorID, delegatorAddress: call_mcp_tool("u2u_staking_get_lockup_info", {"validatorID": validatorID, "delegatorAddress": delegatorAddress}),
            name="u2u_staking_get_lockup_info",
            description="Get lockup details for a delegator",
            args_schema=GetLockupInfoInput,
        ),
        StructuredTool.from_function(
            func=lambda validatorID, delegatorAddress: call_mcp_tool("u2u_staking_get_rewards_stash", {"validatorID": validatorID, "delegatorAddress": delegatorAddress}),
            name="u2u_staking_get_rewards_stash",
            description="Get stashed rewards for a delegator",
            args_schema=GetRewardsStashInput,
        ),
    ]
    
    return tools


# Create tools at module level (synchronous, no async issues)
tools = create_staking_tools()


async def chat_node(
    state: AgentState, config: RunnableConfig
) -> Command[Literal["tool_node", "__end__"]]:
    """Chat node based on the ReAct design pattern."""
    model = init_chat_model("gpt-4o-mini")
    
    logger.info("chat_node_start", message_count=len(state.get("messages", [])))
    
    # Get frontend tools from CopilotKit (wallet operations)
    fe_tools = state.get("copilotkit", {}).get("actions", [])
    
    # Combine backend tools (read-only) with frontend tools (wallet operations)
    # Frontend tools are defined via useCopilotAction in the React app
    all_tools = tools + fe_tools
    
    # Bind all tools to model so it knows about both backend and frontend tools
    model_with_tools = model.bind_tools(all_tools)
    
    # Build messages with system prompt
    system_message = SystemMessage(content=STAKING_SYSTEM_PROMPT)
    
    # Get model response
    response = await model_with_tools.ainvoke(
        [system_message, *state.get("messages", [])],
        config,
    )
    
    # Route to tool_node only for backend tools (read-only queries)
    # Frontend tools (wallet operations) are handled by CopilotKit on the client
    tool_calls = response.tool_calls
    if tool_calls and should_route_to_tool_node(tool_calls, fe_tools):
        logger.info("routing_to_tool_node", tool_count=len(tool_calls))
        return Command(goto="tool_node", update={"messages": response})
    
    # Either no tool calls, or frontend tool calls (handled by CopilotKit)
    return Command(goto="__end__", update={"messages": response})


def build_graph():
    """Build the staking agent graph."""
    workflow = StateGraph(AgentState)
    
    workflow.add_node("chat_node", chat_node)
    workflow.add_node("tool_node", ToolNode(tools=tools))
    workflow.add_edge("tool_node", "chat_node")
    workflow.set_entry_point("chat_node")
    
    checkpointer = MemorySaver()
    compiled = workflow.compile(checkpointer=checkpointer)
    compiled.name = "StakingAgent"
    
    logger.info("staking_graph_built", tool_count=len(tools))
    return compiled


# Build graph at module level
graph = build_graph()


def get_graph():
    """Get the staking agent graph."""
    return graph
