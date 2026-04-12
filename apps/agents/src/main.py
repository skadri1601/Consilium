import logging
import platform
import socket
import sys
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import posthog
import sentry_sdk
from starlette.middleware.base import BaseHTTPMiddleware

from src.features.council import council_router
from src.features.agents import agents_router
from src.features.streaming import streaming_router
from src.features.health import health_router
from src.features.debates import debates_router
from src.features.deliberation.router import router as deliberation_router
from src.features.mcp_http.router import router as mcp_http_router

from src.shared.config import settings
from src.shared.database.redis import redis_client

logger = logging.getLogger(__name__)

API_V1_PREFIX = "/api/v1"

if sys.platform == "win32":
    import asyncio

    _selector_policy = getattr(asyncio, "WindowsSelectorEventLoopPolicy", None)
    if _selector_policy is not None:
        asyncio.set_event_loop_policy(_selector_policy())


def _get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "unknown"


if settings.posthog_api_key:
    posthog.project_api_key = settings.posthog_api_key
    posthog.host = settings.posthog_host

if settings.sentry_dsn and "xxx" not in settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=1.0,
        environment=settings.app_env,
        send_default_pii=False,
        attach_stacktrace=True,
        include_local_variables=False,
        max_breadcrumbs=50,
        server_name=socket.gethostname(),
    )

    sentry_sdk.set_context("system", {
        "hostname": socket.gethostname(),
        "os": f"{platform.system()} {platform.release()}",
        "python_version": platform.python_version(),
        "arch": platform.machine(),
        "ip": _get_local_ip(),
    })


class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"
        logger.debug("%s %s completed in %.1fms", request.method, request.url.path, elapsed_ms)
        return response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    logger.info("Starting %s on %s:%s", settings.app_name, settings.host, settings.port)
    redis_client.connect()
    try:
        yield
    finally:
        logger.info("Shutting down %s", settings.app_name)
        if settings.posthog_api_key:
            try:
                posthog.shutdown()
            except Exception:
                logger.debug("posthog.shutdown failed", exc_info=True)
        if redis_client._client is not None:
            redis_client._client = None


app = FastAPI(
    title=settings.app_name,
    description="Multi-agent LLM orchestration API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(RequestTimingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(council_router, prefix=API_V1_PREFIX)
app.include_router(agents_router, prefix=API_V1_PREFIX)
app.include_router(streaming_router, prefix=API_V1_PREFIX)
app.include_router(debates_router, prefix=API_V1_PREFIX)
app.include_router(deliberation_router, prefix=API_V1_PREFIX)
app.include_router(mcp_http_router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "health": "/health",
            "ready": "/ready",
            "live": "/live",
            "providers": "/providers",
            "council": f"{API_V1_PREFIX}/council",
            "agents": f"{API_V1_PREFIX}/agents",
            "streaming": f"{API_V1_PREFIX}/streaming",
            "debates": f"{API_V1_PREFIX}/debates",
        },
    }


if __name__ == "__main__":
    import uvicorn

    # Windows-specific uvicorn configuration to prevent socket buffer exhaustion
    uvicorn_config: dict[str, Any] = {
        "app": "src.main:app",
        "host": settings.host,
        "port": settings.port,
        "reload": settings.debug,
        "log_level": "info",
    }

    # Windows-specific optimizations
    if sys.platform == "win32":
        # Limit connection backlog to prevent buffer exhaustion
        uvicorn_config["backlog"] = 128
        # Reduce reload delay on Windows (can cause socket issues)
        if settings.debug:
            uvicorn_config["reload_delay"] = 0.25
        # Limit the number of reload watchers on Windows
        uvicorn_config["reload_includes"] = ["*.py"]
        uvicorn_config["reload_excludes"] = ["*.pyc", "__pycache__", "*.log"]

    uvicorn.run(**uvicorn_config)
