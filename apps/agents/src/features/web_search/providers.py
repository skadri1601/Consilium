from __future__ import annotations

import os
import re
from dataclasses import asdict, dataclass, field
from html import unescape
from html.parser import HTMLParser
from typing import Any, Protocol, runtime_checkable
from urllib.parse import parse_qs, unquote, urlparse

import httpx


class WebSearchProviderError(Exception):
    def __init__(self, message: str, *, provider: str) -> None:
        super().__init__(message)
        self.provider = provider
        self.message = message


@dataclass
class WebSearchResult:
    title: str
    url: str
    snippet: str
    published: str | None = None
    source: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@runtime_checkable
class WebSearchProvider(Protocol):
    name: str

    async def search(self, query: str, *, limit: int = 5) -> list[WebSearchResult]: ...


@dataclass
class _DDGBlock:
    title_parts: list[str] = field(default_factory=list)
    url: str = ""
    snippet_parts: list[str] = field(default_factory=list)


class _DuckDuckGoParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.results: list[_DDGBlock] = []
        self._current: _DDGBlock | None = None
        self._capture: str | None = None
        self._depth_for_capture: int = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {k: v or "" for k, v in attrs}
        cls = attr_map.get("class", "")
        class_tokens = cls.split()
        if tag == "div" and "result" in class_tokens:
            if "result--ad" in class_tokens or "result--sidebar" in class_tokens:
                self._current = None
                self._capture = None
                self._depth_for_capture = 0
                return
            self._current = _DDGBlock()
            self.results.append(self._current)
            return
        if self._current is None:
            return
        if tag == "a" and "result__a" in cls.split():
            self._capture = "title"
            self._depth_for_capture = 1
            href = attr_map.get("href", "")
            self._current.url = _resolve_ddg_url(href)
            return
        if tag == "a" and "result__url" in cls.split() and not self._current.url:
            self._capture = "url"
            self._depth_for_capture = 1
            return
        if tag == "a" and "result__snippet" in cls.split():
            self._capture = "snippet"
            self._depth_for_capture = 1
            return
        if self._capture is not None:
            self._depth_for_capture += 1

    def handle_endtag(self, tag: str) -> None:
        if self._capture is None:
            return
        self._depth_for_capture -= 1
        if self._depth_for_capture <= 0:
            self._capture = None
            self._depth_for_capture = 0

    def handle_data(self, data: str) -> None:
        if self._current is None or self._capture is None:
            return
        if self._capture == "title":
            self._current.title_parts.append(data)
        elif self._capture == "snippet":
            self._current.snippet_parts.append(data)
        elif self._capture == "url" and not self._current.url:
            stripped = data.strip()
            if stripped:
                self._current.url = _normalize_bare_url(stripped)


def _resolve_ddg_url(href: str) -> str:
    if not href:
        return ""
    if href.startswith("//"):
        href = "https:" + href
    parsed = urlparse(href)
    if parsed.netloc.endswith("duckduckgo.com") and parsed.path in ("/l/", "/l"):
        qs = parse_qs(parsed.query)
        uddg = qs.get("uddg") or qs.get("u")
        if uddg:
            return unquote(uddg[0])
    if href.startswith(("http://", "https://")):
        return href
    return ""


def _normalize_bare_url(text: str) -> str:
    text = text.strip()
    if not text:
        return ""
    if text.startswith(("http://", "https://")):
        return text
    return f"https://{text}"


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", unescape(text)).strip()


