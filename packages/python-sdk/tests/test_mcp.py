from __future__ import annotations

import asyncio
import json
from typing import Any
from unittest.mock import patch

import pytest

from consilium import mcp


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro) if False else asyncio.run(coro)


class TestToolRegistry:
    def test_all_expected_tools_present(self):
        names = {t["name"] for t in mcp.TOOLS}
        assert names == {
            "consilium_deliberate",
            "consilium_red_team",
            "consilium_blind_eval",
            "consilium_list_debates",
            "consilium_cancel_debate",
        }

    def test_tool_handlers_keys_match_tools(self):
        tool_names = {t["name"] for t in mcp.TOOLS}
        assert set(mcp.TOOL_HANDLERS.keys()) == tool_names

    def test_deliberate_schema_accepts_files(self):
        schema = next(t for t in mcp.TOOLS if t["name"] == "consilium_deliberate")["inputSchema"]
        assert "files" in schema["properties"]
        files_schema = schema["properties"]["files"]
        assert files_schema["type"] == "array"
        assert files_schema["items"]["required"] == ["name", "content"]

    def test_list_debates_schema_has_optional_filters(self):
        schema = next(t for t in mcp.TOOLS if t["name"] == "consilium_list_debates")["inputSchema"]
        assert set(schema["properties"].keys()) == {"limit", "offset", "search"}
        assert "required" not in schema or schema.get("required") == []

    def test_cancel_debate_requires_debate_id(self):
        schema = next(t for t in mcp.TOOLS if t["name"] == "consilium_cancel_debate")["inputSchema"]
        assert schema["required"] == ["debate_id"]
        assert schema["properties"]["kind"]["enum"] == ["debate", "deliberation"]


class TestHandleDeliberate:
    def test_mode_fallback_to_council(self):
        captured: dict[str, Any] = {}

        async def fake_post(path: str, body: dict):
            captured["path"] = path
            captured["body"] = body
            return {"id": "sess_1"}

        async def fake_stream(sid: str, on_event=None):
            return {"id": sid, "status": "completed"}

        with patch.object(mcp, "_post_json", fake_post), patch.object(mcp, "_stream_deliberation", fake_stream):
            _run(mcp.handle_deliberate({"topic": "hi", "mode": "invalid_mode"}))

        assert captured["body"]["mode"] == "council"

    def test_files_attached_only_when_codebase_access_true(self):
        captured: dict[str, Any] = {}

        async def fake_post(path: str, body: dict):
            captured["body"] = body
            return {"id": "sess_x"}

        async def fake_stream(sid: str, on_event=None):
            return {"id": sid}

        files = [{"name": "a.py", "content": "print(1)"}]
        with patch.object(mcp, "_post_json", fake_post), patch.object(mcp, "_stream_deliberation", fake_stream):
            _run(mcp.handle_deliberate({"topic": "hi", "files": files, "codebase_access": False}))
        assert "context" not in captured["body"]

        with patch.object(mcp, "_post_json", fake_post), patch.object(mcp, "_stream_deliberation", fake_stream):
            _run(mcp.handle_deliberate({"topic": "hi", "files": files, "codebase_access": True}))
        assert captured["body"]["context"]["files"] == files

    def test_debate_source_is_mcp(self):
        captured: dict[str, Any] = {}

        async def fake_post(path: str, body: dict):
            captured["body"] = body
            return {"id": "sess_1"}

        async def fake_stream(sid: str, on_event=None):
            return {"id": sid}

        with patch.object(mcp, "_post_json", fake_post), patch.object(mcp, "_stream_deliberation", fake_stream):
            _run(mcp.handle_deliberate({"topic": "x"}))
        assert captured["body"]["debateSource"] == "mcp"

    def test_progress_sink_forwarded_to_stream(self):
        captured: dict[str, Any] = {}

        async def fake_post(path: str, body: dict):
            return {"id": "sess_1"}

        async def fake_stream(sid: str, on_event=None):
            captured["on_event"] = on_event
            return {"id": sid}

        async def sink(event):
            pass

        with patch.object(mcp, "_post_json", fake_post), patch.object(mcp, "_stream_deliberation", fake_stream):
            _run(mcp.handle_deliberate({"topic": "x"}, progress_sink=sink))
        assert captured["on_event"] is sink


