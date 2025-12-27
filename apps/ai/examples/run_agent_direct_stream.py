"""
Stream agent output directly from config without running the HTTP server.

Examples:
  python examples/run_agent_direct_stream.py --message "Explain Bitcoin for a 10yo"
  python examples/run_agent_direct_stream.py --agent-id application_agent_vn --message "Xin chao" --verbose
"""

import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from ringkasai.runner.config_loader import load_config, prepare_runner_payload
from ringkasai.runner.registry import get_runner_registry
from ringkasai.runner.types import RunnerLike

load_dotenv()


async def stream_once(
    config_path: Path,
    agent_id: str,
    message: str,
    conversation: list[dict[str, Any]],
    extra_headers: dict[str, str] | None,
    verbose: bool,
) -> None:
    config = load_config(str(config_path))
    payload = prepare_runner_payload(config, agent_id)
    runner_registry = get_runner_registry()
    runner: RunnerLike = runner_registry.create(payload["runner_type"], payload)
    headers = extra_headers or {}
    try:
        async for event in runner.stream(
            message=message, conversation=conversation, extra_headers=headers
        ):
            if verbose:
                print(event, flush=True)
                continue
            if isinstance(event, dict):
                if event.get("event") == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk", {})
                    content = chunk.get("content")
                    if content:
                        print(content, end="", flush=True)
            elif isinstance(event, str):
                print(event, end="", flush=True)
    finally:
        await runner.aclose()
        if not verbose:
            print()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Stream an agent response once without the server."
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
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print all stream events instead of only token content.",
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
    conversations = json.load(open("test_conversation.json"))
    conversations = conversations["messages"]
    await stream_once(
        config_path=args.config,
        agent_id=args.agent_id,
        message=args.message,
        conversation=conversations,
        extra_headers={
            "x-user-authorization": "replace-with-real-token",
        },
        verbose=args.verbose,
    )


if __name__ == "__main__":
    asyncio.run(main())
