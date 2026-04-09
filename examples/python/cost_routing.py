import os
import sys

from consilium import ConsiliumClient, DeliberationMode, ConsiliumError


def run_cost_aware_deliberation():
    client = ConsiliumClient(
        api_key=os.environ.get("CONSILIUM_API_KEY", "your-api-key-here"),
        api_url=os.environ.get("CONSILIUM_API_URL", "http://localhost:4000/api/v1"),
    )

    routing_topic = (
        "Design a rate limiting strategy for a multi-tenant API gateway that "
        "handles 10,000 requests/second. Consider: token bucket vs sliding window, "
        "per-tenant quotas, burst handling, distributed coordination across 5 regions, "
        "and graceful degradation during traffic spikes."
    )

    cost_efficient_models = [
        "gpt-4o-mini",
        "claude-haiku-4-5-20251001",
        "gemini-2.0-flash",
    ]

    try:
        estimate = client.estimate_cost(
            topic=routing_topic,
            mode=DeliberationMode.AUTO,
            models=cost_efficient_models,
        )
    except ConsiliumError as exc:
        print(f"Cost estimation failed: {exc}")
        sys.exit(1)

    print("=== Cost Estimate (Auto Mode) ===\n")
    print(f"Estimated Total: ${estimate.total:.4f}")
    print(f"Per Round: ${estimate.breakdown.per_round:.4f}")
    print(f"Judge Cost: ${estimate.breakdown.judge:.4f}")
    if estimate.breakdown.sub_agents:
        print(f"Sub-Agents: ${estimate.breakdown.sub_agents:.4f}")
    print(f"Estimated Time: {estimate.estimated_time}\n")

    try:
        result = client.deliberate(
            topic=routing_topic,
            models=cost_efficient_models,
            mode=DeliberationMode.AUTO,
            max_rounds=3,
        )
    except ConsiliumError as exc:
        print(f"Deliberation failed: {exc}")
        sys.exit(1)

    print("=== Auto-Routed Deliberation Result ===\n")
    print(f"Consensus:\n{result.golden_prompt}\n")

    print("Model Confidence:")
    for model_name, confidence in result.confidence_scores.items():
        print(f"  {model_name}: {confidence:.1%}")

    print(f"\nActual Cost: ${result.cost:.4f}")

    if estimate.total > 0:
        variance = abs(result.cost - estimate.total) / estimate.total * 100
        print(f"Estimate Variance: {variance:.1f}%")


if __name__ == "__main__":
    run_cost_aware_deliberation()
