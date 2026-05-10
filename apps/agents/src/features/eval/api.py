from __future__ import annotations

import logging
from enum import Enum
from pathlib import Path, PurePosixPath

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from src.features.eval.dataset import EvalDataset
from src.features.eval.runner import EvalRunner

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/eval", tags=["eval"])

DATASETS_DIR = Path(__file__).parent / "datasets"


class EvalMode(str, Enum):
    QUICK = "quick"
    COUNCIL = "council"
    DEEP = "deep"
    BLIND = "blind"
    REDTEAM = "redteam"
    JURY = "jury"
    MARKET = "market"
    AUTO = "auto"
    SINGLE = "single"


class EvalRunRequest(BaseModel):
    dataset_path: str | None = None
    mode: EvalMode = EvalMode.COUNCIL
    concurrency: int = Field(default=2, ge=1, le=100)
    category: str | None = None
    vertical: str | None = None

    @field_validator("dataset_path")
    @classmethod
    def _validate_dataset_path(cls, value: str | None) -> str | None:
        if value is None:
            return value
        candidate = PurePosixPath(value.replace("\\", "/"))
        if candidate.is_absolute() or any(part == ".." for part in candidate.parts):
            raise ValueError(
                "dataset_path must be a relative filename under the datasets directory "
                "(no absolute paths or '..' segments)"
            )
        return value


async def _stub_deliberate(topic: str, mode: str) -> str:
    return f"Stub response for: {topic}"


def _resolve_dataset_path(supplied: str | None) -> Path:
    base = DATASETS_DIR.resolve()
    if not supplied:
        return base / "seed.json"
    candidate = (base / supplied).resolve()
    try:
        candidate.relative_to(base)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"dataset_path resolves outside datasets directory: {supplied!r}",
        ) from exc
    return candidate


@router.post("/run")
async def run_eval(body: EvalRunRequest) -> dict:
    path = _resolve_dataset_path(body.dataset_path)
    try:
        dataset = EvalDataset.from_json(str(path))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {path.name}") from exc
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid dataset {path.name}: {exc}"
        ) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=500, detail=f"Cannot read dataset {path.name}: {exc}"
        ) from exc

    try:
        if body.category:
            dataset = dataset.filter_by_category(body.category)
        if body.vertical:
            dataset = dataset.filter_by_vertical(body.vertical)
    except (ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid filter parameters: {exc}") from exc

    if not dataset.cases:
        raise HTTPException(
            status_code=404,
            detail="No cases match the supplied filters",
        )

    runner = EvalRunner(
        deliberate_fn=_stub_deliberate,
        mode=body.mode.value,
        concurrency=body.concurrency,
    )
    try:
        report = await runner.run_report(dataset)
        return report.to_dict()
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("eval runner failed for dataset=%s", path.name)
        raise HTTPException(status_code=500, detail="Evaluation run failed") from exc
