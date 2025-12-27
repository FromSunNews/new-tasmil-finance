import asyncio
import json
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.responses import StreamingResponse

from ringkasai.runner.config_loader import load_config, prepare_runner_payload
from ringkasai.runner.registry import get_runner_registry
from ringkasai.runner.types import RunnerLike

load_dotenv()

CONFIG_PATH = Path(__file__).parent / "config.json"
DEFAULT_AGENT_ID = "application_agent"
RUNNER_REGISTRY = get_runner_registry()


def _build_runner(config_path: Path, agent_id: str) -> RunnerLike:
    config = load_config(str(config_path))
    payload = prepare_runner_payload(config, agent_id)
    return RUNNER_REGISTRY.create(payload["runner_type"], payload)


def _format_sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


_runner: RunnerLike | None = None
_runner_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _runner
    _runner = _build_runner(CONFIG_PATH, DEFAULT_AGENT_ID)
    print("Runner initialized.")
    try:
        yield
    finally:
        if _runner:
            await _runner.aclose()
            print("Runner closed.")


app = FastAPI(title="Application Agent Streaming Service", lifespan=lifespan)


async def get_runner() -> RunnerLike:
    return _runner


RUNNER_DEPENDENCY = Depends(get_runner)


@app.get("/agent/stream")
async def stream_agent(message: str, runner: RunnerLike = RUNNER_DEPENDENCY):
    async def event_generator():
        if runner is None or not hasattr(runner, "stream"):
            yield _format_sse(
                "error", {"message": "Runner does not support streaming."}
            )
            return

        async with _runner_lock:
            stream = runner.stream(message=message, extra_headers=None)
            iterator = stream.__aiter__()
            while True:
                try:
                    chunk = await asyncio.wait_for(iterator.__anext__(), timeout=10)
                    yield _format_sse("data", chunk)
                except TimeoutError:
                    yield _format_sse("ping", {"message": "heartbeat"})
                    continue
                except StopAsyncIteration:
                    yield _format_sse("event", {"status": "completed"})
                    break
                except Exception as exc:
                    yield _format_sse("error", {"message": str(exc)})
                    break

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# Serving
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8100)
