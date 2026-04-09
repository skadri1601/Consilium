#!/usr/bin/env python3
"""Test script to verify Claude API key and model access for GitHub Actions.

Run: python -m agents.scripts.test_claude_action
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
API_URL = "https://api.anthropic.com/v1/messages"

MODELS_TO_TEST = {
    "claude-haiku-4-5-20251001": "Haiku 4.5 (bot default)",
    "claude-sonnet-4-20250514": "Sonnet 4 (PR review)",
    "claude-sonnet-4-5-20250514": "Sonnet 4.5 (broken - should 404)",
}


def test_model(model_id: str, description: str) -> bool:
    data = json.dumps({
        "model": model_id,
        "max_tokens": 5,
        "messages": [{"role": "user", "content": "hi"}],
    }).encode()

    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )

    try:
        resp = urllib.request.urlopen(req, timeout=15)
        result = json.loads(resp.read())
        resolved = result.get("model", "unknown")
        print(f"  PASS  {model_id} ({description}) -> resolved: {resolved}")
        return True
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode())
        error_type = body.get("error", {}).get("type", "unknown")
        print(f"  FAIL  {model_id} ({description}) -> {e.code} {error_type}")
        return False
    except Exception as e:
        print(f"  ERROR {model_id} ({description}) -> {e}")
        return False


def test_workflow_yaml() -> bool:
    workflow_path = Path(__file__).resolve().parent.parent.parent / ".github" / "workflows" / "claude.yml"
    if not workflow_path.exists():
        print(f"  FAIL  Workflow not found: {workflow_path}")
        return False

    content = workflow_path.read_text()
    checks = []

    if "claude-sonnet-4-5-20250514" in content:
        print("  FAIL  Workflow references broken model claude-sonnet-4-5-20250514")
        checks.append(False)
    else:
        print("  PASS  No broken model references in workflow")
        checks.append(True)

    if "ANTHROPIC_DEFAULT_SONNET_MODEL" in content:
        print("  PASS  ANTHROPIC_DEFAULT_SONNET_MODEL is set")
        checks.append(True)
    else:
        print("  WARN  ANTHROPIC_DEFAULT_SONNET_MODEL not set (will use action default)")
        checks.append(True)

    if "anthropic_api_key" in content or "claude_code_oauth_token" in content:
        print("  PASS  Auth credential configured")
        checks.append(True)
    else:
        print("  FAIL  No auth credential in workflow")
        checks.append(False)

    return all(checks)


def test_model_validation() -> bool:
    try:
        from agents.core.base import sanitize_model, ALLOWED_MODELS
        checks = []

        result = sanitize_model("opus")
        if result == "haiku":
            print("  PASS  opus -> haiku (blocked)")
            checks.append(True)
        else:
            print(f"  FAIL  opus -> {result} (should be haiku)")
            checks.append(False)

        result = sanitize_model("haiku")
        if result == "haiku":
            print("  PASS  haiku -> haiku (allowed)")
            checks.append(True)
        else:
            print(f"  FAIL  haiku -> {result}")
            checks.append(False)

        result = sanitize_model("sonnet")
        if result == "sonnet":
            print("  PASS  sonnet -> sonnet (allowed)")
            checks.append(True)
        else:
            print(f"  FAIL  sonnet -> {result}")
            checks.append(False)

        result = sanitize_model(None)
        if result == "haiku":
            print("  PASS  None -> haiku (fallback)")
            checks.append(True)
        else:
            print(f"  FAIL  None -> {result}")
            checks.append(False)

        return all(checks)
    except ImportError as e:
        print(f"  SKIP  Could not import agents.core.base: {e}")
        return True


def main():
    print("=" * 60)
    print("Claude Code Action Diagnostic Test")
    print("=" * 60)

    if not API_KEY:
        print("\nERROR: ANTHROPIC_API_KEY not set in environment or .env")
        sys.exit(1)

    print(f"\nAPI Key: {API_KEY[:12]}... (length: {len(API_KEY)})")

    print("\n--- Model API Access ---")
    model_results = {}
    for model_id, desc in MODELS_TO_TEST.items():
        model_results[model_id] = test_model(model_id, desc)

    print("\n--- Workflow Configuration ---")
    workflow_ok = test_workflow_yaml()

    print("\n--- Bot Model Validation ---")
    validation_ok = test_model_validation()

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    haiku_ok = model_results.get("claude-haiku-4-5-20251001", False)
    sonnet_ok = model_results.get("claude-sonnet-4-20250514", False)
    broken_404 = not model_results.get("claude-sonnet-4-5-20250514", True)

    all_ok = haiku_ok and workflow_ok and validation_ok and broken_404

    if haiku_ok:
        print("  Haiku access:       OK")
    else:
        print("  Haiku access:       FAILED - API key cannot use haiku")

    if sonnet_ok:
        print("  Sonnet access:      OK")
    else:
        print("  Sonnet access:      FAILED - API key cannot use sonnet")

    if broken_404:
        print("  Broken model 404:   CONFIRMED (claude-sonnet-4-5-20250514 does not exist)")
    else:
        print("  Broken model 404:   UNEXPECTED - model exists now?")

    if workflow_ok:
        print("  Workflow config:    OK")
    else:
        print("  Workflow config:    NEEDS FIX")

    if validation_ok:
        print("  Model validation:   OK")
    else:
        print("  Model validation:   NEEDS FIX")

    print()
    if all_ok:
        print("ALL CHECKS PASSED")
        sys.exit(0)
    else:
        print("SOME CHECKS FAILED - see details above")
        sys.exit(1)


if __name__ == "__main__":
    main()
