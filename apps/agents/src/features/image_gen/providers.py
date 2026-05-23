from __future__ import annotations

import os
from dataclasses import asdict, dataclass
from typing import Any, Protocol, runtime_checkable

import httpx


class ImageGenProviderError(Exception):
    def __init__(self, message: str, *, provider: str, status_code: int = 503) -> None:
        super().__init__(message)
        self.provider = provider
        self.message = message
        self.status_code = status_code


@dataclass
class ImageGenResult:
    url: str | None
    base64: str | None
    width: int
    height: int
    revised_prompt: str | None
    provider: str
    model: str
    cost_usd: float | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@runtime_checkable
class ImageGenProvider(Protocol):
    name: str

    async def generate(
        self,
        prompt: str,
        *,
        size: str = "1024x1024",
        quality: str = "standard",
    ) -> ImageGenResult: ...


def _parse_size(size: str) -> tuple[int, int]:
    try:
        w, h = size.lower().split("x", 1)
        return int(w), int(h)
    except (ValueError, AttributeError):
        return 1024, 1024


def _dalle3_cost(size: str, quality: str) -> float:
    width, height = _parse_size(size)
    is_square = width == height == 1024
    is_wide = (width, height) in {(1792, 1024), (1024, 1792)}
    if quality.lower() == "hd":
        if is_square:
            return 0.08
        if is_wide:
            return 0.12
        return 0.08
    if is_square:
        return 0.04
    if is_wide:
        return 0.08
    return 0.04


class OpenAIDallE3Provider:
    name = "openai"
    model = "dall-e-3"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        endpoint: str = "https://api.openai.com/v1/images/generations",
        client: httpx.AsyncClient | None = None,
        timeout: float = 60.0,
    ) -> None:
        self._api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self._endpoint = endpoint
        self._client = client
        self._timeout = timeout

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    async def generate(
        self,
        prompt: str,
        *,
        size: str = "1024x1024",
        quality: str = "standard",
    ) -> ImageGenResult:
        if not prompt.strip():
            raise ImageGenProviderError("prompt must not be empty", provider=self.name, status_code=400)
        if not self._api_key:
            raise ImageGenProviderError(
                "OPENAI_API_KEY not configured", provider=self.name
            )
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "n": 1,
            "response_format": "url",
        }
        try:
            if self._client is not None:
                response = await self._client.post(
                    self._endpoint, json=payload, headers=headers, timeout=self._timeout
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout) as cli:
                    response = await cli.post(self._endpoint, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise ImageGenProviderError(str(exc), provider=self.name) from exc
        if response.status_code >= 400:
            raise ImageGenProviderError(
                f"HTTP {response.status_code} from OpenAI",
                provider=self.name,
                status_code=503,
            )
        try:
            data = response.json()
        except ValueError as exc:
            raise ImageGenProviderError("OpenAI returned invalid JSON", provider=self.name) from exc
        items = data.get("data") or []
        if not items:
            raise ImageGenProviderError("OpenAI returned no images", provider=self.name)
        item = items[0]
        url = item.get("url")
        b64 = item.get("b64_json")
        revised = item.get("revised_prompt")
        width, height = _parse_size(size)
        cost = _dalle3_cost(size, quality)
        return ImageGenResult(
            url=url,
            base64=b64,
            width=width,
            height=height,
            revised_prompt=revised,
            provider=self.name,
            model=self.model,
            cost_usd=cost,
        )


class StabilityProvider:
    name = "stability"
    model = "stable-diffusion-3"

    def __init__(self, *, api_key: str | None = None) -> None:
        self._api_key = api_key or os.getenv("STABILITY_API_KEY", "")

    @property
    def available(self) -> bool:
        return False

    async def generate(
        self,
        prompt: str,
        *,
        size: str = "1024x1024",
        quality: str = "standard",
    ) -> ImageGenResult:
        raise ImageGenProviderError(
            "Stability provider not yet implemented",
            provider=self.name,
            status_code=503,
        )


class XaiImageGenProvider:
    name = "xai"
    model = "grok-image-1"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        endpoint: str = "https://api.x.ai/v1/images/generations",
        client: httpx.AsyncClient | None = None,
        timeout: float = 60.0,
    ) -> None:
        self._api_key = api_key or os.getenv("XAI_API_KEY", "")
        self._endpoint = endpoint
        self._client = client
        self._timeout = timeout

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    async def generate(
        self,
        prompt: str,
        *,
        size: str = "1024x1024",
        quality: str = "standard",
    ) -> ImageGenResult:
        if not prompt.strip():
            raise ImageGenProviderError("prompt must not be empty", provider=self.name, status_code=400)
        if not self._api_key:
            raise ImageGenProviderError(
                "XAI_API_KEY not configured", provider=self.name
            )
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "n": 1,
            "response_format": "url",
        }
        try:
            if self._client is not None:
                response = await self._client.post(
                    self._endpoint, json=payload, headers=headers, timeout=self._timeout
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout) as cli:
                    response = await cli.post(self._endpoint, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise ImageGenProviderError(str(exc), provider=self.name) from exc
        if response.status_code >= 400:
            raise ImageGenProviderError(
                f"HTTP {response.status_code} from xAI",
                provider=self.name,
                status_code=503,
            )
        try:
            data = response.json()
        except ValueError as exc:
            raise ImageGenProviderError("xAI returned invalid JSON", provider=self.name) from exc
        items = data.get("data") or []
        if not items:
            raise ImageGenProviderError("xAI returned no images", provider=self.name)
        item = items[0]
        width, height = _parse_size(size)
        return ImageGenResult(
            url=item.get("url"),
            base64=item.get("b64_json"),
            width=width,
            height=height,
            revised_prompt=item.get("revised_prompt"),
            provider=self.name,
            model=self.model,
            cost_usd=None,
        )


def _build_provider(name: str) -> ImageGenProvider:
    normalized = (name or "").lower().strip()
    if normalized in ("", "openai", "dall-e-3", "dalle3"):
        return OpenAIDallE3Provider()
    if normalized == "stability":
        return StabilityProvider()
    if normalized in ("xai", "grok"):
        return XaiImageGenProvider()
    raise ImageGenProviderError(
        f"Unknown provider: {name}", provider=normalized or "unknown", status_code=400
    )


def get_provider(name: str | None = None) -> ImageGenProvider:
    chosen = name or os.getenv("IMAGE_GEN_PROVIDER", "openai")
    return _build_provider(chosen)


def cascade_providers(primary: str | None = None) -> list[ImageGenProvider]:
    primary_name = (primary or os.getenv("IMAGE_GEN_PROVIDER", "openai")).lower().strip()
    order = [primary_name]
    for fallback in ("openai", "xai", "stability"):
        if fallback not in order:
            order.append(fallback)
    providers: list[ImageGenProvider] = []
    for name in order:
        try:
            provider = _build_provider(name)
        except ImageGenProviderError:
            continue
        if isinstance(provider, OpenAIDallE3Provider) and not provider.available:
            continue
        if isinstance(provider, XaiImageGenProvider) and not provider.available:
            continue
        providers.append(provider)
    return providers
