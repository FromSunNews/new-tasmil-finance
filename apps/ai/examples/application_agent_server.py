import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from ringkasai.runner.config_loader import load_config, prepare_runner_payload
from ringkasai.runner.registry import get_runner_registry
from ringkasai.runner.types import RunnerLike

load_dotenv()

logger = logging.getLogger(__name__)

CONFIG_PATH = Path(__file__).parent / "config.json"
DEFAULT_AGENT_ID = "application_agent"
RUNNER_REGISTRY = get_runner_registry()


def _build_runner(config_path: Path, agent_id: str) -> RunnerLike:
    config = load_config(str(config_path))
    payload = prepare_runner_payload(config, agent_id)
    return RUNNER_REGISTRY.create(payload["runner_type"], payload)


class QueryRequest(BaseModel):
    message: str
    thread_id: str | None = None


_runner: RunnerLike = None
_runner_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _runner
    # Startup
    _runner = _build_runner(CONFIG_PATH, DEFAULT_AGENT_ID)
    logger.info("Runner initialized.")

    yield  # ---- application runs here ----

    # Shutdown
    if _runner:
        await _runner.aclose()
        logger.info("Runner closed.")


app = FastAPI(title="Application Agent Service", lifespan=lifespan)


async def get_runner() -> RunnerLike:
    return _runner


RUNNER_DEPENDENCY = Depends(get_runner)


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if isinstance(exc, httpx.HTTPStatusError):
        status_code = exc.response.status_code
        detail = exc.response.text or str(exc)
        raise HTTPException(status_code=status_code, detail=detail) from exc
    raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/agent/query")
async def query_agent(
    body: QueryRequest,
    x_user_authorization: str | None = Header(
        default=None, alias="x-user-authorization"
    ),
    x_end_user_id: str | None = Header(default=None, alias="x-end-user-id"),
    runner: RunnerLike = RUNNER_DEPENDENCY,
):
    extra_headers = {}
    if x_user_authorization:
        extra_headers["x-user-authorization"] = x_user_authorization
    if x_end_user_id:
        extra_headers["x-end-user-id"] = x_end_user_id
    try:
        async with _runner_lock:
            response = await runner.run(
                message=body.message,
                thread_id=body.thread_id,
                extra_headers=extra_headers,
            )
    except Exception as exc:
        _raise_http_error(exc)

    return {
        "response": response,
        "thread_id": response.get("thread_id") if isinstance(response, dict) else None,
        "run_id": response.get("run_id") if isinstance(response, dict) else None,
        "end_user_id": response.get("end_user_id")
        if isinstance(response, dict)
        else None,
        "final_message": response.get("messages", [])[-1].content
        if response.get("messages")
        else None,
    }


# serving
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8100)
