from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ...shared.auth import require_api_key

from .citations import Citation, extract_citations
from .providers import (
    WebSearchProvider,
    WebSearchProviderError,
    WebSearchResult,
    cascade_providers,
    get_provider,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tools", tags=["tools"], dependencies=[Depends(require_api_key)])

CACHE_TTL_SECONDS = 600.0
CACHE_MAX_ENTRIES = 256


class WebSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2048)
    limit: int = Field(default=5, ge=1, le=20)
    provider: Optional[str] = Field(default=None, max_length=64)


class WebSearchResultModel(BaseModel):
    title: str
    url: str
    snippet: str
    published: Optional[str] = None
    source: str = ""


class CitationModel(BaseModel):
    index: int
    title: str
    url: str
    snippet: str
    domain: str
    source: str = ""


class WebSearchResponse(BaseModel):
    results: list[WebSearchResultModel]
    provider: str
    cached: bool = False
    citations: list[CitationModel] = Field(default_factory=list)


class _AsyncTTLCache:
    def __init__(self, *, ttl: float = CACHE_TTL_SECONDS, max_entries: int = CACHE_MAX_ENTRIES):
        self._ttl = ttl
        self._max_entries = max_entries
        self._store: dict[tuple[str, str, int], tuple[float, list[WebSearchResult], str]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: tuple[str, str, int]) -> tuple[list[WebSearchResult], str] | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, results, provider_name = entry
            if expires_at < time.time():
                self._store.pop(key, None)
                return None
            self._store[key] = (expires_at, results, provider_name)
            return results, provider_name

    async def set(
        self, key: tuple[str, str, int], results: list[WebSearchResult], provider_name: str
    ) -> None:
        async with self._lock:
            if len(self._store) >= self._max_entries:
                oldest_key = next(iter(self._store))
                self._store.pop(oldest_key, None)
            self._store[key] = (time.time() + self._ttl, list(results), provider_name)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()


_cache = _AsyncTTLCache()


def _cache_key(provider: str, query: str, limit: int) -> tuple[str, str, int]:
    return (provider.lower(), query.strip().lower(), limit)


async def _run_provider(
    provider: WebSearchProvider, query: str, limit: int
) -> list[WebSearchResult]:
    return await provider.search(query, limit=limit)


async def _search_with_fallback(
    query: str, limit: int, requested: str | None
) -> tuple[list[WebSearchResult], str]:
    if requested:
        provider = get_provider(requested)
        results = await _run_provider(provider, query, limit)
        return results, provider.name

    providers = cascade_providers()
    if not providers:
        raise WebSearchProviderError("No providers configured", provider="unknown")
    last_error: WebSearchProviderError | None = None
    for provider in providers:
        try:
            results = await _run_provider(provider, query, limit)
            return results, provider.name
        except WebSearchProviderError as exc:
            last_error = exc
            logger.warning(
                "web_search provider failed", extra={"provider": provider.name, "error": str(exc)}
            )
            continue
    raise last_error or WebSearchProviderError("All providers failed", provider="unknown")


@router.post("/web-search", response_model=WebSearchResponse)
async def web_search(request: WebSearchRequest) -> WebSearchResponse | JSONResponse:
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query must not be empty")

    requested_provider = (request.provider or "").strip() or None
    probe_name = (requested_provider or "auto").lower()
    cache_key = _cache_key(probe_name, query, request.limit)

    cached = await _cache.get(cache_key)
    if cached is not None:
        results, provider_name = cached
        citations = extract_citations(results)
        return WebSearchResponse(
            results=[_to_model(r) for r in results],
            provider=provider_name,
            cached=True,
            citations=[_citation_to_model(c) for c in citations],
        )

    try:
        results, provider_name = await _search_with_fallback(
            query, request.limit, requested_provider
        )
    except WebSearchProviderError as exc:
        logger.warning(
            "web_search unavailable",
            extra={"provider": exc.provider, "error": str(exc)},
        )
        return JSONResponse(
            status_code=503,
            content={
                "error": "provider_unavailable",
                "provider": exc.provider,
                "message": str(exc),
            },
        )
    except Exception as exc:
        logger.exception("web_search unexpected error")
        return JSONResponse(
            status_code=503,
            content={
                "error": "provider_unavailable",
                "provider": probe_name,
                "message": str(exc),
            },
        )

    await _cache.set(cache_key, results, provider_name)
    citations = extract_citations(results)
    return WebSearchResponse(
        results=[_to_model(r) for r in results],
        provider=provider_name,
        cached=False,
        citations=[_citation_to_model(c) for c in citations],
    )


def _to_model(result: WebSearchResult) -> WebSearchResultModel:
    return WebSearchResultModel(
        title=result.title,
        url=result.url,
        snippet=result.snippet,
        published=result.published,
        source=result.source,
    )


def _citation_to_model(citation: Citation) -> CitationModel:
    return CitationModel(
        index=citation.index,
        title=citation.title,
        url=citation.url,
        snippet=citation.snippet,
        domain=citation.domain,
        source=citation.source,
    )


async def reset_cache() -> None:
    await _cache.clear()
