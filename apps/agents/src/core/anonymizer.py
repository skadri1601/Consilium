import json
import random
import string
from typing import Optional
from ..shared.database.redis import RedisClient


ROUND_1_LABELS = ["Response A", "Response B", "Response C", "Response D", "Response E"]
ROUND_2_LABELS = ["Critic A", "Critic B", "Critic C", "Critic D", "Critic E"]
ROUND_3_LABELS = ["Final A", "Final B", "Final C", "Final D", "Final E"]


class AnonymityMap:

    def __init__(self, model_ids: list[str]):
        self.model_ids = model_ids
        shuffled_indices = list(range(len(model_ids)))
        random.shuffle(shuffled_indices)
        self._model_to_index: dict[str, int] = {}
        self._index_to_model: dict[int, str] = {}
        for original_pos, shuffled_pos in enumerate(shuffled_indices):
            self._model_to_index[model_ids[original_pos]] = shuffled_pos
            self._index_to_model[shuffled_pos] = model_ids[original_pos]

    def get_label(self, model_id: str, round_number: int) -> str:
        idx = self._model_to_index[model_id]
        if round_number == 1:
            return ROUND_1_LABELS[idx]
        elif round_number == 2:
            return ROUND_2_LABELS[idx]
        else:
            return ROUND_3_LABELS[idx]

    def get_model_for_label(self, label: str) -> Optional[str]:
        for label_list in [ROUND_1_LABELS, ROUND_2_LABELS, ROUND_3_LABELS]:
            if label in label_list:
                idx = label_list.index(label)
                return self._index_to_model.get(idx)
        return None

    def to_dict(self) -> dict[str, int]:
        return dict(self._model_to_index)

    @classmethod
    def from_dict(cls, model_ids: list[str], mapping: dict[str, int]) -> "AnonymityMap":
        instance = cls.__new__(cls)
        instance.model_ids = model_ids
        instance._model_to_index = mapping
        instance._index_to_model = {v: k for k, v in mapping.items()}
        return instance


class Anonymizer:

    def __init__(self, redis: RedisClient):
        self.redis = redis

    async def create_map(self, debate_id: str, model_ids: list[str]) -> AnonymityMap:
        anon_map = AnonymityMap(model_ids)
        await self.redis.set(
            f"debate:{debate_id}:anon_map",
            json.dumps({"model_ids": model_ids, "mapping": anon_map.to_dict()}),
            ex=1800,
        )
        return anon_map

    async def get_map(self, debate_id: str) -> Optional[AnonymityMap]:
        data = await self.redis.get(f"debate:{debate_id}:anon_map")
        if data is None:
            return None
        parsed = json.loads(data)
        return AnonymityMap.from_dict(parsed["model_ids"], parsed["mapping"])

    def anonymize_responses(
        self,
        anon_map: AnonymityMap,
        responses: dict[str, str],
        round_number: int,
    ) -> list[dict[str, str]]:
        result: list[dict[str, str]] = []
        for model_id, text in responses.items():
            label = anon_map.get_label(model_id, round_number)
            result.append({"label": label, "text": text, "model_id": model_id})
        result.sort(key=lambda entry: entry["label"])
        return result

    def deanonymize_responses(
        self,
        anon_map: AnonymityMap,
        labeled_responses: list[dict[str, str]],
    ) -> dict[str, str]:
        result: dict[str, str] = {}
        for entry in labeled_responses:
            model_id = entry.get("model_id") or anon_map.get_model_for_label(entry["label"])
            if model_id:
                result[model_id] = entry["text"]
        return result
