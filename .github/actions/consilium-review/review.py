from __future__ import annotations

import json
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

import httpx

API_URL = os.environ.get("CONSILIUM_API_URL", "").rstrip("/")
MODE = os.environ.get("CONSILIUM_MODE", "redteam")
MODELS_RAW = os.environ.get("CONSILIUM_MODELS", "claude-sonnet-4-6,gpt-5.4")
MAX_ROUNDS = int(os.environ.get("CONSILIUM_MAX_ROUNDS", "3"))
MAX_DIFF_SIZE = int(os.environ.get("CONSILIUM_MAX_DIFF_SIZE", "12000"))
POST_AS_REVIEW = os.environ.get("CONSILIUM_POST_AS_REVIEW", "true").lower() == "true"
FAIL_ON_CRITICAL = os.environ.get("CONSILIUM_FAIL_ON_CRITICAL", "false").lower() == "true"
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
PR_NUMBER = os.environ["PR_NUMBER"]
PR_SHA = os.environ.get("PR_SHA", "")
REPO = os.environ["GITHUB_REPOSITORY"]
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

GH_API = "https://api.github.com"
GH_HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

REVIEW_CATEGORIES = [
    "security_vulnerabilities",
    "bugs_and_errors",
    "performance_issues",
    "code_quality",
    "edge_cases",
]

SEVERITY_EMOJI = {
    "critical": "\U0001f534",
    "high": "\U0001f7e0",
    "medium": "\U0001f7e1",
    "low": "\U0001f535",
    "info": "\u26aa",
}


@dataclass
class Finding:
    category: str
    severity: str
    title: str
    description: str
    file_path: str = ""
    line: int = 0
    suggestion: str = ""
    model: str = ""


@dataclass
class ReviewResult:
    findings: list[Finding] = field(default_factory=list)
    summary: str = ""
    consensus: str = ""
    dissent: str = ""
    cost: float = 0.0
    models_used: list[str] = field(default_factory=list)


def read_diff() -> str:
    env_path = os.environ.get("CONSILIUM_PR_DIFF_FILE", "").strip()
    if env_path:
        diff_path = Path(env_path)
    else:
        base = os.environ.get("RUNNER_TEMP", "").strip() or tempfile.gettempdir()
        diff_path = Path(base) / "consilium_pr_diff.txt"
    if not diff_path.exists():
        print("::error::PR diff file not found")
        sys.exit(1)
    text = diff_path.read_text(encoding="utf-8")
    if not text.strip():
        print("::notice::PR diff is empty, skipping review")
        sys.exit(0)
    if MAX_DIFF_SIZE > 0 and len(text) > MAX_DIFF_SIZE:
        text = text[:MAX_DIFF_SIZE] + "\n\n... (diff truncated)"
    return text


def parse_diff_files(diff: str) -> dict[str, list[tuple[int, str]]]:
    files: dict[str, list[tuple[int, str]]] = {}
    current_file = ""
    current_line = 0
    for line in diff.split("\n"):
        if line.startswith("+++ b/"):
            current_file = line[6:]
            files.setdefault(current_file, [])
        elif line.startswith("@@ "):
            match = re.search(r"\+(\d+)", line)
            if match:
                current_line = int(match.group(1))
        elif current_file:
            if line.startswith("+") and not line.startswith("+++"):
                files[current_file].append((current_line, line[1:]))
                current_line += 1
            elif not line.startswith("-"):
                current_line += 1
    return files


def build_review_prompt(diff: str) -> str:
    return (
        "You are an expert code reviewer performing a multi-model deliberation review. "
        "Analyze the following pull request diff for issues across these categories:\n"
        "1. Security vulnerabilities (injection, auth bypass, data exposure, SSRF, etc.)\n"
        "2. Bugs and errors (null refs, off-by-one, race conditions, logic errors)\n"
        "3. Performance issues (N+1 queries, memory leaks, unnecessary allocations)\n"
        "4. Code quality (naming, structure, duplication, missing error handling)\n"
        "5. Edge cases (boundary conditions, empty inputs, concurrent access)\n\n"
        "For each finding, respond with a JSON array of objects:\n"
        '{"findings": [\n'
        '  {"category": "<category>", "severity": "critical|high|medium|low|info", '
        '"title": "<short title>", "description": "<explanation>", '
        '"file_path": "<file from diff>", "line": <line number or 0>, '
        '"suggestion": "<fix suggestion or empty>"}\n'
        "]}\n\n"
        "If no issues found, return {\"findings\": []}.\n"
        "Only report real issues, not style preferences.\n\n"
        f"```diff\n{diff}\n```"
    )


