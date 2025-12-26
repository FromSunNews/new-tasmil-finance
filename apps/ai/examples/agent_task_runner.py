import asyncio
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from ringkasai.runner.config_loader import load_config, prepare_runner_payload
from ringkasai.runner.registry import get_runner_registry
from ringkasai.runner.types import RunnerLike

load_dotenv()


async def run_task_with_agent(
    config: dict[str, Any],
    agent_id: str,
    task_message: str,
    extra_headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    payload = prepare_runner_payload(config, agent_id)
    runner_registry = get_runner_registry()
    runner: RunnerLike = runner_registry.create(payload["runner_type"], payload)
    headers = extra_headers or {}
    try:
        return await runner.run(message=task_message, extra_headers=headers)
    finally:
        await runner.aclose()


async def main() -> None:
    config_path = Path("examples/config.json")
    agent_id = "application_agent_vn"
    task_message = "Summarize the last three customer tickets."
    config = load_config(str(config_path))

    response = await run_task_with_agent(
        config=config,
        agent_id=agent_id,
        task_message=task_message,
        extra_headers={"x-user-authorization": "replace-with-real-token"},
    )

    messages = response.get("messages", [])
    if messages:
        print(messages[-1].content)  # noqa: T201
    else:
        print(response)  # noqa: T201


if __name__ == "__main__":
    asyncio.run(main())
