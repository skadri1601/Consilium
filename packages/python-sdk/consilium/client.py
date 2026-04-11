from __future__ import annotations

import asyncio
import json
import time
from collections.abc import AsyncIterator, Iterator
from typing import Any

import httpx

from .exceptions import (
    AuthenticationError,
    ConsiliumError,
    RateLimitError,
    ServerError,
    TimeoutError,
)
from .types import (
    CostEstimate,
    DeliberationMode,
    DeliberationResult,
    EvalResult,
    HealthStatus,
    RedTeamResult,
)

DEFAULT_BASE_URL = "http://localhost:4000/api/v1"
DEFAULT_TIMEOUT = 120.0
DEFAULT_MAX_RETRIES = 3
DEFAULT_BACKOFF_BASE = 1.0
DEFAULT_BACKOFF_MAX = 30.0

DELIBERATION_PATH = "/deliberation"


def _backoff_delay(attempt: int) -> float:
    return min(DEFAULT_BACKOFF_BASE * (2 ** attempt), DEFAULT_BACKOFF_MAX)


def _handle_httpx_json_response(response: httpx.Response) -> dict[str, Any]:
    if response.status_code == 401:
        raise AuthenticationError()
    if response.status_code == 408:
        raise TimeoutError()
    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After")
        raise RateLimitError(
            retry_after=float(retry_after) if retry_after else None
        )
    if response.status_code >= 500:
        raise ServerError(message=response.text, status_code=response.status_code)
    if response.status_code >= 400:
        raise ConsiliumError(message=response.text, status_code=response.status_code)
    return response.json()


def _raise_for_stream_http_error(response: httpx.Response) -> None:
    if response.status_code < 400:
        return
    if response.status_code == 401:
        raise AuthenticationError()
    if response.status_code == 408:
        raise TimeoutError()
    if response.status_code == 429:
        raise RateLimitError()
    if response.status_code >= 500:
        raise ServerError(message=response.text, status_code=response.status_code)
    raise ConsiliumError(message=response.text, status_code=response.status_code)


def _sync_should_retry_after_response(
    response: httpx.Response, attempt: int, max_retries: int,
) -> tuple[bool, Exception | None]:
    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After")
        wait = float(retry_after) if retry_after else _backoff_delay(attempt)
        time.sleep(wait)
        return True, RateLimitError(retry_after=wait)
    if response.status_code >= 500 and attempt < max_retries - 1:
        time.sleep(_backoff_delay(attempt))
        return True, ServerError(
            message=response.text, status_code=response.status_code,
        )
    return False, None


async def _async_should_retry_after_response(
    response: httpx.Response, attempt: int, max_retries: int,
) -> tuple[bool, Exception | None]:
    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After")
        wait = float(retry_after) if retry_after else _backoff_delay(attempt)
        await asyncio.sleep(wait)
        return True, RateLimitError(retry_after=wait)
    if response.status_code >= 500 and attempt < max_retries - 1:
        await asyncio.sleep(_backoff_delay(attempt))
        return True, ServerError(
            message=response.text, status_code=response.status_code,
        )
    return False, None