def call_anthropic(prompt: str, model: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def call_openai(prompt: str, model: str) -> str:
    import openai

    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content or ""


def call_model(prompt: str, model: str) -> str:
    if "claude" in model or "anthropic" in model:
        return call_anthropic(prompt, resolve_model_id(model))
    if "gpt" in model or "o1" in model or "o3" in model:
        return call_openai(prompt, model)
    if ANTHROPIC_API_KEY:
        return call_anthropic(prompt, resolve_model_id(model))
    print(f"::warning::No provider for model {model}, skipping")
    return '{"findings": []}'


def resolve_model_id(model: str) -> str:
    aliases = {
        "claude-sonnet-4-6": "claude-sonnet-4-6",
        "claude-opus-4-7": "claude-opus-4-7",
        "claude-haiku-4-5": "claude-haiku-4-5-20251001",
    }
    return aliases.get(model, model)


def extract_json(raw: str) -> dict | None:
    text = raw.strip()
    max_scan = 500_000
    if len(text) > max_scan:
        text = text[:max_scan]
    idx = text.find("{")
    if idx == -1:
        return None
    decoder = json.JSONDecoder()
    try:
        obj, _ = decoder.raw_decode(text, idx)
    except json.JSONDecodeError:
        return None
    return obj if isinstance(obj, dict) else None


def parse_findings(raw: str, model: str) -> list[Finding]:
    data = extract_json(raw)
    if not data:
        return []
    raw_findings = data.get("findings", [])
    if not isinstance(raw_findings, list):
        return []
    findings = []
    for f in raw_findings:
        if not isinstance(f, dict):
            continue
        severity = f.get("severity", "medium")
        if severity not in ("critical", "high", "medium", "low", "info"):
            severity = "medium"
        findings.append(Finding(
            category=f.get("category", "code_quality"),
            severity=severity,
            title=f.get("title", "Untitled"),
            description=f.get("description", ""),
            file_path=f.get("file_path", ""),
            line=int(f.get("line", 0)),
            suggestion=f.get("suggestion", ""),
            model=model,
        ))
    return findings


def run_via_api(diff: str) -> ReviewResult:
    models = [m.strip() for m in MODELS_RAW.split(",") if m.strip()]
    payload = {
        "topic": build_review_prompt(diff),
        "mode": MODE,
        "maxRounds": MAX_ROUNDS,
        "models": models,
    }
    api_keys: dict = {}
    if ANTHROPIC_API_KEY:
        api_keys["anthropicKey"] = ANTHROPIC_API_KEY
    if OPENAI_API_KEY:
        api_keys["openaiKey"] = OPENAI_API_KEY
    if api_keys:
        payload["apiKeys"] = api_keys

    client = httpx.Client(base_url=API_URL, timeout=300.0)
    try:
        response = client.post("/deliberation", json=payload)
        if response.status_code >= 400:
            print(f"::error::Consilium API returned {response.status_code}: {response.text}")
            sys.exit(1)
        data = response.json()

        if "id" in data and data.get("status") != "completed":
            data = poll_deliberation(client, data["id"])

        return parse_api_result(data, models)
    finally:
        client.close()


def poll_deliberation(client: httpx.Client, deliberation_id: str) -> dict:
    import time
    for _ in range(150):
        response = client.get(f"/deliberation/{deliberation_id}")
        if response.status_code >= 400:
            print(f"::error::Polling failed: {response.status_code}")
            sys.exit(1)
        data = response.json()
        if data.get("status") == "completed":
            return data.get("result", data)
        if data.get("status") == "failed":
            print(f"::error::Deliberation failed: {data.get('error', 'unknown')}")
            sys.exit(1)
        time.sleep(2)
    print("::error::Deliberation timed out after 5 minutes")
    sys.exit(1)


def parse_api_result(data: dict, models: list[str]) -> ReviewResult:
    result = ReviewResult(models_used=models)
    result.consensus = data.get("golden_prompt") or data.get("goldenPrompt") or ""
    result.dissent = data.get("dissent_report") or data.get("dissentReport") or ""
    result.cost = float(data.get("cost", 0))

    for attack in data.get("attacks", []):
        if not isinstance(attack, dict):
            continue
        result.findings.append(Finding(
            category="security_vulnerabilities",
            severity=attack.get("severity", "medium"),
            title=attack.get("category", "Finding"),
            description=attack.get("description", attack.get("content", str(attack))),
            model=attack.get("attacker_id", ""),
        ))

    return result


def run_direct(diff: str) -> ReviewResult:
    models = [m.strip() for m in MODELS_RAW.split(",") if m.strip()]
    prompt = build_review_prompt(diff)
    all_findings: list[Finding] = []

    for model in models:
        print(f"::group::Running review with {model}")
        try:
            raw = call_model(prompt, model)
            findings = parse_findings(raw, model)
            all_findings.extend(findings)
            print(f"Found {len(findings)} issues")
        except Exception as e:
            print(f"::warning::Model {model} failed: {e}")
        print("::endgroup::")

    result = ReviewResult(findings=all_findings, models_used=models)

    if len(models) > 1 and all_findings:
        result.summary = synthesize_findings(all_findings, models)

    return result


def synthesize_findings(findings: list[Finding], models: list[str]) -> str:
    findings_json = json.dumps([{
        "category": f.category,
        "severity": f.severity,
        "title": f.title,
        "description": f.description,
        "file_path": f.file_path,
        "model": f.model,
    } for f in findings], indent=2)

    judge_model = models[0]
    prompt = (
        "You are a judge synthesizing code review findings from multiple AI models. "
        "Deduplicate overlapping findings, confirm severity levels, and produce a "
        "brief executive summary (3-5 sentences) of the most important issues.\n\n"
        f"Findings:\n{findings_json}\n\n"
        "Respond with a plain text summary only, no JSON."
    )
    try:
        return call_model(prompt, judge_model)
    except Exception as e:
        print(f"::warning::Synthesis failed: {e}")
        return ""


def deduplicate_findings(findings: list[Finding]) -> list[Finding]:
    seen: dict[str, Finding] = {}
    severity_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}
    for f in findings:
        key = f"{f.file_path}:{f.line}:{f.category}:{f.title[:40]}"
        if key not in seen or severity_rank.get(f.severity, 0) > severity_rank.get(seen[key].severity, 0):
            seen[key] = f
    return list(seen.values())


