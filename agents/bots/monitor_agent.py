import argparse
import json
import re
import sys
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path

from agents.config import (
    SENTRY_AUTH_TOKEN,
    SONARQUBE_URL,
    CONSILIUM_SUPPORT_EMAIL,
    CONSILIUM_ADMIN_EMAIL,
    SLACK_BOT_TOKEN,
    SLACK_NOTIFICATION_CHANNEL,
    GITHUB_TOKEN,
    GITHUB_REPO,
)
from agents.core.base import setup_logging
from agents.core.utils import run_tool as _run_tool, post_slack as _post_slack, sanitize_shell_arg

try:
    from agents.core.recovery import RecoveryEngine, FailureScenario
    _recovery_engine = RecoveryEngine()
except ImportError:
    _recovery_engine = None
    FailureScenario = None

try:
    from agents.core.lanes import LaneRegistry, LaneStatus
    _lane_registry = LaneRegistry()
except ImportError:
    _lane_registry = None
    LaneStatus = None

logger = setup_logging("monitor")

_repo_root = Path(__file__).resolve().parent.parent
_memory_dir = (_repo_root / "memory").resolve()
if not _memory_dir.is_relative_to(_repo_root):
    raise RuntimeError("invalid monitor memory directory")
STATE_FILE = (_memory_dir / "monitor_state.json").resolve()
if STATE_FILE.parent != _memory_dir:
    raise RuntimeError("invalid monitor state file path")


def _resolved_state_file() -> Path:
    resolved = STATE_FILE.resolve()
    root = _repo_root.resolve()
    if not resolved.is_relative_to(root):
        raise RuntimeError("invalid monitor state file path")
    return resolved


AUTOMATED_SENDERS = re.compile(
    r"(^|<)(no-reply@|noreply@|notifications@|mailer-daemon@)", re.IGNORECASE
)

_RUN_TOOL_LINEAR = "agents.tools.linear_api"
_RUN_TOOL_SENTRY = "agents.tools.sentry_api"
_RUN_TOOL_SONAR = "agents.tools.sonarqube_api"
_RUN_TOOL_EMAIL = "agents.tools.email_imap"
_RUN_TOOL_GITHUB = "agents.tools.github_api"

EMAIL_CHECK_INTERVAL = timedelta(minutes=30)


@contextmanager
def _monitor_recovery(operation_name: str):
    scenario = FailureScenario(operation_name) if FailureScenario else None
    ctx = _recovery_engine.with_recovery(scenario) if _recovery_engine and scenario else None
    if ctx:
        ctx.__enter__()
    try:
        yield
    except Exception:
        if ctx:
            if ctx.__exit__(*sys.exc_info()):
                return
        raise
    else:
        if ctx:
            ctx.__exit__(None, None, None)

try:
    from agents.tools.linear_api import (
        create_issue as _linear_create_issue,
        transition_issue as _linear_transition_issue,
        search_issues as _linear_search_issues,
        comment_on_issue as _linear_comment_on_issue,
        get_issue as _linear_get_issue,
        assign_issue as _linear_assign_issue,
    )
    _HAS_LINEAR = True
except ImportError:
    _HAS_LINEAR = False

try:
    from agents.tools.sentry_api import (
        list_issues as _sentry_list_issues,
        get_issue as _sentry_get_issue,
        issue_events as _sentry_issue_events,
    )
    _HAS_SENTRY = True
except ImportError:
    _HAS_SENTRY = False

try:
    from agents.tools.email_imap import unread as _email_unread
    _HAS_EMAIL = True
except ImportError:
    _HAS_EMAIL = False

try:
    from agents.tools.github_api import list_prs as _github_list_prs
    _HAS_GITHUB = True
except ImportError:
    _HAS_GITHUB = False


def _load_state():
    state_path = _resolved_state_file()
    if state_path.exists():
        try:
            return json.loads(state_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "seen_sentry_ids": [],
        "seen_email_ids": [],
        "last_sonar_status": None,
        "error_ticket_map": {},
        "last_email_check": None,
        "merged_pr_tickets": {},
    }


def _save_state(state):
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    state_path = _resolved_state_file()
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(state, indent=2, default=str), encoding="utf-8")


