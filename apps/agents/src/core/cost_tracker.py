import time

from ..shared.config.models import calculate_cost, get_model_info


class ModelUsage:

    def __init__(self, model_id: str):
        self.model_id = model_id
        self.input_tokens: int = 0
        self.output_tokens: int = 0
        self.total_cost: float = 0.0

    def add_usage(self, input_tokens: int, output_tokens: int) -> float:
        self.input_tokens += input_tokens
        self.output_tokens += output_tokens
        cost = calculate_cost(self.model_id, input_tokens, output_tokens)
        self.total_cost += cost
        return cost

    def to_dict(self) -> dict[str, int | float | str]:
        return {
            "model_id": self.model_id,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_cost": round(self.total_cost, 6),
        }


class CostTracker:

    def __init__(self):
        self._usage: dict[str, ModelUsage] = {}
        self.start_time: float = time.time()

    def record(self, model_id: str, input_tokens: int, output_tokens: int) -> float:
        if model_id not in self._usage:
            self._usage[model_id] = ModelUsage(model_id)
        return self._usage[model_id].add_usage(input_tokens, output_tokens)

    @property
    def total_cost(self) -> float:
        return sum(usage.total_cost for usage in self._usage.values())

    @property
    def total_tokens(self) -> int:
        return sum(
            usage.input_tokens + usage.output_tokens for usage in self._usage.values()
        )

    def get_duration_ms(self) -> int:
        return int((time.time() - self.start_time) * 1000)

    def get_breakdown(self) -> list[dict[str, int | float | str]]:
        return [usage.to_dict() for usage in self._usage.values()]

    def get_summary(self) -> dict:
        return {
            "total_cost": round(self.total_cost, 6),
            "total_tokens": self.total_tokens,
            "duration_ms": self.get_duration_ms(),
            "breakdown": self.get_breakdown(),
        }

    def to_dict(self) -> dict[str, float | int | list[dict[str, int | float | str]]]:
        return {
            "total_cost": round(self.total_cost, 6),
            "total_tokens": self.total_tokens,
            "breakdown": self.get_breakdown(),
        }