def _finding_location(f: Finding) -> str:
    if not f.file_path:
        return ""
    location = f" in `{f.file_path}`"
    if f.line > 0:
        location += f":{f.line}"
    return location


def _format_findings_sections(findings: list[Finding]) -> list[str]:
    by_severity: dict[str, list[Finding]] = {}
    for f in findings:
        by_severity.setdefault(f.severity, []).append(f)
    severity_order = ["critical", "high", "medium", "low", "info"]
    sections: list[str] = ["### Findings\n"]
    for sev in severity_order:
        group = by_severity.get(sev, [])
        if not group:
            continue
        emoji = SEVERITY_EMOJI.get(sev, "")
        sections.append(f"#### {emoji} {sev.upper()} ({len(group)})\n")
        for f in group:
            sections.append(f"- **{f.title}**{_finding_location(f)}")
            sections.append(f"  {f.description}")
            if f.suggestion:
                sections.append(f"  > **Suggestion:** {f.suggestion}")
            if f.model:
                sections.append(f"  _(found by {f.model})_")
            sections.append("")
    return sections


def _format_review_stats_line(findings: list[Finding], cost: float) -> str:
    stats = [f"Findings: {len(findings)}"]
    critical_count = sum(1 for f in findings if f.severity == "critical")
    high_count = sum(1 for f in findings if f.severity == "high")
    if critical_count:
        stats.append(f"Critical: {critical_count}")
    if high_count:
        stats.append(f"High: {high_count}")
    if cost > 0:
        stats.append(f"Cost: ${cost:.4f}")
    return f"\n---\n*{' | '.join(stats)}*"


