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
            models=cost_efficient_models,
            mode=DeliberationMode.COUNCIL,
        )
    except ConsiliumError as exc:
        print(f"Cost estimation failed: {exc}")
        sys.exit(1)

    print(f"=== Cost Estimate ({estimate.mode} Mode) ===\n")
    print(f"Estimated Total: ${estimate.estimated_cost:.4f}")
    print(f"Rounds: {estimate.rounds}")
    for entry in estimate.breakdown:
        print(f"  {entry.model} ({entry.role}): ${entry.estimated_cost:.4f}")
    print()

    try:
        result = client.deliberate(
            topic=routing_topic,
            models=cost_efficient_models,
            mode=DeliberationMode.COUNCIL,
            max_rounds=3,
        )
    except ConsiliumError as exc:
        print(f"Deliberation failed: {exc}")
        sys.exit(1)

    print("=== Deliberation Result ===\n")
    print(f"Consensus:\n{result.golden_prompt}\n")

    print("Model Confidence:")
    for model_name, confidence in result.confidence_scores.items():
        print(f"  {model_name}: {confidence:.1%}")

    print(f"\nActual Cost: ${result.cost:.4f}")

    if estimate.estimated_cost > 0:
        variance = abs(result.cost - estimate.estimated_cost) / estimate.estimated_cost * 100
        print(f"Estimate Variance: {variance:.1f}%")


if __name__ == "__main__":
    run_cost_aware_deliberation()
