import ast
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"


def discover_tools() -> list[dict]:
    tools = []
    for path in TOOLS_DIR.glob("*.py"):
        if path.name == "__init__.py":
            continue
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError:
            continue
        docstring = ast.get_docstring(tree)
        if not docstring:
            continue
        tools.append({
            "name": path.stem,
            "module": f"agents.tools.{path.stem}",
            "docstring": docstring.strip(),
        })
    return sorted(tools, key=lambda t: t["name"])


def format_tools_for_prompt(tools: list[dict] | None = None) -> str:
    if tools is None:
        tools = discover_tools()
    blocks = []
    for t in tools:
        blocks.append(
            f"### {t['name']}\n"
            f"Usage: python -m {t['module']} --help\n"
            f"{t['docstring']}"
        )
    return "\n\n".join(blocks)


if __name__ == "__main__":
    for tool in discover_tools():
        first_line = tool["docstring"].split("\n", 1)[0]
        print(f"{tool['name']}: {first_line}")
