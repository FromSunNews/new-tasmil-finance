"""Staking Agent with MCP Tools and Generative UI."""

import ast
import json
import os
from typing import Literal, Sequence, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.messages import BaseMessage, ToolMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message
from structlog import get_logger
from typing_extensions import Annotated

load_dotenv()
logger = get_logger(__name__)

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3008/mcp")

# Tool → UI Component mapping
TOOL_UI_MAP = {
    "u2u_staking_delegate": "staking-operation-result",
    "u2u_staking_undelegate": "staking-operation-result",
    "u2u_staking_claim_rewards": "staking-operation-result",
    "u2u_staking_restake_rewards": "staking-operation-result",
    "u2u_staking_lock_stake": "staking-operation-result",
    "u2u_staking_get_user_stake": "staking-result",
    "u2u_staking_get_unlocked_stake": "staking-result",
    "u2u_staking_get_pending_rewards": "staking-result",
    "u2u_staking_get_rewards_stash": "staking-result",
    "u2u_staking_get_lockup_info": "staking-result",
}

SYSTEM_PROMPT = """You are a U2U Network staking assistant (Chain ID: 39).

Tools:
- u2u_staking_delegate(validatorID, amount): Stake tokens
- u2u_staking_undelegate(validatorID, amount): Unstake tokens  
- u2u_staking_claim_rewards(validatorID): Claim rewards
- u2u_staking_restake_rewards(validatorID): Compound rewards
- u2u_staking_lock_stake(validatorID, amount, lockupDuration): Lock stake
- u2u_staking_get_user_stake(validatorID, delegatorAddress): Get staked amount
- u2u_staking_get_pending_rewards(validatorID, delegatorAddress): Get rewards

Rules: Don't ask for chain ID. Call tools immediately with available info."""


class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]


def parse_mcp_result(result: str) -> dict:
    """Parse MCP tool result: [{'type': 'text', 'text': '{...}'}] → dict"""
    try:
        return json.loads(result)
    except:
        pass
    try:
        parsed = ast.literal_eval(result)
        if isinstance(parsed, list) and parsed and 'text' in parsed[0]:
            return json.loads(parsed[0]['text'])
    except:
        pass
    return {"success": True, "message": str(result)}


def filter_messages_for_openai(messages: list[BaseMessage]) -> list[BaseMessage]:
    """Filter and reorder messages to comply with OpenAI's tool message requirements.
    
    OpenAI requires:
    1. Tool messages must have a preceding AI message with matching tool_calls
    2. Tool messages should follow immediately after the AI message with tool_calls
    3. ALL tool_calls in an AI message must have corresponding tool responses
    
    This handles injected tool messages (like staking-transaction-result) that were
    added externally without a corresponding tool_call.
    """
    # First pass: collect all tool messages by tool_call_id
    tool_msgs_by_id = {}
    for msg in messages:
        if isinstance(msg, ToolMessage):
            tc_id = msg.tool_call_id
            if tc_id not in tool_msgs_by_id:
                tool_msgs_by_id[tc_id] = msg
    
    # Second pass: build filtered list
    filtered = []
    used_tool_call_ids = set()
    
    for msg in messages:
        if isinstance(msg, ToolMessage):
            # Skip - we'll add tool messages right after their AI message
            continue
        
        filtered.append(msg)
        
        # If this is an AI message with tool_calls, add corresponding tool responses
        if hasattr(msg, 'tool_calls') and msg.tool_calls:
            for tc in msg.tool_calls:
                tc_id = tc.get('id')
                if tc_id and tc_id in tool_msgs_by_id and tc_id not in used_tool_call_ids:
                    filtered.append(tool_msgs_by_id[tc_id])
                    used_tool_call_ids.add(tc_id)
                elif tc_id and tc_id not in tool_msgs_by_id:
                    # Missing tool response - this AI message's tool_calls are incomplete
                    # Remove this AI message and skip its tool_calls
                    filtered.pop()
                    logger.warning("removing_ai_message_with_missing_tool_response", 
                                 tool_call_id=tc_id)
                    break
    
    return filtered


async def agent_node(state: State) -> dict:
    """Agent node: call model, execute tools, emit UI."""
    model = init_chat_model("gpt-4.1-mini")
    mcp = MultiServerMCPClient({"blockchain": {"url": MCP_SERVER_URL, "transport": "streamable_http"}})
    
    # Filter and reorder messages to comply with OpenAI API requirements
    filtered_messages = filter_messages_for_openai(state["messages"])
    
    async with mcp.session("blockchain") as session:
        tools = await load_mcp_tools(session)
        response = await model.bind_tools(tools).ainvoke([
            {"role": "system", "content": SYSTEM_PROMPT},
            *filtered_messages
        ])
        
        messages = [response]
        
        for tc in response.tool_calls or []:
            tool = next((t for t in tools if t.name == tc["name"]), None)
            if not tool:
                continue
                
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"], name=tc["name"]))
                
                # Emit UI
                if ui_name := TOOL_UI_MAP.get(tc["name"]):
                    push_ui_message(ui_name, {
                        "result": parse_mcp_result(str(result)),
                        "toolType": f"tool-{tc['name']}"
                    }, message=response)
            except Exception as e:
                logger.error("tool_error", tool=tc["name"], error=str(e))
                messages.append(ToolMessage(content=json.dumps({"success": False, "error": str(e)}), tool_call_id=tc["id"], name=tc["name"]))
        
        return {"messages": messages}


def should_continue(state: State) -> Literal["agent", "end"]:
    last = state["messages"][-1]
    if isinstance(last, ToolMessage) or getattr(last, "tool_calls", None):
        return "agent"
    return "end"


def build_graph():
    g = StateGraph(State)
    g.add_node("agent", agent_node)
    g.add_edge("__start__", "agent")
    g.add_conditional_edges("agent", should_continue, {"agent": "agent", "end": END})
    compiled = g.compile()
    compiled.name = "StakingAgent"
    return compiled


graph = build_graph()
