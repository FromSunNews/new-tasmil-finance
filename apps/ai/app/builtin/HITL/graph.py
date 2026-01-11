from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware 
from langchain_core.tools import tool
from typing import Optional
from langgraph.graph.ui import UIMessage



@tool
def execute_sql_tool(query: str) -> str:
    """Execute a SQL query.
    
    Args:
        query: The SQL query to execute
    Returns:
        The result of the SQL query execution
    """
    # This is a placeholder implementation
    # In production, you would connect to an actual database
    return f"SQL query executed: {query}"


graph = create_agent(
    model="gpt-4o",
    system_prompt="You are a very very funny assistant",
    tools=[execute_sql_tool],
    middleware=[
        HumanInTheLoopMiddleware( 
            interrupt_on={
                "execute_sql": {"allowed_decisions": ["approve", "reject"]},  # No editing allowed
                "execute_sql_tool": {"allowed_decisions": ["approve", "reject"]},  # No editing allowed
            },
            # Prefix for interrupt messages - combined with tool name and args to form the full message
            # e.g., "Tool execution pending approval: execute_sql with query='DELETE FROM...'"
            # Individual tools can override this by specifying a "description" in their interrupt config
            description_prefix="Tool execution pending approval",
        ),
    ],
    # Human-in-the-loop requires checkpointing to handle interrupts.
    # In production, use a persistent checkpointer like AsyncPostgresSaver.
)