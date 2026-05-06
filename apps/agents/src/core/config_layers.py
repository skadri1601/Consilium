from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class ConfigSource(Enum):
    PLATFORM = "platform"
    ORGANIZATION = "organization"
    USER = "user"
    DEBATE = "debate"


@dataclass
class ConfigEntry:
    source: ConfigSource
    path: str | None
    values: dict[str, Any]


PLATFORM_DEFAULTS: dict[str, Any] = {
    "max_rounds": 3,
    "convergence_threshold": 0.92,
    "agent_timeout": 60,
    "max_retries": 2,
    "retry_backoff": [1, 3],
    "min_response_length": 20,
    "redis_ttl": 3600,
    "sub_agents_enabled": False,
    "anti_capitulation_enabled": True,
    "session_compaction": {
        "enabled": True,
        "max_tokens": 10000,
        "preserve_recent_rounds": 1,
    },
    "journal": {
        "enabled": False,
        "dir": "/tmp/consilium-journals",
    },
    "rate_limits": {
        "openai": 5,
        "anthropic": 4,
        "google": 6,
        "groq": 8,
        "xai": 3,
        "openrouter": 5,
    },
}


def _deep_merge(base: dict, override: dict) -> dict:
    result = dict(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def _load_json_file(path: str | Path) -> dict[str, Any] | None:
    try:
        p = Path(path)
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load config from %s: %s", path, type(exc).__name__)
    return None


class ConfigLoader:

    def __init__(self, project_root: str | None = None):
        self._project_root = Path(project_root) if project_root else None
        self._loaded_entries: list[ConfigEntry] = []

    def discover(self) -> list[ConfigEntry]:
        entries: list[ConfigEntry] = []

        entries.append(ConfigEntry(
            source=ConfigSource.PLATFORM,
            path=None,
            values=dict(PLATFORM_DEFAULTS),
        ))

        org_path = os.getenv("CONSILIUM_ORG_CONFIG")
        if org_path:
            values = _load_json_file(org_path)
            if values:
                entries.append(ConfigEntry(
                    source=ConfigSource.ORGANIZATION,
                    path=org_path,
                    values=values,
                ))

        user_paths = [
            Path.home() / ".consilium" / "config.json",
            Path.home() / ".config" / "consilium" / "settings.json",
        ]
        for user_path in user_paths:
            values = _load_json_file(user_path)
            if values:
                entries.append(ConfigEntry(
                    source=ConfigSource.USER,
                    path=str(user_path),
                    values=values,
                ))
                break

        if self._project_root:
            project_paths = [
                self._project_root / ".consilium.json",
                self._project_root / ".consilium" / "settings.json",
                self._project_root / ".consilium" / "settings.local.json",
            ]
            for project_path in project_paths:
                values = _load_json_file(project_path)
                if values:
                    entries.append(ConfigEntry(
                        source=ConfigSource.USER,
                        path=str(project_path),
                        values=values,
                    ))

        return entries

    def load(self, debate_overrides: dict[str, Any] | None = None) -> dict[str, Any]:
        entries = self.discover()
        merged: dict[str, Any] = {}

        for entry in entries:
            merged = _deep_merge(merged, entry.values)

        if debate_overrides:
            merged = _deep_merge(merged, debate_overrides)
            entries.append(ConfigEntry(
                source=ConfigSource.DEBATE,
                path=None,
                values=debate_overrides,
            ))

        env_overrides = self._env_overrides()
        if env_overrides:
            merged = _deep_merge(merged, env_overrides)

        self._loaded_entries = entries
        return merged

    def _env_overrides(self) -> dict[str, Any]:
        overrides: dict[str, Any] = {}
        mappings = {
            "CONSILIUM_MAX_ROUNDS": ("max_rounds", int),
            "CONSILIUM_CONVERGENCE_THRESHOLD": ("convergence_threshold", float),
            "CONSILIUM_AGENT_TIMEOUT": ("agent_timeout", int),
            "CONSILIUM_MAX_RETRIES": ("max_retries", int),
        }
        for env_key, (config_key, cast) in mappings.items():
            val = os.getenv(env_key)
            if val is not None:
                try:
                    overrides[config_key] = cast(val)
                except (ValueError, TypeError):
                    pass
        return overrides

    @property
    def loaded_entries(self) -> list[ConfigEntry]:
        return list(self._loaded_entries)


def load_debate_config(
    project_root: str | None = None,
    debate_overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    loader = ConfigLoader(project_root)
    return loader.load(debate_overrides)
