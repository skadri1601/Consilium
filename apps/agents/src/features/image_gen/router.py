from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .providers import (
    ImageGenProvider,
    ImageGenProviderError,
    ImageGenResult,
    cascade_providers,
    get_provider,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tools", tags=["tools"])


class ImageGenRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    size: str = Field(default="1024x1024", max_length=16)
    quality: str = Field(default="standard", max_length=16)
    provider: str | None = Field(default=None, max_length=64)


class ImageGenResponse(BaseModel):
    url: str | None = None
    base64: str | None = None
    width: int
    height: int
    revised_prompt: str | None = None
    provider: str
    model: str
    cost_usd: float | None = None


async def _run_provider(
    provider: ImageGenProvider, prompt: str, size: str, quality: str
) -> ImageGenResult:
    return await provider.generate(prompt, size=size, quality=quality)


async def _generate_with_fallback(
    prompt: str, size: str, quality: str, requested: str | None
) -> ImageGenResult:
    if requested:
        provider = get_provider(requested)
        return await _run_provider(provider, prompt, size, quality)

    providers = cascade_providers()
    if not providers:
        raise ImageGenProviderError("No providers configured", provider="unknown")
    last_error: ImageGenProviderError | None = None
    for provider in providers:
        try:
            return await _run_provider(provider, prompt, size, quality)
        except ImageGenProviderError as exc:
            last_error = exc
            logger.warning(
                "image_gen provider failed",
                extra={"provider": provider.name, "error": str(exc)},
            )
            continue
    raise last_error or ImageGenProviderError("All providers failed", provider="unknown")


@router.post("/image-gen", response_model=ImageGenResponse)
async def image_gen(request: ImageGenRequest) -> ImageGenResponse | JSONResponse:
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt must not be empty")

    requested_provider = (request.provider or "").strip() or None

    try:
        result = await _generate_with_fallback(
            prompt, request.size, request.quality, requested_provider
        )
    except ImageGenProviderError as exc:
        logger.warning(
            "image_gen unavailable",
            extra={"provider": exc.provider, "error": str(exc)},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "provider_unavailable",
                "provider": exc.provider,
                "message": str(exc),
            },
        )
    except Exception as exc:
        logger.exception("image_gen unexpected error")
        return JSONResponse(
            status_code=503,
            content={
                "error": "provider_unavailable",
                "provider": requested_provider or "unknown",
                "message": str(exc),
            },
        )

    return ImageGenResponse(
        url=result.url,
        base64=result.base64,
        width=result.width,
        height=result.height,
        revised_prompt=result.revised_prompt,
        provider=result.provider,
        model=result.model,
        cost_usd=result.cost_usd,
    )
