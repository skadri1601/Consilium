from __future__ import annotations

import json
from dataclasses import dataclass, field


@dataclass
class EvalCase:
    id: str
    topic: str
    expected_answer: str
    category: str = "general"
    difficulty: str = "medium"
    vertical: str = "general"
    tags: list[str] = field(default_factory=list)


@dataclass
class EvalDataset:
    cases: list[EvalCase]
    name: str = "default"

    @classmethod
    def from_json(cls, path: str) -> EvalDataset:
        try:
            with open(path, encoding="utf-8") as f:
                raw = json.load(f)
        except FileNotFoundError:
            raise
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON in {path}: {exc}") from exc
        except OSError as exc:
            raise OSError(f"Failed to read {path}: {exc}") from exc

        if isinstance(raw, dict):
            items = raw.get("cases", [])
            name = raw.get("name", "default")
        elif isinstance(raw, list):
            items = raw
            name = "default"
        else:
            raise ValueError(
                f"Dataset {path}: expected list or {{cases: [...]}} object, got {type(raw).__name__}"
            )

        if not isinstance(items, list):
            raise ValueError(f"Dataset {path}: 'cases' must be a list, got {type(items).__name__}")

        try:
            cases = [EvalCase(**item) for item in items]
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Dataset {path}: invalid case fields: {exc}") from exc

        return cls(cases=cases, name=name)

    def filter_by_category(self, category: str) -> EvalDataset:
        return EvalDataset(
            cases=[c for c in self.cases if c.category == category],
            name=self.name,
        )

    def filter_by_vertical(self, vertical: str) -> EvalDataset:
        return EvalDataset(
            cases=[c for c in self.cases if c.vertical == vertical],
            name=self.name,
        )

    def filter_by_difficulty(self, difficulty: str) -> EvalDataset:
        return EvalDataset(
            cases=[c for c in self.cases if c.difficulty == difficulty],
            name=self.name,
        )
