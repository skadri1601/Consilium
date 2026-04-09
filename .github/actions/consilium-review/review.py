from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx

API_URL = os.environ.get("CONSILIUM_API_URL", "http://localhost:4000/api/v1").rstrip("/")
MODE = os.environ.get("CONSILIUM_MODE", "red-team")
MODELS_RAW = os.environ.get("CONSILIUM_MODELS", "")
MAX_ROUNDS = int(os.environ.get("CONSILIUM_MAX_ROUNDS", "3"))
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
PR_NUMBER = os.environ["PR_NUMBER"]
REPO = os.environ["GITHUB_REPOSITORY"]

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")


def read_diff() -> str:
    diff_path = Path("/tmp/pr_diff.txt")
    if not diff_path.exists():
        print("::error::PR diff file not found")
        sys.exit(1)
    text = diff_path.read_text(encoding="utf-8")
    if not text.strip():
        print("::notice::PR diff is empty, skipping review")
        sys.exit(0)
    return text


def build_topic(diff: str) -> str:
    max_chars = 8000
    truncated = diff[:max_chars]
    if len(diff) > max_chars:
        truncated += "\n\n... (diff truncated)"
    return (
        "Review the following pull request code changes for security vulnerabilities, "
        "bugs, performance issues, and code quality concerns.\n\n"
        f"```diff\n{truncated}\n```"
    )


def build_payload(topic: str) -> dict:
    models = [m.strip() for m in MODELS_RAW.split(",") if m.strip()] if MODELS_RAW else None

    payload: dict = {
        "topic": topic,
        "mode": MODE,
        "maxRounds": MAX_ROUNDS,
    }

    if models:
        payload["models"] = models
    else:
        payload["models"] = ["gpt-4o-mini", "claude-3-5-haiku-latest"]

    api_keys: dict = {}
    if ANTHROPIC_API_KEY:
        api_keys["anthropicKey"] = ANTHROPIC_API_KEY
    if OPENAI_API_KEY:
        api_keys["openaiKey"] = OPENAI_API_KEY
    if api_keys:
        payload["apiKeys"] = api_keys

    return payload


def run_deliberation(payload: dict) -> dict:
    client = httpx.Client(base_url=API_URL, timeout=300.0)
    try:
        response = client.post("/deliberation", json=payload)
        if response.status_code >= 400:
            print(f"::error::Consilium API returned {response.status_code}: {response.text}")
            sys.exit(1)
        data = response.json()

        if "id" in data and data.get("status") != "completed":
            return poll_deliberation(client, data["id"])

        return data
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


def format_review(result: dict) -> str:
    sections = ["## Consilium Multi-Model Review\n"]

    mode_label = MODE.replace("-", " ").title()
    sections.append(f"**Mode:** {mode_label}\n")

    golden = result.get("golden_prompt") or result.get("goldenPrompt")
    if golden:
        sections.append(f"### Consensus\n\n{golden}\n")

    dissent = result.get("dissent_report") or result.get("dissentReport")
    if dissent:
        sections.append(f"### Dissenting Views\n\n{dissent}\n")

    attacks = result.get("attacks")
    if attacks and isinstance(attacks, list):
        sections.append("### Security Findings\n")
        for attack in attacks:
            desc = attack.get("description", attack.get("content", str(attack)))
            severity = attack.get("severity", "")
            prefix = f"**[{severity.upper()}]** " if severity else ""
            sections.append(f"- {prefix}{desc}")
        sections.append("")

    judgments = result.get("judgments")
    if judgments and isinstance(judgments, list):
        sections.append("### Judgments\n")
        for j in judgments:
            verdict = j.get("verdict", j.get("content", str(j)))
            sections.append(f"- {verdict}")
        sections.append("")

    votes = result.get("votes")
    if votes and isinstance(votes, dict):
        sections.append("### Votes\n")
        for model, vote in votes.items():
            sections.append(f"- **{model}**: {vote}")
        sections.append("")

    confidence = result.get("confidence_scores") or result.get("confidenceScores")
    if confidence and isinstance(confidence, dict):
        sections.append("### Confidence\n")
        for model, score in confidence.items():
            pct = f"{float(score) * 100:.0f}%" if isinstance(score, (int, float)) else str(score)
            sections.append(f"- **{model}**: {pct}")
        sections.append("")

    cost = result.get("cost")
    if cost is not None:
        sections.append(f"\n---\n*Deliberation cost: ${float(cost):.4f}*")

    return "\n".join(sections)


def post_comment(body: str) -> None:
    url = f"https://api.github.com/repos/{REPO}/issues/{PR_NUMBER}/comments"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    response = httpx.post(url, json={"body": body}, headers=headers, timeout=30.0)
    if response.status_code >= 400:
        print(f"::error::Failed to post comment: {response.status_code} {response.text}")
        sys.exit(1)
    print(f"::notice::Review comment posted on PR #{PR_NUMBER}")


def main() -> None:
    diff = read_diff()
    topic = build_topic(diff)
    payload = build_payload(topic)

    print(f"Running {MODE} deliberation against {API_URL}...")
    result = run_deliberation(payload)

    body = format_review(result)
    post_comment(body)


if __name__ == "__main__":
    main()
