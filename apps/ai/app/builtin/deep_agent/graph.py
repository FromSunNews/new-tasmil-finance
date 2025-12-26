from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware, AgentState
from langgraph.runtime import Runtime
from typing import Any, TypedDict
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from typing_extensions import Annotated
# System prompt to steer the agent to be an expert researcher
research_instructions = """You are a helpful assistant.
"""
from langchain.chat_models import init_chat_model
import os
from structlog import get_logger

logger = get_logger(__name__)
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

model = init_chat_model("gpt-4.1-mini")

class LoggingMiddleware(AgentMiddleware):
    def before_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        logger.info(f"About to call model with {len(state['messages'])} messages")
        return None

    def after_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        logger.info(f"Model returned: {state['messages'][-1].content}")
        return None

class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

graph = create_agent(
    system_prompt=research_instructions,
    model=model,
    middleware=[LoggingMiddleware()],
    state_schema=State
)   