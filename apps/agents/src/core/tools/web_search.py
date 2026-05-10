from typing import Any

import httpx

from src.features.agents.base_agent import ToolCall, ToolResult


class WebSearchTool:
    def __init__(self, api_key: str | None = None, max_results: int = 5) -> None:
        self._api_key = api_key
        self._max_results = max_results

    def definition(self) -> dict[str, Any]:
        return {
            "name": "web_search",
            "description": "Search the web for current information",
            "input_schema": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        }

    async def execute(self, call: ToolCall) -> ToolResult:
        query = call.arguments.get("query", "")
        if not query:
            return ToolResult(
                call_id=call.call_id,
                content="Error: query must not be empty",
                is_error=True,
            )

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.search.brave.com/res/v1/web/search",
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip",
                        "X-Subscription-Token": self._api_key or "",
                    },
                    params={"q": query, "count": self._max_results},
                    timeout=15.0,
                )
                resp.raise_for_status()

            data = resp.json()
            results = data.get("web", {}).get("results", [])
            if not results:
                return ToolResult(
                    call_id=call.call_id,
                    content="No results found",
                )

            formatted = []
            for r in results[: self._max_results]:
                title = r.get("title", "")
                snippet = r.get("description", "")
                url = r.get("url", "")
                formatted.append(f"**{title}**\n{snippet}\nURL: {url}")

            return ToolResult(
                call_id=call.call_id,
                content="\n---\n".join(formatted),
            )
        except Exception as exc:
            return ToolResult(
                call_id=call.call_id,
                content=f"Search error: {exc}",
                is_error=True,
            )
