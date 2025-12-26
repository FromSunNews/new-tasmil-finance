import asyncio
import os

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_litellm.chat_models import ChatLiteLLM
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools

load_dotenv()

# Read the JWT access token
access_token = open("creds/token_user-1-id.txt").read().strip()
user_access_token = open("creds/user_ca_access_token.txt").read().strip()
# openai_api_key = os.getenv("OPENAI_API_KEY")
openai_api_key = os.getenv("LLM_PROXY_API_KEY")
llm_proxy_url = os.getenv("LLM_PROXY_URL")


async def main():
    client = MultiServerMCPClient(
        connections={
            "application": {
                # Make sure you start your application server on port 8000
                "url": "http://localhost:8000/mcp",
                "transport": "streamable_http",
                "headers": {
                    # JWT token for MCP server authentication (RS256)
                    "Authorization": f"Bearer {access_token}",
                    # User authorization header for backend API calls
                    "x-user-authorization": f"Bearer {user_access_token}",
                    # User ID for permission checking
                    "x-user-id": "user-1-id",
                },
            }
        }
    )
    async with client.session("application") as session:
        tools = await load_mcp_tools(session)
        print(tools)
        model = ChatLiteLLM(
            model="gpt-4.1-nano", api_key=openai_api_key, api_base=llm_proxy_url
        )
        agent = create_agent(model, tools)
        weather_response = await agent.ainvoke(
            {"messages": "Check my missing application status"}
        )
        print(weather_response)


if __name__ == "__main__":
    asyncio.run(main())
