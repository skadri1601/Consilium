import argparse

from agents.config import SENTRY_AUTH_TOKEN, SONARQUBE_URL, VERCEL_TOKEN
from agents.core.base import setup_logging
from agents.core.utils import run_tool as _run_tool

logger = setup_logging("briefing")


def _sentry_section():
    if not SENTRY_AUTH_TOKEN:
        return []
    sentry = _run_tool("agents.tools.sentry_api", "stats")
    if sentry and isinstance(sentry, dict) and "error" not in sentry:
        lines = [f":rotating_light: *Sentry:* {sentry.get('unresolved_count', '?')} unresolved"]
        for issue in sentry.get("top_issues", [])[:3]:
            lines.append(f"  - [{issue.get('level', '?')}] {issue.get('title', '?')} ({issue.get('count', '?')}x)")
        return lines
    return [":rotating_light: *Sentry:* could not fetch"]


def _vercel_section():
    if not VERCEL_TOKEN:
        return []
    deploy = _run_tool("agents.tools.vercel_api", "latest")
    if deploy and isinstance(deploy, dict) and "error" not in deploy:
        state = deploy.get("state", "?")
        icon = ":white_check_mark:" if state == "READY" else ":x:"
        lines = [f"{icon} *Vercel:* {state}"]
        if deploy.get("source"):
            lines.append(f"  {deploy['source'][:80]}")
        return lines
    return [":x: *Vercel:* could not fetch"]


def _sonar_section():
    if not SONARQUBE_URL:
        return []
    sonar = _run_tool("agents.tools.sonarqube_api", "quality-gate")
    if sonar and isinstance(sonar, dict) and "error" not in sonar:
        status = sonar.get("status", "?")
        icon = ":white_check_mark:" if status == "OK" else ":x:"
        return [f"{icon} *SonarQube:* {status}"]
    return [":x: *SonarQube:* could not fetch"]


def _platform_section():
    stats = _run_tool("agents.tools.db_lookup", "stats")
    if stats and isinstance(stats, dict):
        return [
            f":bar_chart: *Platform:* {stats.get('total_users', '?')} users | "
            f"{stats.get('debates_today', '?')} debates today"
        ]
    return []


def build_briefing():
    parts = [":sunrise: *Daily Briefing*\n"]
    parts.extend(_sentry_section())
    parts.append("")
    parts.extend(_vercel_section())
    parts.append("")
    parts.extend(_sonar_section())
    parts.append("")
    parts.extend(_platform_section())
    return "\n".join(parts)


def main():
    parser = argparse.ArgumentParser(description="Consilium daily briefing")
    parser.add_argument("--print-only", action="store_true", help="ignored; digest always goes to stdout")
    parser.parse_args()

    text = build_briefing()
    logger.info("Briefing length %d chars", len(text))
    print(text)


if __name__ == "__main__":
    main()
