from fastapi import APIRouter
from datetime import datetime
import os
import time
import asyncio
from typing import Dict, Any

from ..free_tier.resolver import (
    FREE_TIER_ENV_VARS,
    TIER_EQUIVALENT_FREE_MODELS,
)

router = APIRouter(tags=["health"])


def check_api_keys() -> Dict[str, bool]:
    """Check which API keys are configured."""
    return {
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google": bool(os.getenv("GOOGLE_API_KEY")),
        "groq": bool(os.getenv("GROQ_API_KEY")),
        "xai": bool(os.getenv("XAI_API_KEY")),
        "moonshot": bool(os.getenv("MOONSHOT_API_KEY")),
        "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
    }


def check_free_tier_pool() -> Dict[str, bool]:
    """Check which free-tier pool providers are funded."""
    return {
        provider: bool(os.getenv(env_var))
        for provider, env_var in FREE_TIER_ENV_VARS.items()
    }


def get_free_tier_status() -> Dict[str, Any]:
    """Describe the platform free-tier pool used when a request has no BYOK."""
    pool = check_free_tier_pool()
    funded_providers = [provider for provider, funded in pool.items() if funded]
    return {
        "configured": bool(funded_providers),
        "providers": pool,
        "env_vars": FREE_TIER_ENV_VARS,
        "models": {
            provider: TIER_EQUIVALENT_FREE_MODELS.get(provider, {})
            for provider in funded_providers
        },
    }


async def test_api_keys() -> Dict[str, Dict[str, Any]]:
    """
    Test API keys by making actual API calls to each provider.

    Returns detailed results with status, response time, and errors.
    """
    from ..agents.openai_agent import OpenAIAgent
    from ..agents.anthropic_agent import AnthropicAgent
    from ..agents.google_agent import GoogleAgent
    from ..agents.groq_agent import GroqAgent
    from ..agents.xai_agent import XAIAgent

    providers = {
        "openai": {"agent_class": OpenAIAgent, "env_var": "OPENAI_API_KEY"},
        "anthropic": {"agent_class": AnthropicAgent, "env_var": "ANTHROPIC_API_KEY"},
        "google": {"agent_class": GoogleAgent, "env_var": "GOOGLE_API_KEY"},
        "groq": {"agent_class": GroqAgent, "env_var": "GROQ_API_KEY"},
        "xai": {"agent_class": XAIAgent, "env_var": "XAI_API_KEY"},
    }

    results = {}

    async def test_provider(provider_id: str, provider_info: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
        """Test a single provider."""
        api_key = os.getenv(provider_info["env_var"])

        if not api_key or api_key.strip() == "":
            return provider_id, {"status": "not_configured"}

        try:
            agent = provider_info["agent_class"](api_key=api_key)
            start_time = time.time()
            is_healthy = await agent.health_check()
            response_time_ms = int((time.time() - start_time) * 1000)

            if is_healthy:
                return provider_id, {
                    "status": "working",
                    "response_time_ms": response_time_ms,
                    "model_tested": agent.model,
                }
            else:
                return provider_id, {
                    "status": "failed",
                    "error": "Health check returned False (likely authentication failed)",
                }
        except Exception as e:
            error_msg = str(e)
            if "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower():
                error_detail = "Invalid API key or authentication failed"
            elif "rate" in error_msg.lower() and "limit" in error_msg.lower():
                error_detail = "Rate limit exceeded"
            elif "timeout" in error_msg.lower():
                error_detail = "Request timeout"
            else:
                error_detail = f"Error: {error_msg[:100]}"

            return provider_id, {
                "status": "failed",
                "error": error_detail,
            }

    # Test all providers in parallel
    tasks = [test_provider(pid, pinfo) for pid, pinfo in providers.items()]
    test_results = await asyncio.gather(*tasks)

    # Convert to dictionary
    for provider_id, result in test_results:
        results[provider_id] = result

    return results


def get_available_models() -> list:
    """Get list of available models based on configured API keys."""
    from ...shared.config.models import AVAILABLE_MODELS

    keys = check_api_keys()
    provider_key_map = {
        "openai": keys.get("openai", False),
        "anthropic": keys.get("anthropic", False),
        "google": keys.get("google", False),
        "groq": keys.get("groq", False),
        "xai": keys.get("xai", False),
        "moonshot": keys.get("moonshot", False),
        "openrouter": keys.get("openrouter", False),
    }
    models = []
    for provider, provider_models in AVAILABLE_MODELS.items():
        if provider == "mock":
            continue
        if provider_key_map.get(provider, False):
            models.extend(m["id"] for m in provider_models)

    return models


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Comprehensive health check endpoint."""
    api_keys = check_api_keys()
    free_tier = get_free_tier_status()
    has_any_key = any(api_keys.values())
    can_serve_requests = has_any_key or free_tier["configured"]

    warnings = []
    if not can_serve_requests:
        warnings.append(
            "No API keys and no free-tier pool configured - agents will not function"
        )
    elif not has_any_key:
        warnings.append(
            "No provider API keys configured - serving BYOK-less requests from the free-tier pool"
        )

    return {
        "status": "healthy" if can_serve_requests else "degraded",
        "service": "consilium-agents",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "providers": api_keys,
        "free_tier": free_tier,
        "available_models": get_available_models(),
        "warnings": warnings,
    }


@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check for Kubernetes/container orchestration."""
    api_keys = check_api_keys()
    free_tier_pool = check_free_tier_pool()
    has_any_key = any(api_keys.values())
    has_free_tier_pool = any(free_tier_pool.values())

    return {
        "status": "ready" if has_any_key or has_free_tier_pool else "not_ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "api_keys": has_any_key,
            "free_tier_pool": has_free_tier_pool,
        }
    }


@router.get("/live")
async def liveness_check() -> Dict[str, Any]:
    """Liveness check for Kubernetes/container orchestration."""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/providers")
async def providers_status() -> Dict[str, Any]:
    """Get detailed status of AI providers."""
    return {
        "providers": check_api_keys(),
        "free_tier": get_free_tier_status(),
        "models": get_available_models(),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/api-keys")
async def api_keys_test() -> Dict[str, Any]:
    """
    Test all API keys by making actual API calls.

    Returns detailed results with status, response time, and error details
    for each provider.
    """
    test_results = await test_api_keys()

    # Calculate summary
    total = len(test_results)
    working = sum(1 for r in test_results.values() if r.get("status") == "working")
    failed = sum(1 for r in test_results.values() if r.get("status") == "failed")
    not_configured = sum(1 for r in test_results.values() if r.get("status") == "not_configured")

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "providers": test_results,
        "summary": {
            "total": total,
            "working": working,
            "failed": failed,
            "not_configured": not_configured,
        },
    }