class DuckDuckGoHtmlProvider:
    name = "duckduckgo"

    def __init__(
        self,
        *,
        endpoint: str = "https://html.duckduckgo.com/html/",
        client: httpx.AsyncClient | None = None,
        timeout: float = 10.0,
    ) -> None:
        self._endpoint = endpoint
        self._client = client
        self._timeout = timeout

    async def search(self, query: str, *, limit: int = 5) -> list[WebSearchResult]:
        if not query.strip():
            return []
        headers = {
            "User-Agent": "Mozilla/5.0 (Consilium Web Search)",
            "Accept": "text/html,application/xhtml+xml",
        }
        payload = {"q": query, "kl": "wt-wt"}
        try:
            if self._client is not None:
                response = await self._client.post(
                    self._endpoint, data=payload, headers=headers, timeout=self._timeout
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout, follow_redirects=True) as cli:
                    response = await cli.post(self._endpoint, data=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise WebSearchProviderError(str(exc), provider=self.name) from exc
        if response.status_code >= 400:
            raise WebSearchProviderError(
                f"HTTP {response.status_code} from DuckDuckGo", provider=self.name
            )
        parser = _DuckDuckGoParser()
        parser.feed(response.text)
        results: list[WebSearchResult] = []
        for block in parser.results:
            title = _clean("".join(block.title_parts))
            snippet = _clean("".join(block.snippet_parts))
            url = block.url.strip()
            if not title or not url:
                continue
            results.append(
                WebSearchResult(
                    title=title,
                    url=url,
                    snippet=snippet,
                    source=self.name,
                )
            )
            if len(results) >= limit:
                break
        return results


class BraveSearchProvider:
    name = "brave"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        endpoint: str = "https://api.search.brave.com/res/v1/web/search",
        client: httpx.AsyncClient | None = None,
        timeout: float = 10.0,
    ) -> None:
        self._api_key = api_key or os.getenv("BRAVE_SEARCH_API_KEY", "")
        self._endpoint = endpoint
        self._client = client
        self._timeout = timeout

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    async def search(self, query: str, *, limit: int = 5) -> list[WebSearchResult]:
        if not query.strip():
            return []
        if not self._api_key:
            raise WebSearchProviderError(
                "BRAVE_SEARCH_API_KEY not configured", provider=self.name
            )
        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": self._api_key,
        }
        params = {"q": query, "count": str(limit)}
        try:
            if self._client is not None:
                response = await self._client.get(
                    self._endpoint, params=params, headers=headers, timeout=self._timeout
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout) as cli:
                    response = await cli.get(self._endpoint, params=params, headers=headers)
        except httpx.HTTPError as exc:
            raise WebSearchProviderError(str(exc), provider=self.name) from exc
        if response.status_code >= 400:
            raise WebSearchProviderError(
                f"HTTP {response.status_code} from Brave", provider=self.name
            )
        try:
            data = response.json()
        except ValueError as exc:
            raise WebSearchProviderError("Brave returned invalid JSON", provider=self.name) from exc
        web = data.get("web") or {}
        items = web.get("results") or []
        results: list[WebSearchResult] = []
        for item in items[:limit]:
            url = item.get("url") or ""
            title = item.get("title") or ""
            if not url or not title:
                continue
            results.append(
                WebSearchResult(
                    title=_clean(title),
                    url=url,
                    snippet=_clean(item.get("description") or ""),
                    published=item.get("age"),
                    source=self.name,
                )
            )
        return results


def _build_provider(name: str) -> WebSearchProvider:
    normalized = (name or "").lower().strip()
    if normalized in ("", "duckduckgo", "ddg"):
        return DuckDuckGoHtmlProvider()
    if normalized == "brave":
        return BraveSearchProvider()
    raise WebSearchProviderError(f"Unknown provider: {name}", provider=normalized or "unknown")


def get_provider(name: str | None = None) -> WebSearchProvider:
    chosen = name or os.getenv("WEB_SEARCH_PROVIDER", "duckduckgo")
    return _build_provider(chosen)


def cascade_providers(primary: str | None = None) -> list[WebSearchProvider]:
    primary_name = (primary or os.getenv("WEB_SEARCH_PROVIDER", "duckduckgo")).lower().strip()
    order = [primary_name]
    for fallback in ("duckduckgo", "brave"):
        if fallback not in order:
            order.append(fallback)
    providers: list[WebSearchProvider] = []
    for name in order:
        try:
            provider = _build_provider(name)
        except WebSearchProviderError:
            continue
        if isinstance(provider, BraveSearchProvider) and not provider.available:
            continue
        providers.append(provider)
    return providers
