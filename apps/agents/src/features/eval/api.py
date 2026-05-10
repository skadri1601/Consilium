from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from src.features.eval.dataset import EvalDataset
from src.features.eval.runner import EvalRunner

router = APIRouter(prefix="/eval", tags=["eval"])

DATASETS_DIR = Path(__file__).parent / "datasets"


class EvalRunRequest(BaseModel):
    dataset_path: Optional[str] = None
    mode: str = "council"
    concurrency: int = 2
    category: Optional[str] = None
    vertical: Optional[str] = None


async def _stub_deliberate(topic: str, mode: str) -> str:
    return f"Stub response for: {topic}"


@router.post("/run")
async def run_eval(body: EvalRunRequest) -> dict:
    path = body.dataset_path or str(DATASETS_DIR / "seed.json")
    dataset = EvalDataset.from_json(path)

    if body.category:
        dataset = dataset.filter_by_category(body.category)
    if body.vertical:
        dataset = dataset.filter_by_vertical(body.vertical)

    runner = EvalRunner(
        deliberate_fn=_stub_deliberate,
        mode=body.mode,
        concurrency=body.concurrency,
    )
    report = await runner.run_report(dataset)
    return report.to_dict()
