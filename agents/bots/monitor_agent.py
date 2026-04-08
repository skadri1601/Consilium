import argparse
import json
import re
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
from agents.core.utils import run_tool as _run_tool, post_slack as _post_slack

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

STATE_FILE = Path(__file__).resolve().parent.parent / "memory" / "monitor_state.json"

AUTOMATED_SENDERS = re.compile(
    r"(^|<)(no-reply@|noreply@|notifications@|mailer-daemon@)", re.IGNORECASE
)

EMAIL_CHECK_INTERVAL = timedelta(minutes=30)

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
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
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
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, default=str), encoding="utf-8")


def _create_ticket(title, description):
    ticket = None
    if _HAS_LINEAR:
        try:
            ticket = _linear_create_issue(title, description)
        except Exception:
            ticket = None

    if not ticket:
        ticket = _run_tool("agents.tools.linear_api", "create", "--title", title, "--description", description)

    if ticket and ticket.get("identifier"):
        try:
            if _HAS_LINEAR:
                _linear_assign_issue(ticket["identifier"], CONSILIUM_ADMIN_EMAIL)
                _linear_transition_issue(ticket["identifier"], "In Progress")
            else:
                _run_tool("agents.tools.linear_api", "assign", "--identifier", ticket["identifier"], "--email", CONSILIUM_ADMIN_EMAIL)
                _run_tool("agents.tools.linear_api", "transition", "--identifier", ticket["identifier"], "--state", "In Progress")
        except Exception:
            pass
        return ticket
    return None


def _add_comment_to_ticket(identifier, body):
    if _HAS_LINEAR:
        try:
            issue = _linear_get_issue(identifier)
            _linear_comment_on_issue(issue["id"], body)
            return True
        except Exception:
            pass
    try:
        result = _run_tool("agents.tools.linear_api", "get", "--identifier", identifier)
        if result and result.get("id"):
            _run_tool("agents.tools.linear_api", "comment", "--issue-id", result["id"], "--body", body)
            return True
    except Exception:
        pass
    return False


def _transition_ticket(identifier, state_name):
    if _HAS_LINEAR:
        try:
            _linear_transition_issue(identifier, state_name)
            return True
        except Exception:
            pass
    try:
        _run_tool("agents.tools.linear_api", "transition", "--identifier", identifier, "--state", state_name)
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
        detail = _run_tool("agents.tools.sentry_api", "get-issue", "--issue-id", str(issue_id))
    return detail if isinstance(detail, dict) and "error" not in detail else None


def _fetch_latest_event(issue_id):
    events = None
    if _HAS_SENTRY:
        try:
            events = _sentry_issue_events(issue_id, limit=1)
        except Exception:
            events = None
    if not events:
        events = _run_tool("agents.tools.sentry_api", "issue-events", "--issue-id", str(issue_id), "--limit", "1")
    if events and isinstance(events, list) and len(events) > 0:
        return events[0]
    return None


def _extract_system_info(detail, event):
    info = {}
    tags = {}
    if detail and detail.get("tags"):
        for tag_entry in detail["tags"]:
            if isinstance(tag_entry, dict):
                tags.update(tag_entry)
    if event and event.get("tags"):
        event_tags = event["tags"]
        if isinstance(event_tags, dict):
            tags.update(event_tags)
        elif isinstance(event_tags, list):
            for t in event_tags:
                if isinstance(t, dict):
                    tags.update(t)

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
    if tags.get("debate_id"):
        info["debate_id"] = tags["debate_id"]
    if tags.get("environment"):
        info["environment"] = tags["environment"]
    if tags.get("release"):
        info["release"] = tags["release"]
    return info


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


