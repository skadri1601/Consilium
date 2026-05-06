"""Tests for JSONL session persistence."""

import json

import pytest

from src.core import session_log
from src.core.session_log import SessionLog


@pytest.fixture
def isolated_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("CONSILIUM_SESSION_LOG_DIR", str(tmp_path))
    return tmp_path


def test_append_writes_jsonl(isolated_dir):
    with SessionLog.open("debate-1") as log:
        log.append("round_start", {"round": 1})
        log.append("round_complete", {"round": 1, "responses": {"m1": "x"}})

    path = isolated_dir / "debate-1.jsonl"
    assert path.exists()
    lines = [l for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
    assert len(lines) == 2
    parsed = [json.loads(l) for l in lines]
    assert [p["event"] for p in parsed] == ["round_start", "round_complete"]
    assert [p["seq"] for p in parsed] == [1, 2]


def test_replay_yields_entries_in_order(isolated_dir):
    with SessionLog.open("debate-2") as log:
        for i in range(5):
            log.append("agent_chunk", {"i": i})

    seqs = [e.seq for e in SessionLog.replay("debate-2")]
    assert seqs == [1, 2, 3, 4, 5]
    events = [e.event for e in SessionLog.replay("debate-2")]
    assert events == ["agent_chunk"] * 5


def test_seq_continues_across_reopen(isolated_dir):
    with SessionLog.open("debate-3") as log:
        log.append("round_start", {"round": 1})
        log.append("round_start", {"round": 2})

    assert SessionLog.latest_seq("debate-3") == 2

    with SessionLog.open("debate-3") as log:
        log.append("round_start", {"round": 3})

    seqs = [e.seq for e in SessionLog.replay("debate-3")]
    assert seqs == [1, 2, 3]


def test_safe_id_neutralizes_traversal(isolated_dir):
    log = SessionLog.open("../../../etc/passwd")
    try:
        log.append("done", {})
    finally:
        log.close()
    expected = isolated_dir / "_________etc_passwd.jsonl"
    assert expected.exists()


def test_replay_missing_file_returns_empty(isolated_dir):
    assert list(SessionLog.replay("nope")) == []


def test_close_is_idempotent(isolated_dir):
    log = SessionLog.open("debate-4")
    log.append("done", {})
    log.close()
    log.close()  # second close must not raise


def test_append_after_close_raises(isolated_dir):
    log = SessionLog.open("debate-5")
    log.close()
    with pytest.raises(RuntimeError):
        log.append("done", {})


def test_session_log_dir_respects_env(monkeypatch, tmp_path):
    monkeypatch.setenv("CONSILIUM_SESSION_LOG_DIR", str(tmp_path / "xyz"))
    assert str(session_log.session_log_dir()) == str(tmp_path / "xyz")


def test_corrupt_line_in_existing_file_does_not_break_seq(isolated_dir):
    path = isolated_dir / "debate-6.jsonl"
    path.write_text(
        '{"seq":1,"ts":0,"event":"a","data":{}}\n'
        "garbage line\n"
        '{"seq":2,"ts":0,"event":"b","data":{}}\n',
        encoding="utf-8",
    )
    with SessionLog.open("debate-6") as log:
        entry = log.append("c", {})
    assert entry.seq == 3