class ConsiliumClient:
    def __init__(
        self,
        api_url: str = DEFAULT_BASE_URL,
        api_key: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
    ):
        self._api_url = api_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout
        self._max_retries = max_retries
        self._client = httpx.Client(
            base_url=self._api_url,
            headers=self._build_headers(),
            timeout=self._timeout,
        )

    def _build_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        return headers

    def _handle_response(self, response: httpx.Response) -> dict[str, Any]:
        return _handle_httpx_json_response(response)

    def _request_with_retry(
        self, method: str, path: str, **kwargs: Any
    ) -> httpx.Response:
        last_exc: Exception | None = None
        for attempt in range(self._max_retries):
            try:
                response = self._client.request(method, path, **kwargs)
                retrying, err = _sync_should_retry_after_response(
                    response, attempt, self._max_retries,
                )
                if retrying:
                    last_exc = err
                    continue
                return response
            except httpx.TimeoutException:
                last_exc = TimeoutError()
                if attempt < self._max_retries - 1:
                    time.sleep(_backoff_delay(attempt))
                    continue
                raise TimeoutError() from last_exc
            except httpx.ConnectError as exc:
                last_exc = exc
                if attempt < self._max_retries - 1:
                    time.sleep(_backoff_delay(attempt))
                    continue
                raise ConsiliumError(f"Connection failed: {exc}") from exc
        if isinstance(last_exc, ConsiliumError):
            raise last_exc
        raise ConsiliumError(f"Request failed after {self._max_retries} retries")

    def health_check(self) -> HealthStatus:
        response = self._request_with_retry("GET", "/health")
        data = self._handle_response(response)
        return HealthStatus(**data)

    def deliberate(
        self,
        topic: str,
        models: list[str] | None = None,
        mode: str | DeliberationMode = DeliberationMode.COUNCIL,
        max_rounds: int = 3,
    ) -> DeliberationResult:
        payload: dict[str, Any] = {
            "topic": topic,
            "mode": str(mode.value if isinstance(mode, DeliberationMode) else mode),
            "maxRounds": max_rounds,
        }
        if models:
            payload["models"] = models

        response = self._request_with_retry("POST", DELIBERATION_PATH, json=payload)
        data = self._handle_response(response)

        if "id" in data:
            return self._poll_deliberation(data["id"])

        return DeliberationResult.from_dict(data)

    def _poll_deliberation(
        self, deliberation_id: str, poll_interval: float = 2.0, max_wait: float = 300.0
    ) -> DeliberationResult:
        elapsed = 0.0
        while elapsed < max_wait:
            response = self._request_with_retry(
                "GET", f"{DELIBERATION_PATH}/{deliberation_id}",
            )
            data = self._handle_response(response)
            status = data.get("status")
            if status == "completed":
                return DeliberationResult.from_dict(data.get("result", data))
            if status == "failed":
                raise ServerError(message=data.get("error", "Deliberation failed"))
            time.sleep(poll_interval)
            elapsed += poll_interval
        raise TimeoutError("Deliberation polling timed out")

    def red_team(
        self,
        topic: str,
        models: list[str] | None = None,
        categories: list[str] | None = None,
    ) -> RedTeamResult:
        payload: dict[str, Any] = {"topic": topic}
        if models:
            payload["models"] = models
        if categories:
            payload["categories"] = categories

        response = self._request_with_retry("POST", "/deliberation/redteam", json=payload)
        data = self._handle_response(response)
        return RedTeamResult.from_dict(data)

    def blind_eval(
        self,
        topic: str,
        models: list[str] | None = None,
        responses: list[str] | None = None,
    ) -> EvalResult:
        payload: dict[str, Any] = {"topic": topic}
        if models:
            payload["models"] = models
        if responses:
            payload["responses"] = responses

        response = self._request_with_retry("POST", "/deliberation/blind", json=payload)
        data = self._handle_response(response)
        return EvalResult.from_dict(data)

    def estimate_cost(
        self,
        topic: str,
        models: list[str] | None = None,
        mode: str | DeliberationMode = DeliberationMode.COUNCIL,
    ) -> CostEstimate:
        payload: dict[str, Any] = {
            "topic": topic,
            "mode": str(mode.value if isinstance(mode, DeliberationMode) else mode),
        }
        if models:
            payload["models"] = models

        response = self._request_with_retry("POST", "/debates/estimate", json=payload)
        data = self._handle_response(response)
        return CostEstimate(**data)

    def stream_deliberation(
        self,
        topic: str,
        models: list[str],
        mode: str | DeliberationMode = DeliberationMode.COUNCIL,
    ) -> _SyncSSEIterator:
        payload: dict[str, Any] = {
            "topic": topic,
            "models": models,
            "mode": str(mode.value if isinstance(mode, DeliberationMode) else mode),
        }

        return _SyncSSEIterator(self._api_url, self._build_headers(), payload, self._timeout)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> ConsiliumClient:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()


class _SyncSSEIterator:
    def __init__(
        self,
        base_url: str,
        headers: dict[str, str],
        payload: dict[str, Any],
        timeout: float,
    ):
        self._base_url = base_url
        self._headers = headers
        self._payload = payload
        self._timeout = timeout

    def __iter__(self) -> Iterator[dict[str, Any]]:
        return iter(self.events())

    def events(self) -> list[dict[str, Any]]:
        create_response = httpx.post(
            f"{self._base_url}{DELIBERATION_PATH}",
            json=self._payload,
            headers=self._headers,
            timeout=self._timeout,
        )
        _raise_for_stream_http_error(create_response)

        deliberation_id = create_response.json().get("id")
        if not deliberation_id:
            raise ConsiliumError(message="No deliberation ID returned")

        collected: list[dict[str, Any]] = []
        with httpx.stream(
            "GET",
            f"{self._base_url}{DELIBERATION_PATH}/{deliberation_id}/stream",
            headers=self._headers,
            timeout=self._timeout,
        ) as response:
            if response.status_code >= 400:
                response.read()
            _raise_for_stream_http_error(response)

            buffer = ""
            for chunk in response.iter_text():
                buffer += chunk
                while "\n\n" in buffer:
                    event_str, buffer = buffer.split("\n\n", 1)
                    for line in event_str.split("\n"):
                        if line.startswith("data: "):
                            data = json.loads(line[6:])
                            collected.append(data)
        return collected


