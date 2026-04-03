"""Linear issue tracker API tool. Manage issues, transitions, assignments, and teams.

Usage:
  python -m agents.tools.linear_api search "query text" [--limit 10]
  python -m agents.tools.linear_api create --title "Bug: ..." --description "..." [--team-id ID]
  python -m agents.tools.linear_api get --identifier CON-42
  python -m agents.tools.linear_api comment --issue-id ID --body "..."
  python -m agents.tools.linear_api transition --identifier CON-42 --state "In Review"
  python -m agents.tools.linear_api assign --identifier CON-42 --email user@example.com
  python -m agents.tools.linear_api my-issues --email user@example.com [--state "In Progress"]
  python -m agents.tools.linear_api states [--team-id ID]
  python -m agents.tools.linear_api teams
"""

import argparse
import json
import re
import sys

import requests

from agents.config import LINEAR_API_KEY, LINEAR_API_URL, LINEAR_TEAM_ID

HEADERS = {
    "Authorization": LINEAR_API_KEY,
    "Content-Type": "application/json",
}

SEARCH_ISSUES_QUERY = """
query SearchIssues($filter: IssueFilter, $limit: Int) {
  issues(filter: $filter, first: $limit) {
    nodes {
      id
      identifier
      title
      url
      state { name }
      assignee { name email }
      createdAt
      updatedAt
    }
  }
}
"""

CREATE_ISSUE_MUTATION = """
mutation CreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id
      identifier
      title
      url
    }
  }
}
"""

GET_ISSUE_QUERY = """
query GetIssue($filter: IssueFilter) {
  issues(filter: $filter, first: 1) {
    nodes {
      id
      identifier
      title
      description
      url
      state { name }
      assignee { name email }
      team { id name }
      createdAt
      updatedAt
      comments(last: 5) {
        nodes {
          id
          body
          createdAt
          user { name email }
        }
      }
    }
  }
}
"""

COMMENT_CREATE_MUTATION = """
mutation CommentCreate($input: CommentCreateInput!) {
  commentCreate(input: $input) {
    success
    comment {
      id
      body
      createdAt
    }
  }
}
"""

ISSUE_UPDATE_MUTATION = """
mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue {
      id
      identifier
      title
      state { name }
      assignee { name email }
    }
  }
}
"""

WORKFLOW_STATES_QUERY = """
query WorkflowStates($filter: WorkflowStateFilter) {
  workflowStates(filter: $filter) {
    nodes {
      id
      name
      type
      position
    }
  }
}
"""

TEAMS_QUERY = """
query Teams {
  teams {
    nodes {
      id
      name
      key
    }
  }
}
"""

USERS_QUERY = """
query Users($filter: UserFilter) {
  users(filter: $filter) {
    nodes {
      id
      name
      email
    }
  }
}
"""

MY_ISSUES_QUERY = """
query MyIssues($filter: IssueFilter) {
  issues(filter: $filter) {
    nodes {
      id
      identifier
      title
      url
      state { name }
      createdAt
      updatedAt
    }
  }
}
"""


def _graphql(query: str, variables: dict | None = None) -> dict:
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = requests.post(LINEAR_API_URL, headers=HEADERS, json=payload, timeout=30)
    resp.raise_for_status()
    body = resp.json()
    if "errors" in body:
        raise RuntimeError(body["errors"][0].get("message", str(body["errors"])))
    return body.get("data", {})


def search_issues(query: str, limit: int = 10) -> list[dict]:
    variables = {
        "filter": {
            "or": [
                {"title": {"containsIgnoreCase": query}},
                {"description": {"containsIgnoreCase": query}},
            ]
        },
        "limit": limit,
    }
    data = _graphql(SEARCH_ISSUES_QUERY, variables)
    return data.get("issues", {}).get("nodes", [])


def create_issue(title: str, description: str, team_id: str | None = None) -> dict:
    inp = {
        "title": title,
        "description": description,
        "teamId": team_id or LINEAR_TEAM_ID,
    }
    data = _graphql(CREATE_ISSUE_MUTATION, {"input": inp})
    result = data.get("issueCreate", {})
    if not result.get("success"):
        raise RuntimeError("Failed to create issue")
    return result["issue"]


def get_issue(identifier: str) -> dict:
    number = int(identifier.split("-")[1])
    team_key = identifier.split("-")[0]
    variables = {
        "filter": {
            "number": {"eq": number},
            "team": {"key": {"eq": team_key}},
        }
    }
    data = _graphql(GET_ISSUE_QUERY, variables)
    nodes = data.get("issues", {}).get("nodes", [])
    if not nodes:
        raise RuntimeError(f"Issue {identifier} not found")
    return nodes[0]


