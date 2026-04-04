"""SonarQube code quality tool for fetching quality gates, issues, and metrics.

Usage:
  python -m agents.tools.sonarqube_api quality-gate
  python -m agents.tools.sonarqube_api issues [--severity CRITICAL] [--limit 10]
  python -m agents.tools.sonarqube_api metrics
  python -m agents.tools.sonarqube_api hotspots [--limit 10]
"""

import argparse
import json
import sys

import requests

from agents.config import SONARQUBE_URL, SONARQUBE_TOKEN, SONARQUBE_PROJECT_KEY

def _headers():
    return {"Authorization": f"Bearer {SONARQUBE_TOKEN}"}


def _check_config():
    if not SONARQUBE_URL or not SONARQUBE_TOKEN or not SONARQUBE_PROJECT_KEY:
        return {"error": "SonarQube not configured (need SONARQUBE_URL, SONARQUBE_TOKEN, SONARQUBE_PROJECT_KEY)"}
    return None


def _api(path, params=None):
    url = f"{SONARQUBE_URL.rstrip('/')}/api/{path}"
    resp = requests.get(url, headers=_headers(), params=params or {}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def quality_gate():
    err = _check_config()
    if err:
        return err
    data = _api("qualitygates/project_status", {"projectKey": SONARQUBE_PROJECT_KEY})
    status = data.get("projectStatus", {})
    conditions = []
    for c in status.get("conditions", []):
        conditions.append({
            "metric": c.get("metricKey", ""),
            "status": c.get("status", ""),
            "value": c.get("actualValue", ""),
            "threshold": c.get("errorThreshold", ""),
        })
    return {
        "status": status.get("status", "UNKNOWN"),
        "conditions": conditions,
    }


def issues(severity=None, limit=10):
    err = _check_config()
    if err:
        return err
    params = {
        "componentKeys": SONARQUBE_PROJECT_KEY,
        "ps": limit,
        "resolved": "false",
        "s": "SEVERITY",
    }
    if severity:
        params["severities"] = severity.upper()
    data = _api("issues/search", params)
    result = []
    for i in data.get("issues", []):
        result.append({
            "key": i.get("key", ""),
            "severity": i.get("severity", ""),
            "type": i.get("type", ""),
            "message": i.get("message", ""),
            "component": i.get("component", "").split(":")[-1],
            "line": i.get("line"),
            "status": i.get("status", ""),
            "effort": i.get("effort", ""),
            "created": i.get("creationDate", ""),
        })
    return {
        "total": data.get("total", 0),
        "issues": result,
    }


def metrics():
    err = _check_config()
    if err:
        return err
    metric_keys = "bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc,sqale_rating,reliability_rating,security_rating"
    data = _api("measures/component", {
        "component": SONARQUBE_PROJECT_KEY,
        "metricKeys": metric_keys,
    })
    measures = {}
    for m in data.get("component", {}).get("measures", []):
        measures[m["metric"]] = m.get("value", "N/A")
    return measures


def hotspots(limit=10):
    err = _check_config()
    if err:
        return err
    data = _api("hotspots/search", {
        "projectKey": SONARQUBE_PROJECT_KEY,
        "ps": limit,
        "status": "TO_REVIEW",
    })
    result = []
    for h in data.get("hotspots", []):
        result.append({
            "key": h.get("key", ""),
            "message": h.get("message", ""),
            "component": h.get("component", "").split(":")[-1],
            "line": h.get("line"),
            "status": h.get("status", ""),
            "vulnerability_probability": h.get("vulnerabilityProbability", ""),
        })
    return {
        "total": data.get("paging", {}).get("total", 0),
        "hotspots": result,
    }


def main():
    parser = argparse.ArgumentParser(description="SonarQube code quality tool")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("quality-gate")

    p_issues = sub.add_parser("issues")
    p_issues.add_argument("--severity", default=None)
    p_issues.add_argument("--limit", type=int, default=10)

    sub.add_parser("metrics")

    p_hotspots = sub.add_parser("hotspots")
    p_hotspots.add_argument("--limit", type=int, default=10)

    args = parser.parse_args()

    try:
        if args.command == "quality-gate":
            result = quality_gate()
        elif args.command == "issues":
            result = issues(args.severity, args.limit)
        elif args.command == "metrics":
            result = metrics()
        elif args.command == "hotspots":
            result = hotspots(args.limit)
        json.dump(result, sys.stdout, indent=2)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()