class AsyncConsiliumClient:
    def __init__(
        self,
        api_url: str = DEFAULT_BASE_URL,
        api_key: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
    ):
        self._api_url = api_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout
        self._max_retries = max_retries
        self._client = httpx.AsyncClient(
            base_url=self._api_url,
            headers=self._build_headers(),
            timeout=self._timeout,
        )

    def _build_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        return headers

    def _handle_response(self, response: httpx.Response) -> dict[str, Any]:
        return _handle_httpx_json_response(response)

    async def _request_with_retry(
        self, method: str, path: str, **kwargs: Any
    ) -> httpx.Response:
        last_exc: Exception | None = None
        for attempt in range(self._max_retries):
            try:
                response = await self._client.request(method, path, **kwargs)
                retrying, err = await _async_should_retry_after_response(
                    response, attempt, self._max_retries,
                )
                if retrying:
                    last_exc = err
                    continue
                return response
            except httpx.TimeoutException:
                last_exc = TimeoutError()
                if attempt < self._max_retries - 1:
                    await asyncio.sleep(_backoff_delay(attempt))
                    continue
                raise TimeoutError() from last_exc
            except httpx.ConnectError as exc:
                last_exc = exc
                if attempt < self._max_retries - 1:
                    await asyncio.sleep(_backoff_delay(attempt))
                    continue
                raise ConsiliumError(f"Connection failed: {exc}") from exc
        if isinstance(last_exc, ConsiliumError):
            raise last_exc
        raise ConsiliumError(f"Request failed after {self._max_retries} retries")

    async def health_check(self) -> HealthStatus:
        response = await self._request_with_retry("GET", "/health")
        data = self._handle_response(response)
        return HealthStatus(**data)

    async def deliberate(
        self,
        topic: str,
        models: list[str] | None = None,
        mode: str | DeliberationMode = DeliberationMode.COUNCIL,
        max_rounds: int = 3,
    ) -> DeliberationResult:
        payload: dict[str, Any] = {
            "topic": topic,
            "mode": str(mode.value if isinstance(mode, DeliberationMode) else mode),
            "maxRounds": max_rounds,
        }
        if models:
            payload["models"] = models

        response = await self._request_with_retry("POST", DELIBERATION_PATH, json=payload)
        data = self._handle_response(response)

        if "id" in data:
            return await self._poll_deliberation(data["id"])

        return DeliberationResult.from_dict(data)

    async def _poll_deliberation(
        self, deliberation_id: str, poll_interval: float = 2.0, max_wait: float = 300.0
    ) -> DeliberationResult:
        elapsed = 0.0
        while elapsed < max_wait:
            response = await self._request_with_retry(
                "GET", f"{DELIBERATION_PATH}/{deliberation_id}",
            )
            data = self._handle_response(response)
            status = data.get("status")
            if status == "completed":
                return DeliberationResult.from_dict(data.get("result", data))
            if status == "failed":
                raise ServerError(message=data.get("error", "Deliberation failed"))
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
        raise TimeoutError("Deliberation polling timed out")

    async def red_team(
        self,
        topic: str,
        models: list[str] | None = None,
        categories: list[str] | None = None,
    ) -> RedTeamResult:
        payload: dict[str, Any] = {"topic": topic}
        if models:
            payload["models"] = models
        if categories:
            payload["categories"] = categories

        response = await self._request_with_retry("POST", "/deliberation/redteam", json=payload)
        data = self._handle_response(response)
        return RedTeamResult.from_dict(data)

    async def blind_eval(
        self,
        topic: str,
        models: list[str] | None = None,
        responses: list[str] | None = None,
    ) -> EvalResult:
        payload: dict[str, Any] = {"topic": topic}
        if models:
            payload["models"] = models
        if responses:
            payload["responses"] = responses

        response = await self._request_with_retry("POST", "/deliberation/blind", json=payload)
        data = self._handle_response(response)
        return EvalResult.from_dict(data)

    async def estimate_cost(
        self,
        topic: str,
        models: list[str] | None = None,
        mode: str | DeliberationMode = DeliberationMode.COUNCIL,
    ) -> CostEstimate:
        payload: dict[str, Any] = {
            "topic": topic,
            "mode": str(mode.value if isinstance(mode, DeliberationMode) else mode),
        }
        if models:
            payload["models"] = models

        response = await self._request_with_retry("POST", "/debates/estimate", json=payload)
        data = self._handle_response(response)
        return CostEstimate(**data)

    async def stream_deliberation(
        self,
        topic: str,
        models: list[str],
        mode: str | DeliberationMode = DeliberationMode.COUNCIL,
    ) -> AsyncIterator[dict[str, Any]]:
        payload: dict[str, Any] = {
            "topic": topic,
            "models": models,
            "mode": str(mode.value if isinstance(mode, DeliberationMode) else mode),
        }

        create_response = await self._request_with_retry("POST", DELIBERATION_PATH, json=payload)
        create_data = self._handle_response(create_response)
        deliberation_id = create_data.get("id")
        if not deliberation_id:
            raise ConsiliumError("No deliberation ID returned")

        async with httpx.AsyncClient(timeout=self._timeout) as stream_client:
            async with stream_client.stream(
                "GET",
                f"{self._api_url}{DELIBERATION_PATH}/{deliberation_id}/stream",
                headers=self._build_headers(),
            ) as response:
                if response.status_code >= 400:
                    await response.aread()
                    self._handle_response(response)

                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    while "\n\n" in buffer:
                        event_str, buffer = buffer.split("\n\n", 1)
                        for line in event_str.split("\n"):
                            if line.startswith("data: "):
                                yield json.loads(line[6:])

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> AsyncConsiliumClient:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