def _create_ticket(title, description):
    # Validate and sanitize inputs
    if not title or not isinstance(title, str):
        return None
    if not description or not isinstance(description, str):
        return None

    # Sanitize inputs to prevent injection attacks
    safe_title = sanitize_shell_arg(title)
    safe_description = sanitize_shell_arg(description)

    ticket = None
    if _HAS_LINEAR:
        try:
            ticket = _linear_create_issue(safe_title, safe_description)
        except Exception:
            ticket = None

    if not ticket:
        ticket = _run_tool(_RUN_TOOL_LINEAR, "create", "--title", safe_title, "--description", safe_description)

    if ticket and ticket.get("identifier"):
        try:
            if _HAS_LINEAR:
                _linear_assign_issue(ticket["identifier"], CONSILIUM_ADMIN_EMAIL)
                _linear_transition_issue(ticket["identifier"], "In Progress")
            else:
                _run_tool(_RUN_TOOL_LINEAR, "assign", "--identifier", ticket["identifier"], "--email", CONSILIUM_ADMIN_EMAIL)
                _run_tool(_RUN_TOOL_LINEAR, "transition", "--identifier", ticket["identifier"], "--state", "In Progress")
        except Exception:
            pass
        return ticket
    return None


def _add_comment_to_ticket(identifier, body):
    # Validate and sanitize inputs
    if not identifier or not isinstance(identifier, str):
        return False
    if not body or not isinstance(body, str):
        return False

    # Sanitize inputs to prevent injection attacks
    safe_identifier = sanitize_shell_arg(identifier)
    safe_body = sanitize_shell_arg(body)

    if _HAS_LINEAR:
        try:
            issue = _linear_get_issue(safe_identifier)
            _linear_comment_on_issue(issue["id"], safe_body)
            return True
        except Exception:
            pass
    try:
        result = _run_tool(_RUN_TOOL_LINEAR, "get", "--identifier", safe_identifier)
        if result and result.get("id"):
            _run_tool(_RUN_TOOL_LINEAR, "comment", "--issue-id", result["id"], "--body", safe_body)
            return True
    except Exception:
        pass
    return False


def _transition_ticket(identifier, state_name):
    # Validate and sanitize inputs
    if not identifier or not isinstance(identifier, str):
        return False
    if not state_name or not isinstance(state_name, str):
        return False

    # Sanitize inputs to prevent injection attacks
    safe_identifier = sanitize_shell_arg(identifier)
    safe_state_name = sanitize_shell_arg(state_name)

    if _HAS_LINEAR:
        try:
            _linear_transition_issue(safe_identifier, safe_state_name)
            return True
        except Exception:
            pass
    try:
        _run_tool(_RUN_TOOL_LINEAR, "transition", "--identifier", safe_identifier, "--state", safe_state_name)
        return True
    except Exception:
        pass
    return False


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


def _build_ticket_description(short_id, level, culprit, count, permalink, sys_info):
    lines = [
        f"**Sentry Issue:** {short_id}",
        f"**Level:** {level}",
        f"**Culprit:** {culprit}",
        f"**Occurrences:** {count}",
        f"**Link:** {permalink}",
    ]
    if sys_info.get("debate_id"):
        lines.append(f"**Debate ID:** {sys_info['debate_id']}")
    if sys_info.get("environment"):
        lines.append(f"**Environment:** {sys_info['environment']}")
    if sys_info.get("release"):
        lines.append(f"**Release:** {sys_info['release']}")
    if sys_info.get("hostname"):
        lines.append(f"**Hostname:** {sys_info['hostname']}")
    if sys_info.get("os"):
        lines.append(f"**OS:** {sys_info['os']}")
    if sys_info.get("ip"):
        lines.append(f"**IP:** {sys_info['ip']}")
    return "\n".join(lines)


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


def _create_lane_for_sentry_ticket(ticket, short_id, ticket_id, issue_id):
    if not (ticket and _lane_registry and LaneStatus):
        return
    try:
        lane = _lane_registry.create(
            name=f"sentry-{short_id}",
            metadata={"ticket": ticket_id, "sentry_id": issue_id},
        )
        _lane_registry.advance(lane.id, LaneStatus.IN_PROGRESS)
    except Exception:
        pass


