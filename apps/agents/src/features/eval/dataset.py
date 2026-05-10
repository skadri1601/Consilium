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
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        cases = [EvalCase(**item) for item in raw]
        return cls(cases=cases)

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
