import os
import sys

from consilium import ConsiliumClient, DeliberationMode, ConsiliumError


def run_architecture_debate():
    client = ConsiliumClient(
        api_key=os.environ.get("CONSILIUM_API_KEY", "your-api-key-here"),
        api_url=os.environ.get("CONSILIUM_API_URL", "http://localhost:4000/api/v1"),
    )

    architecture_topic = (
        "Should we migrate our monolithic Django application to microservices "
        "using Kubernetes, or refactor into a modular monolith with clear domain "
        "boundaries? The app serves 50k daily active users with 99.9% uptime SLA."
    )

    panelist_models = [
        "gpt-5.4",
        "claude-sonnet-4-6",
        "gemini-3-flash-preview",
    ]

    try:
        result = client.deliberate(
            topic=architecture_topic,
            models=panelist_models,
            mode=DeliberationMode.COUNCIL,
            max_rounds=3,
        )
    except ConsiliumError as exc:
        print(f"Deliberation failed: {exc}")
        sys.exit(1)

    print("=== Council Deliberation Result ===\n")
    print(f"Golden Prompt:\n{result.golden_prompt}\n")
    print(f"Dissent Report:\n{result.dissent_report}\n")
    print(f"Total Cost: ${result.cost:.4f}\n")

    print("Confidence Scores:")
    for model_name, score in result.confidence_scores.items():
        print(f"  {model_name}: {score:.1%}")

    print(f"\nAudit Trail: {len(result.audit_trail)} entries")


if __name__ == "__main__":
    run_architecture_debate()