def _process_sentry_issue_row(issue, seen, ticket_map):
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
    existing_ticket = ticket_map.get(title)
    if existing_ticket:
        comment_body = (
            f"New occurrence detected.\n\n"
            f"Sentry: {permalink}\nCulprit: {culprit}\nOccurrences: {count}"
        )
        if sys_info.get("debate_id"):
            comment_body += f"\nDebate ID: {sys_info['debate_id']}"
        _add_comment_to_ticket(existing_ticket, comment_body)
        ticket_id = existing_ticket
    else:
        desc = _build_ticket_description(short_id, level, culprit, count, permalink, sys_info)
        ticket = _create_ticket(f"[{level.upper()}] {title}", desc)
        ticket_id = ticket.get("identifier", "?") if ticket else "failed"
        if ticket:
            ticket_map[title] = ticket_id
        _create_lane_for_sentry_ticket(ticket, short_id, ticket_id, issue_id)
    slack_msg = (
        f":rotating_light: *New Error* | *{title}* | Level: {level} | {count}x | "
        f"Linear: {ticket_id} | <{permalink}|View>"
    )
    if sys_info.get("debate_id"):
        slack_msg += f" | Debate: {sys_info['debate_id']}"
    _post_slack(slack_msg)
    seen.add(issue_id)
    logger.info("Alerted + ticketed: %s -> %s", short_id, ticket_id)


def check_sentry(state):
    if not SENTRY_AUTH_TOKEN:
        return
    logger.info("Checking Sentry...")
    with _monitor_recovery("sentry_check"):
        issues = _fetch_unresolved_sentry_issues()
        if not issues or isinstance(issues, dict):
            return
        seen = set(state.get("seen_sentry_ids", []))
        ticket_map = state.get("error_ticket_map", {})
        for issue in issues:
            _process_sentry_issue_row(issue, seen, ticket_map)
        state["seen_sentry_ids"] = list(seen)[-500:]
        state["error_ticket_map"] = ticket_map


def _sonar_quality_gate_payload():
    return _run_tool(_RUN_TOOL_SONAR, "quality-gate")


def _notify_sonar_gate_error(qg):
    failed = [c for c in qg.get("conditions", []) if c.get("status") == "ERROR"]
    details = "\n".join(
        [
            f"- {c.get('metric', '<unknown>')}: {c.get('value', '<unknown>')} "
            f"(threshold: {c.get('threshold', '<unknown>')})"
            for c in failed
        ]
    )
    ticket = _create_ticket(
        "[QUALITY] SonarQube Quality Gate Failed",
        f"Quality gate check failed:\n{details}\n\nURL: {SONARQUBE_URL}",
    )
    ticket_id = ticket.get("identifier", "?") if ticket else "failed"
    _post_slack(f":x: *Quality Gate FAILED* | {details} | Linear: {ticket_id}")


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
            _notify_sonar_gate_error(qg)
        elif current_status == "OK" and last_status == "ERROR":
            _post_slack(":white_check_mark: *SonarQube Quality Gate PASSED* — issues resolved!")


def _email_poll_interval_blocks(state):
    last_check_str = state.get("last_email_check")
    if not last_check_str:
        return False
    try:
        last_check = datetime.fromisoformat(last_check_str)
        return datetime.now(timezone.utc) - last_check < EMAIL_CHECK_INTERVAL
    except (ValueError, TypeError):
        return False


def _load_unread_emails():
    emails = None
    if _HAS_EMAIL:
        try:
            emails = _email_unread(limit=10)
        except Exception:
            emails = None
    if not emails:
        emails = _run_tool(_RUN_TOOL_EMAIL, "unread", "--limit", "10")
    return emails


def _handle_one_monitor_email(email_msg, seen):
    uid = str(email_msg.get("uid", ""))
    if uid in seen:
        return
    sender = email_msg.get("from", "Unknown")[:60]
    subject = email_msg.get("subject", "(no subject)")[:80]
    if AUTOMATED_SENDERS.search(sender):
        seen.add(uid)
        return
    _post_slack(f":email: *New Email* | From: {sender} | Subject: {subject}")
    seen.add(uid)
    logger.info("Email alert: %s from %s", subject[:40], sender[:30])


