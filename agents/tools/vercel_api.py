"""Vercel deployment tool for checking deployment status and build logs.

Usage:
  python -m agents.tools.vercel_api list-deployments [--limit 5]
  python -m agents.tools.vercel_api get-deployment --deployment-id DEPLOY_ID
  python -m agents.tools.vercel_api latest
  python -m agents.tools.vercel_api build-logs --deployment-id DEPLOY_ID
"""

import argparse
import json
import sys

import requests

from agents.config import VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID

BASE_URL = "https://api.vercel.com"


def _headers():
    return {"Authorization": f"Bearer {VERCEL_TOKEN}"}


def _check_config():
    if not VERCEL_TOKEN or not VERCEL_PROJECT_ID:
        return {"error": "Vercel not configured (need VERCEL_TOKEN, VERCEL_PROJECT_ID)"}
    return None


def _params():
    p = {}
    if VERCEL_TEAM_ID:
        p["teamId"] = VERCEL_TEAM_ID
    return p


def list_deployments(limit=5):
    err = _check_config()
    if err:
        return err
    params = {**_params(), "projectId": VERCEL_PROJECT_ID, "limit": limit}
    resp = requests.get(f"{BASE_URL}/v6/deployments", headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()
    deploys = []
    for d in resp.json().get("deployments", []):
        deploys.append({
            "id": d.get("uid", ""),
            "url": d.get("url", ""),
            "state": d.get("state", ""),
            "created": d.get("createdAt", ""),
            "source": d.get("meta", {}).get("githubCommitMessage", "")[:100],
            "branch": d.get("meta", {}).get("githubCommitRef", ""),
        })
    return deploys


def get_deployment(deployment_id):
    err = _check_config()
    if err:
        return err
    params = _params()
    resp = requests.get(f"{BASE_URL}/v13/deployments/{deployment_id}", headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()
    d = resp.json()
    return {
        "id": d.get("id", ""),
        "url": d.get("url", ""),
        "state": d.get("readyState", d.get("state", "")),
        "created": d.get("createdAt", ""),
        "ready": d.get("ready", ""),
        "source": d.get("meta", {}).get("githubCommitMessage", "")[:200],
        "branch": d.get("meta", {}).get("githubCommitRef", ""),
        "error": d.get("errorMessage", ""),
    }


def latest():
    deploys = list_deployments(limit=1)
    if isinstance(deploys, dict) and "error" in deploys:
        return deploys
    if not deploys:
        return {"error": "No deployments found"}
    return deploys[0]


def build_logs(deployment_id):
    err = _check_config()
    if err:
        return err
    params = _params()
    resp = requests.get(f"{BASE_URL}/v2/deployments/{deployment_id}/events", headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()
    logs = []
    for event in resp.json():
        if event.get("type") == "stdout" or event.get("type") == "stderr":
            text = event.get("payload", {}).get("text", event.get("text", ""))
            if text:
                logs.append(text)
    return {"deployment_id": deployment_id, "log_lines": len(logs), "logs": logs[-50:]}


def main():
    parser = argparse.ArgumentParser(description="Vercel deployment tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list-deployments")
    p_list.add_argument("--limit", type=int, default=5)

    p_get = sub.add_parser("get-deployment")
    p_get.add_argument("--deployment-id", required=True)

    sub.add_parser("latest")

    p_logs = sub.add_parser("build-logs")
    p_logs.add_argument("--deployment-id", required=True)

    args = parser.parse_args()

    try:
        if args.command == "list-deployments":
            result = list_deployments(args.limit)
        elif args.command == "get-deployment":
            result = get_deployment(args.deployment_id)
        elif args.command == "latest":
            result = latest()
        elif args.command == "build-logs":
            result = build_logs(args.deployment_id)
        json.dump(result, sys.stdout, indent=2)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()