def format_review_body(result: ReviewResult) -> str:
    sections = ["## Consilium Multi-Model Review\n"]

    mode_label = MODE.replace("-", " ").replace("_", " ").title()
    models_str = ", ".join(f"`{m}`" for m in result.models_used)
    sections.append(f"**Mode:** {mode_label} | **Models:** {models_str}\n")

    if result.summary:
        sections.append(f"### Summary\n\n{result.summary}\n")

    if result.consensus:
        sections.append(f"### Consensus\n\n{result.consensus}\n")

    findings = deduplicate_findings(result.findings)
    if findings:
        sections.extend(_format_findings_sections(findings))
    else:
        sections.append("### Findings\n\nNo issues found.\n")

    if result.dissent:
        sections.append(f"### Dissenting Views\n\n{result.dissent}\n")

    sections.append(_format_review_stats_line(findings, result.cost))

    return "\n".join(sections)


def post_review(body: str, findings: list[Finding]) -> None:
    if POST_AS_REVIEW and PR_SHA:
        post_pr_review(body, findings)
    else:
        post_issue_comment(body)


def post_pr_review(body: str, findings: list[Finding]) -> None:
    comments = []
    for f in findings:
        if f.file_path and f.line > 0:
            comment_body = f"**{SEVERITY_EMOJI.get(f.severity, '')} {f.severity.upper()}: {f.title}**\n\n{f.description}"
            if f.suggestion:
                comment_body += f"\n\n**Suggestion:** {f.suggestion}"
            comments.append({
                "path": f.file_path,
                "line": f.line,
                "body": comment_body,
            })

    critical_count = sum(1 for f in findings if f.severity == "critical")
    event = "COMMENT"
    if critical_count > 0:
        event = "REQUEST_CHANGES"

    payload: dict = {
        "body": body,
        "event": event,
        "commit_id": PR_SHA,
    }
    if comments:
        payload["comments"] = comments[:50]

    url = f"{GH_API}/repos/{REPO}/pulls/{PR_NUMBER}/reviews"
    response = httpx.post(url, json=payload, headers=GH_HEADERS, timeout=30.0)
    if response.status_code >= 400:
        print(f"::warning::PR review post failed ({response.status_code}), falling back to comment")
        post_issue_comment(body)
        return
    print(f"::notice::PR review posted on #{PR_NUMBER}")


def post_issue_comment(body: str) -> None:
    url = f"{GH_API}/repos/{REPO}/issues/{PR_NUMBER}/comments"
    response = httpx.post(url, json={"body": body}, headers=GH_HEADERS, timeout=30.0)
    if response.status_code >= 400:
        print(f"::error::Failed to post comment: {response.status_code} {response.text}")
        sys.exit(1)
    print(f"::notice::Review comment posted on PR #{PR_NUMBER}")


def set_outputs(findings: list[Finding], body: str) -> None:
    github_output = os.environ.get("GITHUB_OUTPUT", "")
    if not github_output:
        return
    critical_count = sum(1 for f in findings if f.severity == "critical")
    with open(github_output, "a", encoding="utf-8") as fh:
        fh.write(f"findings_count={len(findings)}\n")
        fh.write(f"critical_count={critical_count}\n")
        delimiter = "CONSILIUM_EOF_MARKER"
        fh.write(f"review_body<<{delimiter}\n{body}\n{delimiter}\n")


def main() -> None:
    diff = read_diff()

    if API_URL:
        print(f"Running {MODE} deliberation via API at {API_URL}...")
        result = run_via_api(diff)
    else:
        print(f"Running {MODE} review directly with models: {MODELS_RAW}...")
        result = run_direct(diff)

    findings = deduplicate_findings(result.findings)
    body = format_review_body(result)

    post_review(body, findings)
    set_outputs(findings, body)

    critical_count = sum(1 for f in findings if f.severity == "critical")
    if FAIL_ON_CRITICAL and critical_count > 0:
        print(f"::error::{critical_count} critical finding(s) detected")
        sys.exit(1)


if __name__ == "__main__":
    main()
