import argparse
import asyncio
from functools import cache

from dotenv import load_dotenv

from ringkasai.runner.config_loader import load_config, prepare_runner_payload
from ringkasai.runner.registry import get_runner_registry
from ringkasai.runner.types import RunnerLike

load_dotenv()


class AgentRuntime:
    def __init__(self, config_path: str, agent_id: str):
        config = load_config(config_path)
        payload = prepare_runner_payload(config, agent_id)
        registry = get_runner_registry()
        self.runner: RunnerLike = registry.create(payload["runner_type"], payload)

    async def run(self, message: str, x_user_authorization: str):
        if not x_user_authorization:
            raise ValueError("x-user-authorization header is required.")
        return await self.runner.run(
            message=message,
            extra_headers={"x-user-authorization": x_user_authorization},
        )


@cache
def get_agent_runtime(config_path: str, agent_id: str) -> AgentRuntime:
    return AgentRuntime(config_path=config_path, agent_id=agent_id)


async def main():
    parser = argparse.ArgumentParser(description="Run a RingkasAI agent.")
    parser.add_argument(
        "--config",
        type=str,
        default="examples/config.json",
        help="Path to the configuration file.",
    )
    parser.add_argument(
        "--agent-id", type=str, required=True, help="The ID of the agent to run."
    )
    parser.add_argument(
        "--message", type=str, required=True, help="The message to send to the agent."
    )
    parser.add_argument(
        "--x-user-authorization",
        type=str,
        required=True,
        help="The x-user-authorization header value for the MCP request.",
    )
    args = parser.parse_args()

    agent_runtime = get_agent_runtime(args.config, args.agent_id)
    response = await agent_runtime.run(
        message=args.message, x_user_authorization=args.x_user_authorization
    )

    print(response)  # noqa: T201
    print(response.get("messages", [])[-1].content)  # noqa: T201


if __name__ == "__main__":
    asyncio.run(main())