class TestSSEParser:
    def test_parses_data_and_event_name(self):
        block = 'event: phase_change\ndata: {"phase": "analysis"}'
        parsed = mcp._parse_sse_event(block)
        assert parsed == {"phase": "analysis", "event": "phase_change"}

    def test_preserves_existing_event_field(self):
        block = 'event: phase_change\ndata: {"event": "model_progress", "agent": "gpt-4"}'
        parsed = mcp._parse_sse_event(block)
        assert parsed["event"] == "model_progress"

    def test_joins_multi_line_data(self):
        block = 'data: {"a":\ndata: 1}'
        parsed = mcp._parse_sse_event(block)
        assert parsed == {"a": 1}

    def test_returns_none_on_empty_block(self):
        assert mcp._parse_sse_event(":keepalive") is None

    def test_falls_back_to_raw_on_invalid_json(self):
        parsed = mcp._parse_sse_event("event: ping\ndata: not-json")
        assert parsed == {"event": "ping", "raw": "not-json"}


class TestHandleListDebates:
    def test_clamps_limit_and_offset(self):
        captured = {}

        async def fake_get(path: str):
            captured["path"] = path
            return []

        with patch.object(mcp, "_get_json", fake_get):
            _run(mcp.handle_list_debates({"limit": 500, "offset": -1}))
        assert "limit=100" in captured["path"]
        assert "offset=0" in captured["path"]

    def test_unwraps_items_key(self):
        async def fake_get(path: str):
            return {"items": [{"id": "dbt_1"}], "total": 1}

        with patch.object(mcp, "_get_json", fake_get):
            out = _run(mcp.handle_list_debates({}))
        parsed = json.loads(out)
        assert parsed == [{"id": "dbt_1"}]

    def test_search_is_url_encoded(self):
        captured = {}

        async def fake_get(path: str):
            captured["path"] = path
            return []

        with patch.object(mcp, "_get_json", fake_get):
            _run(mcp.handle_list_debates({"search": "auth flow"}))
        assert "search=auth%20flow" in captured["path"]


class TestHandleCancelDebate:
    def test_routes_to_debates_endpoint_by_default(self):
        captured = {}

        async def fake_post(path: str):
            captured["path"] = path
            return {"ok": True}

        with patch.object(mcp, "_post_empty", fake_post):
            _run(mcp.handle_cancel_debate({"debate_id": "dbt_1"}))
        assert captured["path"] == "/api/v1/debates/dbt_1/cancel"

    def test_routes_to_deliberation_endpoint_when_kind_set(self):
        captured = {}

        async def fake_post(path: str):
            captured["path"] = path
            return {"ok": True}

        with patch.object(mcp, "_post_empty", fake_post):
            _run(mcp.handle_cancel_debate({"debate_id": "dlb_1", "kind": "deliberation"}))
        assert captured["path"] == "/api/v1/deliberation/dlb_1/cancel"


class TestJsonRpcFallback:
    def test_tools_list_returns_tools(self):
        response = _run(mcp._jsonrpc_handle({"id": 1, "method": "tools/list"}))
        assert response["id"] == 1
        assert "tools" in response["result"]
        names = {t["name"] for t in response["result"]["tools"]}
        assert "consilium_list_debates" in names
        assert "consilium_cancel_debate" in names

    def test_unknown_method_returns_error(self):
        response = _run(mcp._jsonrpc_handle({"id": 2, "method": "nope"}))
        assert response["error"]["code"] == -32601

    def test_tools_call_unknown_tool_returns_error(self):
        response = _run(
            mcp._jsonrpc_handle(
                {"id": 3, "method": "tools/call", "params": {"name": "missing", "arguments": {}}}
            )
        )
        assert response["error"]["code"] == -32601

    def test_tools_call_dispatches_to_handler(self):
        async def fake_get(path: str):
            return [{"id": "dbt_1"}]

        with patch.object(mcp, "_get_json", fake_get):
            response = _run(
                mcp._jsonrpc_handle(
                    {
                        "id": 4,
                        "method": "tools/call",
                        "params": {"name": "consilium_list_debates", "arguments": {}},
                    }
                )
            )
        assert response["id"] == 4
        payload = json.loads(response["result"]["content"][0]["text"])
        assert payload == [{"id": "dbt_1"}]

    def test_headers_include_bearer_when_key_set(self):
        with patch.object(mcp, "CONSILIUM_API_KEY", "consilium_xyz"):
            h = mcp._headers()
        assert h["Authorization"] == "Bearer consilium_xyz"

    def test_headers_omit_bearer_when_key_empty(self):
        with patch.object(mcp, "CONSILIUM_API_KEY", ""):
            h = mcp._headers()
        assert "Authorization" not in h
