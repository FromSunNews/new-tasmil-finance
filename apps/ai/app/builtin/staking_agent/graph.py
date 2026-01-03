"""
Staking Agent using LangChain MCP Adapters.

This agent connects to the blockchain MCP server to perform staking-related
operations like building transactions, querying contracts, and submitting
signed transactions.

Reference: https://docs.langchain.com/oss/python/langchain/mcp
"""

import os
from typing import Any, TypedDict

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware, AgentState
from langchain.chat_models import init_chat_model
from langchain_core.messages import BaseMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.graph.message import add_messages
from langgraph.runtime import Runtime
from structlog import get_logger
from typing_extensions import Annotated

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

Available blockchain operations:
- build_transaction: Build a blockchain transaction for staking (deposit, withdraw, claim rewards)
- query_contract: Read staking contract data (staked amounts, rewards, APY)
- submit_transaction: Submit a signed transaction to the network
- get_supported_chains: List all supported blockchain networks

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


class StakingLoggingMiddleware(AgentMiddleware):
    """Middleware for logging staking agent operations."""

    def before_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        logger.info(
            "staking_agent_model_call",
            message_count=len(state["messages"]),
        )
        return None

    def after_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        last_message = state["messages"][-1]
        logger.info(
            "staking_agent_model_response",
            content_length=len(str(last_message.content)) if last_message.content else 0,
        )
        return None


class State(TypedDict):
    """State schema for the staking agent."""

    messages: Annotated[list[BaseMessage], add_messages]


def get_mcp_client_config() -> dict:
    """
    Get the MCP client configuration for connecting to the blockchain server.
    
    Returns:
        dict: Configuration dictionary for MultiServerMCPClient
    """
    return {
        "blockchain": {
            "url": MCP_SERVER_URL,
            "transport": "streamable_http",
            # Add headers if authentication is required
            # "headers": {
            #     "Authorization": f"Bearer {os.getenv('MCP_ACCESS_TOKEN', '')}",
            # },
        }
    }


async def create_staking_agent():
    """
    Create a staking agent with MCP tools loaded from the blockchain server.
    
    This function:
    1. Connects to the blockchain MCP server
    2. Loads available tools (build_transaction, query_contract, etc.)
    3. Creates an agent with those tools
    
    Returns:
        tuple: (agent, client) - The agent and MCP client (keep client alive during agent use)
    """
    # Initialize the LLM
    model = init_chat_model("gpt-4.1-mini")
    
    # Create MCP client
    client = MultiServerMCPClient(connections=get_mcp_client_config())
    
    # Load tools from the MCP server
    async with client.session("blockchain") as session:
        tools = await load_mcp_tools(session)
        
        logger.info(
            "staking_agent_tools_loaded",
            tool_count=len(tools),
            tool_names=[t.name for t in tools],
        )
        
        # Create the agent with MCP tools
        agent = create_agent(
            model=model,
            tools=tools,
            system_prompt=STAKING_SYSTEM_PROMPT,
            middleware=[StakingLoggingMiddleware()],
            state_schema=State,
        )
        
        return agent, client


# For direct usage without async context management
# This creates a simpler synchronous-style graph for LangGraph deployment
def build_graph():
    """
    Build a LangGraph-compatible graph for the staking agent.
    
    This is the main entry point for LangGraph deployments.
    Uses HTTP transport to connect to the MCP server.
    """
    from langchain_mcp_adapters.client import MultiServerMCPClient
    
    # Initialize the LLM
    model = init_chat_model("gpt-4.1-mini")
    
    # Create MCP client with HTTP transport (stateless, suitable for LangGraph)
    client = MultiServerMCPClient(connections=get_mcp_client_config())
    
    # Get tools synchronously for graph building
    # Note: In production, you may want to lazy-load tools or use a different pattern
    import asyncio
    
    async def _get_tools():
        async with client.session("blockchain") as session:
            return await load_mcp_tools(session)
    
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If running in an async context, we need to handle differently
            # This is a workaround for LangGraph's sync graph building
            import nest_asyncio
            nest_asyncio.apply()
            tools = loop.run_until_complete(_get_tools())
        else:
            tools = asyncio.run(_get_tools())
    except RuntimeError:
        tools = asyncio.run(_get_tools())
    
    logger.info(
        "staking_graph_built",
        tool_count=len(tools),
        tool_names=[t.name for t in tools],
    )
    
    # Create the agent graph
    graph = create_agent(
        model=model,
        tools=tools,
        system_prompt=STAKING_SYSTEM_PROMPT,
        middleware=[StakingLoggingMiddleware()],
        state_schema=State,
    )
    
    return graph


# Export the graph for LangGraph deployment
# Note: For production use, consider using the async create_staking_agent() 
# function with proper session management
graph = None  # Will be initialized on first use

def get_graph():
    """Get or create the staking agent graph."""
    global graph
    if graph is None:
        graph = build_graph()
    return graph


# Alternative: Simplified graph creation without MCP (for testing)
def create_simple_staking_agent():
    """
    Create a simple staking agent without MCP tools.
    Useful for testing the agent structure without MCP server dependency.
    """
    model = init_chat_model("gpt-4.1-mini")
    
    return create_agent(
        model=model,
        system_prompt=STAKING_SYSTEM_PROMPT,
        middleware=[StakingLoggingMiddleware()],
        state_schema=State,
    )

graph = get_graph()