def check_sentry(state):
    if not SENTRY_AUTH_TOKEN:
        return
    logger.info("Checking Sentry...")

    scenario = FailureScenario("sentry_check") if FailureScenario else None
    ctx = _recovery_engine.with_recovery(scenario) if _recovery_engine and scenario else None
    if ctx:
        ctx.__enter__()

    try:
        issues = None
        if _HAS_SENTRY:
            try:
                issues = _sentry_list_issues(query="is:unresolved", limit=20)
            except Exception:
                issues = None
        if not issues:
            issues = _run_tool("agents.tools.sentry_api", "list-issues", "--query", "is:unresolved", "--limit", "20")
        if not issues or isinstance(issues, dict):
            return

        seen = set(state.get("seen_sentry_ids", []))
        ticket_map = state.get("error_ticket_map", {})

        for issue in issues:
            issue_id = issue.get("id", "")
            if issue_id in seen:
                continue

            title = issue.get("title", "Unknown error")
            short_id = issue.get("short_id", "")
            level = issue.get("level", "error")
            count = issue.get("count", "?")
            permalink = issue.get("permalink", "")
            culprit = issue.get("culprit", "")

            if level not in ("error", "fatal"):
                seen.add(issue_id)
                continue

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

                if _lane_registry and ticket and LaneStatus:
                    try:
                        lane = _lane_registry.create(
                            name=f"sentry-{short_id}",
                            metadata={"ticket": ticket_id, "sentry_id": issue_id},
                        )
                        _lane_registry.advance(lane.id, LaneStatus.IN_PROGRESS)
                    except Exception:
                        pass

            slack_msg = (
                f":rotating_light: *New Error* | *{title}* | Level: {level} | {count}x | "
                f"Linear: {ticket_id} | <{permalink}|View>"
            )
            if sys_info.get("debate_id"):
                slack_msg += f" | Debate: {sys_info['debate_id']}"

            _post_slack(slack_msg)

            seen.add(issue_id)
            logger.info("Alerted + ticketed: %s -> %s", short_id, ticket_id)

        state["seen_sentry_ids"] = list(seen)[-500:]
        state["error_ticket_map"] = ticket_map
    except Exception:
        if ctx:
            ctx.__exit__(*__import__("sys").exc_info())
            return
        raise
    else:
        if ctx:
            ctx.__exit__(None, None, None)


def check_sonarqube(state):
    if not SONARQUBE_URL:
        return
    logger.info("Checking SonarQube...")

    scenario = FailureScenario("sonarqube_check") if FailureScenario else None
    ctx = _recovery_engine.with_recovery(scenario) if _recovery_engine and scenario else None
    if ctx:
        ctx.__enter__()

    try:
        qg = _run_tool("agents.tools.sonarqube_api", "quality-gate")
        if not qg or (isinstance(qg, dict) and "error" in qg):
            return

        current_status = qg.get("status")
        last_status = state.get("last_sonar_status")

        if current_status == last_status:
            return

        state["last_sonar_status"] = current_status

        if current_status == "ERROR":
            failed = [c for c in qg.get("conditions", []) if c.get("status") == "ERROR"]
            details = "\n".join(
                [f"- {c['metric']}: {c['value']} (threshold: {c['threshold']})" for c in failed]
            )

            ticket = _create_ticket(
                "[QUALITY] SonarQube Quality Gate Failed",
                f"Quality gate check failed:\n{details}\n\nURL: {SONARQUBE_URL}",
            )
            ticket_id = ticket.get("identifier", "?") if ticket else "failed"

            _post_slack(f":x: *Quality Gate FAILED* | {details} | Linear: {ticket_id}")

        elif current_status == "OK" and last_status == "ERROR":
            _post_slack(":white_check_mark: *SonarQube Quality Gate PASSED* — issues resolved!")
    except Exception:
        if ctx:
            ctx.__exit__(*__import__("sys").exc_info())
            return
        raise
    else:
        if ctx:
            ctx.__exit__(None, None, None)


