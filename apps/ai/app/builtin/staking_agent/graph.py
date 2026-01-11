"""
Staking Agent using LangChain MCP Adapters with CopilotKit integration.

This agent connects to the blockchain MCP server to perform staking-related
operations like building transactions, querying contracts, and submitting
signed transactions.
"""

import asyncio
import concurrent.futures
import os
from typing import List

from copilotkit import CopilotKitState
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import Command
from structlog import get_logger
from typing_extensions import Literal

load_dotenv()

logger = get_logger(__name__)

# Environment configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3008/mcp")

# System prompt for the staking agent
STAKING_SYSTEM_PROMPT = """You are an expert blockchain staking assistant.

Your capabilities include:
1. **Building Transactions**: Create transaction objects for staking operations
2. **Querying Contracts**: Read staking contract states, balances, and rewards
3. **Submitting Transactions**: Broadcast signed transactions to the blockchain
4. **Chain Information**: Provide details about supported blockchain networks

When helping users with staking:
1. First understand which chain they want to use
2. Help them prepare the correct transaction data
3. Build the transaction with proper parameters
4. Guide them through signing (they must sign with their wallet)
5. Submit the signed transaction

Important:
- Always confirm chain ID before building transactions
- Provide clear explanations of transaction parameters
- Warn users about gas costs and potential risks
- Never ask for private keys - transactions must be signed externally
"""


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
    """
    Returns True if none of the tool calls are frontend tools.
    """
    if not tool_calls:
        return False

    fe_tool_names = {tool.get("name") for tool in fe_tools}

    for tool_call in tool_calls:
        tool_name = (
            tool_call.get("name")
            if isinstance(tool_call, dict)
            else getattr(tool_call, "name", None)
        )
        if tool_name in fe_tool_names:
            return False

    return True


def load_tools_sync() -> list:
    """Load MCP tools synchronously."""
    client = MultiServerMCPClient(connections=get_mcp_client_config())

    async def _get_tools():
        async with client.session("blockchain") as session:
            return await load_mcp_tools(session)

    def run_in_thread():
        return asyncio.run(_get_tools())

    try:
        asyncio.get_running_loop()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_in_thread)
            return future.result()
    except RuntimeError:
        return asyncio.run(_get_tools())


def build_graph():
    """
    Build a LangGraph-compatible graph for the staking agent.
    This follows the CopilotKit pattern with proper state management.
    """
    # Load MCP tools
    tools = load_tools_sync()

    logger.info(
        "staking_graph_built",
        tool_count=len(tools),
        tool_names=[t.name for t in tools],
    )

    async def chat_node(
        state: AgentState, config: RunnableConfig
    ) -> Command[Literal["tool_node", "__end__"]]:
        """
        Standard chat node based on the ReAct design pattern.
        """
        # 1. Define the model
        model = init_chat_model("gpt-4o-mini")

        # 2. Bind the tools to the model (frontend + backend tools)
        fe_tools = state.get("copilotkit", {}).get("actions", [])
        model_with_tools = model.bind_tools([*fe_tools, *tools])

        # 3. Define the system message
        system_message = SystemMessage(content=STAKING_SYSTEM_PROMPT)

        # 4. Run the model to generate a response
        response = await model_with_tools.ainvoke(
            [system_message, *state["messages"]],
            config,
        )

        tool_calls = response.tool_calls
        if tool_calls and should_route_to_tool_node(tool_calls, fe_tools):
            return Command(goto="tool_node", update={"messages": response})

        # 5. No tool calls or frontend tools only, end the graph
        return Command(goto="__end__", update={"messages": response})

    # Define the workflow graph
    workflow = StateGraph(AgentState)
    workflow.add_node("chat_node", chat_node)
    workflow.add_node("tool_node", ToolNode(tools=tools))
    workflow.add_edge("tool_node", "chat_node")
    workflow.set_entry_point("chat_node")

    checkpointer = MemorySaver()
    return workflow.compile(checkpointer=checkpointer)


# Global graph instance
_graph = None


def get_graph():
    """Get or create the staking agent graph."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


# Initialize graph on module load
graph = get_graph()
