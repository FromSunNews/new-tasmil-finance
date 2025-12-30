"""
Run an agent directly from the config without starting the HTTP server.

Usage:
  python examples/run_agent_direct.py --message "Explain Bitcoin for a 10 year old"
  python examples/run_agent_direct.py --agent-id application_agent --message "Hello"
"""

import argparse
import asyncio
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from ringkasai.runner.config_loader import load_config, prepare_runner_payload
from ringkasai.runner.registry import get_runner_registry
from ringkasai.runner.types import RunnerLike

load_dotenv()


async def run_once(
    config_path: Path, agent_id: str, message: str, extra_headers: dict[str, str] | None
) -> dict[str, Any]:
    config = load_config(str(config_path))
    payload = prepare_runner_payload(config, agent_id)
    runner_registry = get_runner_registry()
    runner: RunnerLike = runner_registry.create(payload["runner_type"], payload)
    headers = extra_headers or {}
    try:
        return await runner.run(message=message, extra_headers=headers)
    finally:
        await runner.aclose()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run an agent once without the server."
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("examples/config.json"),
        help="Path to the agent config JSON file.",
    )
    parser.add_argument(
        "--agent-id",
        type=str,
        default="application_agent",
        help="Agent ID to use from the config file.",
    )
    parser.add_argument(
        "--message",
        type=str,
        required=True,
        help="User message to send to the agent.",
    )
    parser.add_argument(
        "--header",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Optional extra headers, can be provided multiple times.",
    )
    return parser.parse_args()


def parse_headers(header_items: list[str]) -> dict[str, str]:
    headers: dict[str, str] = {}
    for item in header_items:
        if "=" not in item:
            raise ValueError(f"Invalid header format (expected KEY=VALUE): {item}")
        key, value = item.split("=", 1)
        headers[key] = value
    return headers


async def main() -> None:
    args = parse_args()
    headers = parse_headers(args.header)
    response = await run_once(
        config_path=args.config,
        agent_id=args.agent_id,
        message=args.message,
        extra_headers=headers,
    )

    messages = response.get("messages", [])
    if messages:
        print(messages[-1].content)
    else:
        print(response)


if __name__ == "__main__":
    asyncio.run(main())
