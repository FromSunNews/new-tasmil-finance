"""Example demonstrating MCP client integration with RingkasAI agents."""

import asyncio
import json
import os

from dotenv import load_dotenv

from ringkasai import (
    AgentConfig,
    CoreAgentRegistry,
    CoreAgentType,
    MCPResourceConfig,
    MCPServersConfig,
)
from ringkasai.config import LLMConfig

load_dotenv()

server_secret = open("creds/token_user-1-id.txt").read().strip()
user_secret = open("creds/user_ca_access_token.txt").read().strip()
user_id = "user-1-id"


async def main() -> None:
    """Demonstrate MCP client usage with agents."""
    mcp_config = MCPServersConfig.from_dict(
        {
            "mcp_servers": {
                "sequential-thinking": {
                    "url": "http://localhost:8001",
                    "description": "A tool for sequential thinking.",
                },
            }
        }
    )

    agent_config = AgentConfig(
        agent_id="application_agent",
        core_agent_type=CoreAgentType.REACT,
        system_prompt="You are a helpful assistant.",
        resources=[
            MCPResourceConfig(
                resource_id="application_tools",
                mcp_server_name="application_tools",
                mcp_url="http://localhost:8001",
                server_secret=server_secret,
                user_secret=user_secret,
                user_id=user_id,
            )
        ],
        llm_config=LLMConfig(
            model="gpt-4.1-nano",
            temperature=0.0,
            api_key=os.getenv("LLM_PROXY_API_KEY"),
            api_base=os.getenv("LLM_PROXY_URL"),
        ),
    )

    registry = CoreAgentRegistry.default()
    agent = agent_config.instantiate(registry)

    from ringkasai.structure.builder import StructureBuilder

    structure = StructureBuilder(agent).assemble()
    print("structure")
    print(json.dumps(structure, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
