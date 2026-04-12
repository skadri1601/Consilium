import argparse
import json
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from agents.config import SENTRY_AUTH_TOKEN, SONARQUBE_URL
from agents.core.base import setup_logging
from agents.core.utils import run_tool as _run_tool, sanitize_shell_arg

logger = setup_logging("monitor")

_repo_root = Path(__file__).resolve().parent.parent
_memory_dir = (_repo_root / "memory").resolve()
if not _memory_dir.is_relative_to(_repo_root):
    raise RuntimeError("invalid monitor memory directory")
STATE_FILE = (_memory_dir / "monitor_state.json").resolve()
if STATE_FILE.parent != _memory_dir:
    raise RuntimeError("invalid monitor state file path")

_RUN_TOOL_SENTRY = "agents.tools.sentry_api"
_RUN_TOOL_SONAR = "agents.tools.sonarqube_api"


@contextmanager
def _monitor_recovery(operation_name: str):
    try:
        yield
    except Exception:
        logger.exception("monitor %s failed", operation_name)


try:
    from agents.tools.sentry_api import (
        list_issues as _sentry_list_issues,
        get_issue as _sentry_get_issue,
        issue_events as _sentry_issue_events,
    )
    _HAS_SENTRY = True
except ImportError:
    _HAS_SENTRY = False


def _resolved_state_file() -> Path:
    resolved = STATE_FILE.resolve()
    root = _repo_root.resolve()
    if not resolved.is_relative_to(root):
        raise RuntimeError("invalid monitor state file path")
    return resolved


def _load_state():
    state_path = _resolved_state_file()
    if state_path.exists():
        try:
            return json.loads(state_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "seen_sentry_ids": [],
        "last_sonar_status": None,
    }


def _save_state(state):
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    state_path = _resolved_state_file()
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(state, indent=2, default=str), encoding="utf-8")


def _fetch_issue_detail(issue_id):
    detail = None
    if _HAS_SENTRY:
        try:
            detail = _sentry_get_issue(issue_id)
        except Exception:
            detail = None
    if not detail:
        detail = _run_tool(_RUN_TOOL_SENTRY, "get-issue", "--issue-id", str(issue_id))
    return detail if isinstance(detail, dict) and "error" not in detail else None


def _fetch_latest_event(issue_id):
    events = None
    if _HAS_SENTRY:
        try:
            events = _sentry_issue_events(issue_id, limit=1)
        except Exception:
            events = None
    if not events:
        events = _run_tool(_RUN_TOOL_SENTRY, "issue-events", "--issue-id", str(issue_id), "--limit", "1")
    if events and isinstance(events, list) and len(events) > 0:
        return events[0]
    return None


def _tags_from_detail(detail):
    tags = {}
    if not detail or not detail.get("tags"):
        return tags
    for tag_entry in detail["tags"]:
        if isinstance(tag_entry, dict):
            tags.update(tag_entry)
    return tags


def _merge_event_tags(tags, event):
    if not event or not event.get("tags"):
        return
    event_tags = event["tags"]
    if isinstance(event_tags, dict):
        tags.update(event_tags)
        return
    if not isinstance(event_tags, list):
        return
    for t in event_tags:
        if isinstance(t, dict):
            tags.update(t)


def _merge_issue_tags(detail, event):
    tags = _tags_from_detail(detail)
    _merge_event_tags(tags, event)
    return tags


def _system_info_from_tags(tags):
    info = {}
    for key in ("server_name", "hostname", "server.name"):
        if tags.get(key):
            info["hostname"] = tags[key]
            break
    for key in ("os", "os.name"):
        if tags.get(key):
            info["os"] = tags[key]
            break
    for key in ("client_ip", "ip_address", "user.ip"):
        if tags.get(key):
            info["ip"] = tags[key]
            break
    for field in ("debate_id", "environment", "release"):
        if tags.get(field):
            info[field] = tags[field]
    return info


def _extract_system_info(detail, event):
    return _system_info_from_tags(_merge_issue_tags(detail, event))


def _fetch_unresolved_sentry_issues():
    issues = None
    if _HAS_SENTRY:
        try:
            issues = _sentry_list_issues(query="is:unresolved", limit=20)
        except Exception:
            issues = None
    if not issues:
        issues = _run_tool(_RUN_TOOL_SENTRY, "list-issues", "--query", "is:unresolved", "--limit", "20")
    return issues


def _process_sentry_issue_row(issue, seen):
    issue_id = issue.get("id", "")
    if issue_id in seen:
        return
    title = issue.get("title", "Unknown error")
    short_id = issue.get("short_id", "")
    level = issue.get("level", "error")
    count = issue.get("count", "?")
    permalink = issue.get("permalink", "")
    culprit = issue.get("culprit", "")
    if level not in ("error", "fatal"):
        seen.add(issue_id)
        return
    detail = _fetch_issue_detail(issue_id)
    event = _fetch_latest_event(issue_id)
    sys_info = _extract_system_info(detail, event)
    extra = ""
    if sys_info.get("debate_id"):
        extra = f" debate_id={sys_info['debate_id']}"
    logger.info(
        "Sentry unresolved [%s] %s level=%s count=%s culprit=%s url=%s%s",
        short_id,
        sanitize_shell_arg(title)[:200],
        level,
        count,
        sanitize_shell_arg(str(culprit))[:120],
        permalink,
        extra,
    )
    seen.add(issue_id)


def check_sentry(state):
    if not SENTRY_AUTH_TOKEN:
        return
    logger.info("Checking Sentry...")
    with _monitor_recovery("sentry_check"):
        issues = _fetch_unresolved_sentry_issues()
        if not issues or isinstance(issues, dict):
            return
        seen = set(state.get("seen_sentry_ids", []))
        for issue in issues:
            _process_sentry_issue_row(issue, seen)
        state["seen_sentry_ids"] = list(seen)[-500:]


def _sonar_quality_gate_payload():
    return _run_tool(_RUN_TOOL_SONAR, "quality-gate")


def check_sonarqube(state):
    if not SONARQUBE_URL:
        return
    logger.info("Checking SonarQube...")
    with _monitor_recovery("sonarqube_check"):
        qg = _sonar_quality_gate_payload()
        if not qg or (isinstance(qg, dict) and "error" in qg):
            return
        current_status = qg.get("status")
        last_status = state.get("last_sonar_status")
        if current_status == last_status:
            return
        state["last_sonar_status"] = current_status
        if current_status == "ERROR":
            failed = [c for c in qg.get("conditions", []) if c.get("status") == "ERROR"]
            details = "; ".join(
                f"{c.get('metric', '?')}={c.get('value', '?')}" for c in failed[:5]
            )
            logger.warning("SonarQube quality gate ERROR: %s", details or "(no condition detail)")
        elif current_status == "OK" and last_status == "ERROR":
            logger.info("SonarQube quality gate OK (was ERROR)")


def run_cycle():
    state = _load_state()
    check_sentry(state)
    check_sonarqube(state)
    _save_state(state)


def main():
    parser = argparse.ArgumentParser(description="Consilium pipeline monitor")
    parser.add_argument("--interval", type=int, default=300)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    if args.once:
        run_cycle()
        return

    from agents.core.base import run_continuous

    run_continuous(run_cycle, poll_interval=args.interval, name="monitor")


if __name__ == "__main__":
    main()