def check_emails(state):
    if not CONSILIUM_SUPPORT_EMAIL:
        return

    last_check_str = state.get("last_email_check")
    if last_check_str:
        try:
            last_check = datetime.fromisoformat(last_check_str)
            if datetime.now(timezone.utc) - last_check < EMAIL_CHECK_INTERVAL:
                return
        except (ValueError, TypeError):
            pass

    from agents.config import IMAP_HOST
    if not IMAP_HOST:
        return

    logger.info("Checking emails...")

    scenario = FailureScenario("email_check") if FailureScenario else None
    ctx = _recovery_engine.with_recovery(scenario) if _recovery_engine and scenario else None
    if ctx:
        ctx.__enter__()

    try:
        state["last_email_check"] = datetime.now(timezone.utc).isoformat()

        emails = None
        if _HAS_EMAIL:
            try:
                emails = _email_unread(limit=10)
            except Exception:
                emails = None
        if not emails:
            emails = _run_tool("agents.tools.email_imap", "unread", "--limit", "10")
        if not emails or not isinstance(emails, dict) or not emails.get("messages"):
            return

        seen = set(state.get("seen_email_ids", []))
        msgs = emails["messages"]

        for email_msg in msgs:
            uid = str(email_msg.get("uid", ""))
            if uid in seen:
                continue

            sender = email_msg.get("from", "Unknown")[:60]
            subject = email_msg.get("subject", "(no subject)")[:80]

            if AUTOMATED_SENDERS.search(sender):
                seen.add(uid)
                continue

            _post_slack(f":email: *New Email* | From: {sender} | Subject: {subject}")

            seen.add(uid)
            logger.info("Email alert: %s from %s", subject[:40], sender[:30])

        state["seen_email_ids"] = list(seen)[-500:]
    except Exception:
        if ctx:
            ctx.__exit__(*__import__("sys").exc_info())
            return
        raise
    else:
        if ctx:
            ctx.__exit__(None, None, None)


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

    prs = None
    if _HAS_GITHUB:
        try:
            prs = _github_list_prs(state="closed", limit=30)
        except Exception:
            prs = None
    if not prs:
        prs = _run_tool("agents.tools.github_api", "list-prs", "--state", "closed", "--limit", "30")
    if not prs or isinstance(prs, dict):
        return

    ticket_to_title = {v: k for k, v in ticket_map.items()}

    for pr in prs:
        if not pr.get("merged_at") and not pr.get("title"):
            continue

        pr_number = str(pr.get("number", ""))
        pr_title = pr.get("title", "")
        pr_branch = pr.get("branch", "")
        merged_at_str = pr.get("merged_at")

        if not merged_at_str:
            continue

        try:
            merged_at = datetime.fromisoformat(merged_at_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            continue

        if merged_at < cutoff:
            continue

        ticket_id = None
        from agents.tools.linear_api import extract_ticket_id
        ticket_id = extract_ticket_id(pr_title) or extract_ticket_id(pr_branch)

        if not ticket_id or ticket_id not in ticket_to_title:
            continue

        pr_key = f"{pr_number}:{ticket_id}"
        if pr_key in merged_pr_tickets:
            continue

        time_since_merge = now - merged_at
        if time_since_merge < timedelta(hours=1):
            continue

        error_title = ticket_to_title[ticket_id]

        has_new_occurrences = False
        issues = None
        if _HAS_SENTRY:
            try:
                issues = _sentry_list_issues(query=f"is:unresolved {error_title}", limit=5)
            except Exception:
                issues = None
        if not issues:
            issues = _run_tool(
                "agents.tools.sentry_api", "list-issues",
                "--query", f"is:unresolved {error_title}", "--limit", "5",
            )

        if issues and isinstance(issues, list):
            for issue in issues:
                last_seen_str = issue.get("last_seen", "")
                if not last_seen_str:
                    continue
                try:
                    last_seen = datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
                    if last_seen > merged_at:
                        has_new_occurrences = True
                        break
                except (ValueError, TypeError):
                    continue

        merged_pr_tickets[pr_key] = now.isoformat()

        if has_new_occurrences:
            _post_slack(
                f":warning: Issue still occurring after merge of PR #{pr_number} "
                f"| Ticket: {ticket_id}"
            )
        else:
            _post_slack(
                f":white_check_mark: Issue appears resolved after merge "
                f"| PR #{pr_number} | Ticket: {ticket_id}"
            )
            _transition_ticket(ticket_id, "Done")

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
