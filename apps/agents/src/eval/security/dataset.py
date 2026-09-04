from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class SecurityCase:
    case_id: str
    cwe: str
    language: str
    vulnerable_code: str
    patched_code: str
    expert_reasoning: str
    source: str = "seed"


SEED_CASES: list[SecurityCase] = [
    SecurityCase(
        case_id="seed-sqli-001",
        cwe="CWE-89",
        language="python",
        vulnerable_code=(
            "def get_user(db, user_id):\n"
            "    query = f\"SELECT * FROM users WHERE id = {user_id}\"\n"
            "    return db.execute(query).fetchone()\n"
        ),
        patched_code=(
            "def get_user(db, user_id):\n"
            "    query = \"SELECT * FROM users WHERE id = ?\"\n"
            "    return db.execute(query, (user_id,)).fetchone()\n"
        ),
        expert_reasoning=(
            "The vulnerable version interpolates user_id directly into the SQL "
            "string, enabling SQL injection. The patched version binds the value "
            "through a parameterized query."
        ),
    ),
    SecurityCase(
        case_id="seed-xss-001",
        cwe="CWE-79",
        language="javascript",
        vulnerable_code=(
            "function render(name) {\n"
            "  document.getElementById('out').innerHTML = 'Hello ' + name;\n"
            "}\n"
        ),
        patched_code=(
            "function render(name) {\n"
            "  document.getElementById('out').textContent = 'Hello ' + name;\n"
            "}\n"
        ),
        expert_reasoning=(
            "Assigning untrusted input to innerHTML allows stored or reflected "
            "cross-site scripting. textContent renders the value as inert text."
        ),
    ),
    SecurityCase(
        case_id="seed-pathtraversal-001",
        cwe="CWE-22",
        language="python",
        vulnerable_code=(
            "import os\n"
            "def read_file(base, name):\n"
            "    return open(os.path.join(base, name)).read()\n"
        ),
        patched_code=(
            "import os\n"
            "def read_file(base, name):\n"
            "    full = os.path.realpath(os.path.join(base, name))\n"
            "    if not full.startswith(os.path.realpath(base) + os.sep):\n"
            "        raise ValueError('path escape')\n"
            "    return open(full).read()\n"
        ),
        expert_reasoning=(
            "Joining a user-controlled name without containment checks permits "
            "directory traversal via '../'. The patched version resolves the path "
            "and confirms it stays inside the base directory."
        ),
    ),
    SecurityCase(
        case_id="seed-cmdi-001",
        cwe="CWE-78",
        language="python",
        vulnerable_code=(
            "import os\n"
            "def ping(host):\n"
            "    os.system('ping -c 1 ' + host)\n"
        ),
        patched_code=(
            "import subprocess\n"
            "def ping(host):\n"
            "    subprocess.run(['ping', '-c', '1', host], check=True)\n"
        ),
        expert_reasoning=(
            "Concatenating host into a shell string allows OS command injection. "
            "The patched version passes an argument list to subprocess without a "
            "shell."
        ),
    ),
    SecurityCase(
        case_id="seed-secret-001",
        cwe="CWE-798",
        language="python",
        vulnerable_code=(
            "API_KEY = \"sk-live-3f9a2b8c7d6e5f4a1b0c9d8e\"\n"
            "def client():\n"
            "    return Service(API_KEY)\n"
        ),
        patched_code=(
            "import os\n"
            "def client():\n"
            "    return Service(os.environ['API_KEY'])\n"
        ),
        expert_reasoning=(
            "A hard-coded credential in source is recoverable by anyone with repo "
            "access. The patched version reads the secret from the environment."
        ),
    ),
]


def load_jsonl(path: str) -> list[SecurityCase]:
    cases: list[SecurityCase] = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        record = json.loads(stripped)
        cases.append(
            SecurityCase(
                case_id=record["case_id"],
                cwe=record.get("cwe", "UNKNOWN"),
                language=record.get("language", "unknown"),
                vulnerable_code=record["vulnerable_code"],
                patched_code=record["patched_code"],
                expert_reasoning=record.get("expert_reasoning", ""),
                source=record.get("source", "jsonl"),
            )
        )
    return cases


def load_cases(source: str | None) -> list[SecurityCase]:
    if not source:
        return list(SEED_CASES)
    path = Path(source)
    if path.is_dir():
        cases: list[SecurityCase] = []
        for jsonl in sorted(path.rglob("*.jsonl")):
            cases.extend(load_jsonl(str(jsonl)))
        if not cases:
            raise ValueError(
                f"No .jsonl case files found under {source}; convert the dataset "
                "to the SecurityCase JSONL schema first"
            )
        return cases
    return load_jsonl(source)