def comment_on_issue(issue_id: str, body: str) -> dict:
    data = _graphql(COMMENT_CREATE_MUTATION, {"input": {"issueId": issue_id, "body": body}})
    result = data.get("commentCreate", {})
    if not result.get("success"):
        raise RuntimeError("Failed to create comment")
    return result["comment"]


def transition_issue(identifier: str, state_name: str) -> dict:
    issue = get_issue(identifier)
    team_id = issue["team"]["id"]

    states_data = _graphql(WORKFLOW_STATES_QUERY, {"filter": {"team": {"id": {"eq": team_id}}}})
    states = states_data.get("workflowStates", {}).get("nodes", [])
    target = next((s for s in states if s["name"].lower() == state_name.lower()), None)
    if not target:
        available = [s["name"] for s in states]
        raise RuntimeError(f"State '{state_name}' not found. Available: {available}")

    data = _graphql(ISSUE_UPDATE_MUTATION, {"id": issue["id"], "input": {"stateId": target["id"]}})
    result = data.get("issueUpdate", {})
    if not result.get("success"):
        raise RuntimeError("Failed to transition issue")
    return result["issue"]


def assign_issue(identifier: str, email: str) -> dict:
    issue = get_issue(identifier)

    users_data = _graphql(USERS_QUERY, {"filter": {"email": {"eq": email}}})
    users = users_data.get("users", {}).get("nodes", [])
    if not users:
        raise RuntimeError(f"User with email '{email}' not found")

    data = _graphql(ISSUE_UPDATE_MUTATION, {"id": issue["id"], "input": {"assigneeId": users[0]["id"]}})
    result = data.get("issueUpdate", {})
    if not result.get("success"):
        raise RuntimeError("Failed to assign issue")
    return result["issue"]


def list_my_issues(email: str, state: str | None = None) -> list[dict]:
    filt: dict = {"assignee": {"email": {"eq": email}}}
    if state:
        filt["state"] = {"name": {"eqIgnoreCase": state}}
    data = _graphql(MY_ISSUES_QUERY, {"filter": filt})
    return data.get("issues", {}).get("nodes", [])


def list_workflow_states(team_id: str | None = None) -> list[dict]:
    tid = team_id or LINEAR_TEAM_ID
    data = _graphql(WORKFLOW_STATES_QUERY, {"filter": {"team": {"id": {"eq": tid}}}})
    return data.get("workflowStates", {}).get("nodes", [])


def list_teams() -> list[dict]:
    data = _graphql(TEAMS_QUERY)
    return data.get("teams", {}).get("nodes", [])


def extract_ticket_id(text: str) -> str | None:
    match = re.search(r"[A-Z]+-\d+", text)
    return match.group(0) if match else None


def _output(data):
    print(json.dumps(data, indent=2, default=str))


def main():
    parser = argparse.ArgumentParser(description="Linear API tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_search = sub.add_parser("search")
    p_search.add_argument("query")
    p_search.add_argument("--limit", type=int, default=10)

    p_create = sub.add_parser("create")
    p_create.add_argument("--title", required=True)
    p_create.add_argument("--description", required=True)
    p_create.add_argument("--team-id")

    p_get = sub.add_parser("get")
    p_get.add_argument("--identifier", required=True)

    p_comment = sub.add_parser("comment")
    p_comment.add_argument("--issue-id", required=True)
    p_comment.add_argument("--body", required=True)

    p_transition = sub.add_parser("transition")
    p_transition.add_argument("--identifier", required=True)
    p_transition.add_argument("--state", required=True)

    p_assign = sub.add_parser("assign")
    p_assign.add_argument("--identifier", required=True)
    p_assign.add_argument("--email", required=True)

    p_my = sub.add_parser("my-issues")
    p_my.add_argument("--email", required=True)
    p_my.add_argument("--state")

    p_states = sub.add_parser("states")
    p_states.add_argument("--team-id")

    sub.add_parser("teams")

    args = parser.parse_args()

    try:
        if args.command == "search":
            _output(search_issues(args.query, args.limit))
        elif args.command == "create":
            _output(create_issue(args.title, args.description, args.team_id))
        elif args.command == "get":
            _output(get_issue(args.identifier))
        elif args.command == "comment":
            _output(comment_on_issue(args.issue_id, args.body))
        elif args.command == "transition":
            _output(transition_issue(args.identifier, args.state))
        elif args.command == "assign":
            _output(assign_issue(args.identifier, args.email))
        elif args.command == "my-issues":
            _output(list_my_issues(args.email, args.state))
        elif args.command == "states":
            _output(list_workflow_states(args.team_id))
        elif args.command == "teams":
            _output(list_teams())
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