def check_emails(state):
    if not CONSILIUM_SUPPORT_EMAIL:
        return
    if _email_poll_interval_blocks(state):
        return
    from agents.config import IMAP_HOST
    if not IMAP_HOST:
        return
    logger.info("Checking emails...")
    with _monitor_recovery("email_check"):
        state["last_email_check"] = datetime.now(timezone.utc).isoformat()
        emails = _load_unread_emails()
        if not emails or not isinstance(emails, dict) or not emails.get("messages"):
            return
        seen = set(state.get("seen_email_ids", []))
        for email_msg in emails["messages"]:
            _handle_one_monitor_email(email_msg, seen)
        state["seen_email_ids"] = list(seen)[-500:]


def _list_closed_pull_requests():
    prs = None
    if _HAS_GITHUB:
        try:
            prs = _github_list_prs(state="closed", limit=30)
        except Exception:
            prs = None
    if not prs:
        prs = _run_tool(_RUN_TOOL_GITHUB, "list-prs", "--state", "closed", "--limit", "30")
    return prs


def _parse_pr_merged_at(merged_at_str, cutoff):
    if not merged_at_str:
        return None
    try:
        merged_at = datetime.fromisoformat(merged_at_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None
    if merged_at < cutoff:
        return None
    return merged_at


def _sentry_has_new_occurrences_after_merge(error_title, merged_at):
    issues = None
    if _HAS_SENTRY:
        try:
            issues = _sentry_list_issues(query=f"is:unresolved {error_title}", limit=5)
        except Exception:
            issues = None
    if not issues:
        issues = _run_tool(
            _RUN_TOOL_SENTRY, "list-issues",
            "--query", f"is:unresolved {error_title}", "--limit", "5",
        )
    if not issues or not isinstance(issues, list):
        return False
    for issue in issues:
        last_seen_str = issue.get("last_seen", "")
        if not last_seen_str:
            continue
        try:
            last_seen = datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
            if last_seen > merged_at:
                return True
        except (ValueError, TypeError):
            continue
    return False


def _process_post_merge_pr(pr, ticket_to_title, merged_pr_tickets, now, cutoff):
    if not pr.get("merged_at") and not pr.get("title"):
        return
    pr_number = str(pr.get("number", ""))
    pr_title = pr.get("title", "")
    pr_branch = pr.get("branch", "")
    merged_at = _parse_pr_merged_at(pr.get("merged_at"), cutoff)
    if merged_at is None:
        return
    from agents.tools.linear_api import extract_ticket_id
    ticket_id = extract_ticket_id(pr_title) or extract_ticket_id(pr_branch)
    if not ticket_id or ticket_id not in ticket_to_title:
        return
    pr_key = f"{pr_number}:{ticket_id}"
    if pr_key in merged_pr_tickets:
        return
    if now - merged_at < timedelta(hours=1):
        return
    error_title = ticket_to_title[ticket_id]
    has_new = _sentry_has_new_occurrences_after_merge(error_title, merged_at)
    merged_pr_tickets[pr_key] = now.isoformat()
    if has_new:
        _post_slack(
            f":warning: Issue still occurring after merge of PR #{pr_number} "
            f"| Ticket: {ticket_id}"
        )
        return
    _post_slack(
        f":white_check_mark: Issue appears resolved after merge "
        f"| PR #{pr_number} | Ticket: {ticket_id}"
    )
    _transition_ticket(ticket_id, "Done")


def check_post_merge(state):
    if not GITHUB_TOKEN or not GITHUB_REPO:
        return
    if not SENTRY_AUTH_TOKEN:
        return

    logger.info("Checking post-merge status...")
    ticket_map = state.get("error_ticket_map", {})
    if not ticket_map:
        return

    merged_pr_tickets = state.get("merged_pr_tickets", {})
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=24)

    prs = _list_closed_pull_requests()
    if not prs or isinstance(prs, dict):
        return

    ticket_to_title = {v: k for k, v in ticket_map.items()}

    for pr in prs:
        _process_post_merge_pr(pr, ticket_to_title, merged_pr_tickets, now, cutoff)

    state["merged_pr_tickets"] = merged_pr_tickets


def run_cycle():
    state = _load_state()
    check_sentry(state)
    check_sonarqube(state)
    check_emails(state)
    check_post_merge(state)
    _save_state(state)


def main():
    parser = argparse.ArgumentParser(description="Consilium Pipeline Monitor")
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
