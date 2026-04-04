TOOL_DEFINITIONS = [
    {
        "name": "Email (IMAP)",
        "module": "agents.tools.email_imap",
        "commands": {
            "inbox": {"args": "[--limit 10]", "desc": "List latest emails"},
            "unread": {"args": "[--limit 10]", "desc": "List unread emails"},
            "search": {"args": '--query "from:NAME"', "desc": "Search by sender/subject/text"},
            "read": {"args": "--uid UID", "desc": "Read full email by UID"},
            "thread": {"args": "--uid UID", "desc": "Get full conversation thread"},
            "send": {"args": '--to X --subject "Y" --body "Z"', "desc": "Send new email"},
            "reply": {"args": "--uid UID --body TEXT", "desc": "Reply to email"},
        },
    },
    {
        "name": "Linear",
        "module": "agents.tools.linear_api",
        "commands": {
            "search": {"args": '"query" [--limit 10]', "desc": "Search issues"},
            "create": {"args": '--title "..." --description "..."', "desc": "Create issue"},
            "get": {"args": "--identifier MYC-42", "desc": "Get issue details"},
            "comment": {"args": '--issue-id ID --body "..."', "desc": "Add comment"},
            "transition": {"args": '--identifier MYC-42 --state "In Progress"', "desc": "Change state"},
            "assign": {"args": "--identifier MYC-42 --email USER@EMAIL", "desc": "Assign issue"},
            "my-issues": {"args": "--email USER@EMAIL", "desc": "List assigned issues"},
            "states": {"args": "", "desc": "List workflow states"},
            "teams": {"args": "", "desc": "List teams"},
        },
    },
    {
        "name": "Sentry",
        "module": "agents.tools.sentry_api",
        "commands": {
            "list-issues": {"args": '[--query "is:unresolved"] [--limit 10]', "desc": "List issues"},
            "get-issue": {"args": "--issue-id ID", "desc": "Get issue details"},
            "issue-events": {"args": "--issue-id ID [--limit 5]", "desc": "Get error events"},
            "stats": {"args": "[--period 24h]", "desc": "Error statistics overview"},
            "search": {"args": '--query "error text"', "desc": "Search errors"},
        },
    },
    {
        "name": "SonarQube",
        "module": "agents.tools.sonarqube_api",
        "commands": {
            "quality-gate": {"args": "", "desc": "Check quality gate pass/fail"},
            "issues": {"args": "[--severity CRITICAL] [--limit 10]", "desc": "List code issues"},
            "metrics": {"args": "", "desc": "Get coverage, bugs, smells, ratings"},
            "hotspots": {"args": "[--limit 10]", "desc": "Security hotspots"},
        },
    },
    {
        "name": "Vercel",
        "module": "agents.tools.vercel_api",
        "commands": {
            "latest": {"args": "", "desc": "Latest deployment status"},
            "list-deployments": {"args": "[--limit 5]", "desc": "Recent deployments"},
            "get-deployment": {"args": "--deployment-id ID", "desc": "Deployment details"},
            "build-logs": {"args": "--deployment-id ID", "desc": "Build log output"},
        },
    },
    {
        "name": "GitHub",
        "module": "agents.tools.github_api",
        "commands": {
            "list-prs": {"args": "[--state open] [--limit 10]", "desc": "List pull requests"},
            "get-pr": {"args": "--number N", "desc": "PR details"},
            "find-ticket-prs": {"args": "--ticket MYC-42", "desc": "PRs for a ticket"},
        },
    },
    {
        "name": "Database",
        "module": "agents.tools.db_lookup",
        "commands": {
            "user": {"args": "--email X or --id Y", "desc": "User profile + debate count"},
            "debate": {"args": "--id ID", "desc": "Debate session details"},
            "debates": {"args": "--user-email X [--limit 10]", "desc": "User's debate history"},
            "usage": {"args": "--user-email X [--days 30]", "desc": "Token/cost stats"},
            "stats": {"args": "", "desc": "Global platform stats"},
        },
    },
    {
        "name": "Stripe",
        "module": "agents.tools.stripe_api",
        "commands": {
            "get-subscription": {"args": "--email X", "desc": "Subscription status"},
            "cancel": {"args": "--email X [--reason TEXT]", "desc": "Cancel subscription"},
            "refund": {"args": "--email X --reason TEXT", "desc": "Refund latest invoice"},
            "invoices": {"args": "--email X [--limit 5]", "desc": "Invoice history"},
        },
    },
    {
        "name": "Prioritizer",
        "module": "agents.tools.prioritizer",
        "commands": {
            "recommend": {"args": "", "desc": "Ranked task recommendations (JSON)"},
            "summary": {"args": "", "desc": "Formatted priority list"},
        },
    },
    {
        "name": "Notifications",
        "module": "agents.tools.notify_slack",
        "commands": {
            "": {"args": '--action "X" --summary "Y" [--link URL] [--escalate] [--severity info|warning|error]', "desc": "Send Slack notification"},
        },
    },
    {
        "name": "Memory",
        "module": "agents.tools.memory_tool",
        "commands": {
            "read": {"args": "[--key KEY]", "desc": "Read shared memory"},
            "write": {"args": "--key K --value V", "desc": "Write to memory"},
            "search": {"args": '--query "text"', "desc": "Search memory"},
            "track": {"args": "--type X --id Y --status Z --summary S", "desc": "Track processed item"},
            "check": {"args": "--type X --id Y", "desc": "Check if item processed"},
            "context": {"args": "--email X --note Y", "desc": "Add user context"},
        },
    },
]


def format_tools_prompt():
    lines = []
    for tool in TOOL_DEFINITIONS:
        lines.append(f"### {tool['name']}")
        for cmd, info in tool["commands"].items():
            prefix = f"python -m {tool['module']}"
            if cmd:
                prefix += f" {cmd}"
            lines.append(f"  `{prefix} {info['args']}` — {info['desc']}")
        lines.append("")
    return "\n".join(lines)


def get_tool_module(name):
    for tool in TOOL_DEFINITIONS:
        if tool["name"].lower() == name.lower():
            return tool["module"]
    return None
