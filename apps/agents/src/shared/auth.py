"""Shared authentication helpers for the debate engine HTTP surface."""

from __future__ import annotations

import secrets
from typing import Optional

from fastapi import Header, HTTPException

from .config import settings


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization format")
    return parts[1]


def verify_api_key(authorization: Optional[str]) -> None:
    """Verify the shared-secret API key using a constant-time compare.

    Behavior:
      - In production (`app_env == "production"`) the key is required; missing
        config fails closed with HTTP 500 so we never silently accept requests.
      - Outside production, if no key is configured we permit the call so local
        development is not blocked.
    """
    expected = settings.consilium_api_key
    if not expected:
        if (settings.app_env or "").lower() == "production":
            raise HTTPException(
                status_code=500,
                detail="Server misconfiguration: CONSILIUM_API_KEY is not set",
            )
        return

    presented = _extract_bearer_token(authorization)
    if not secrets.compare_digest(presented, expected):
        raise HTTPException(status_code=401, detail="Invalid API key")


async def require_api_key(authorization: Optional[str] = Header(default=None)) -> None:
    """FastAPI dependency form of ``verify_api_key``."""
    verify_api_key(authorization)
