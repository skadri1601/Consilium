from __future__ import annotations

import pytest

from consilium.client import ConsiliumClient, _SyncSSEIterator
from consilium.exceptions import ConsiliumError


class TestModelValidation:
    def test_sync_deliberate_rejects_empty_topic(self):
        client = ConsiliumClient(api_url="http://x", api_key="k")
        with pytest.raises(ValueError, match="topic"):
            client.deliberate(topic="")

    def test_sync_deliberate_rejects_non_list_models(self):
        client = ConsiliumClient(api_url="http://x", api_key="k")
        with pytest.raises(ValueError, match="models"):
            client.deliberate(topic="q", models="gpt-4")  # type: ignore[arg-type]

    def test_sync_deliberate_rejects_empty_string_in_models(self):
        client = ConsiliumClient(api_url="http://x", api_key="k")
        with pytest.raises(ValueError, match="models"):
            client.deliberate(topic="q", models=["gpt-4", ""])


class TestSyncSSEIterator:
    def test_events_is_iterator_not_list(self):
        it = _SyncSSEIterator(
            base_url="http://x",
            headers={},
            payload={"topic": "x"},
            timeout=5.0,
        )
        result = it.events()
        assert hasattr(result, "__next__"), "events() must return an iterator, not a list"

    def test_iter_returns_same_iterator_protocol(self):
        it = _SyncSSEIterator(
            base_url="http://x",
            headers={},
            payload={"topic": "x"},
            timeout=5.0,
        )
        iterable = iter(it)
        assert hasattr(iterable, "__next__")
