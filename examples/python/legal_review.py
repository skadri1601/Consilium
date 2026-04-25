import os
import sys

from consilium import ConsiliumClient, DeliberationMode, ConsiliumError


def run_contract_review():
    client = ConsiliumClient(
        api_key=os.environ.get("CONSILIUM_API_KEY", "your-api-key-here"),
        api_url=os.environ.get("CONSILIUM_API_URL", "http://localhost:4000/api/v1"),
    )

    contract_clause = (
        "LEGAL VERTICAL: Contract Clause Analysis\n\n"
        "Analyze the following SaaS agreement clause for risks to the customer:\n\n"
        "\"Notwithstanding any other provision, Provider reserves the right to "
        "modify, suspend, or discontinue any aspect of the Service at any time "
        "without prior notice. Provider shall not be liable for any damages, "
        "including but not limited to lost profits, data loss, or business "
        "interruption, arising from such modifications, suspensions, or "
        "discontinuations. Customer's sole remedy shall be termination of this "
        "Agreement, with no refund of prepaid fees. Provider may assign this "
        "Agreement without consent. All disputes shall be resolved through "
        "binding arbitration in Delaware under Provider's chosen arbitrator.\"\n\n"
        "Identify specific risks, unfavorable provisions, missing protections, "
        "and suggest counter-proposals for each issue found."
    )

    legal_panel_models = [
        "gpt-5.4",
        "claude-sonnet-4-6",
        "gemini-3-flash-preview",
    ]

    try:
        result = client.deliberate(
            topic=contract_clause,
            models=legal_panel_models,
            mode=DeliberationMode.DELPHI,
            max_rounds=3,
        )
    except ConsiliumError as exc:
        print(f"Legal review failed: {exc}")
        sys.exit(1)

    print("=== Multi-Model Legal Review ===\n")
    print("DISCLAIMER: For informational purposes only. Not legal advice.\n")
    print(f"Panel Analysis:\n{result.golden_prompt}\n")

    print("Panel Votes:")
    for model_name, position in result.votes.items():
        print(f"  {model_name}: {position}")

    print("\nConfidence in Analysis:")
    for model_name, confidence in result.confidence_scores.items():
        print(f"  {model_name}: {confidence:.1%}")

    if result.dissent_report:
        print(f"\nMinority Opinions:\n{result.dissent_report}")

    print(f"\nTotal Cost: ${result.cost:.4f}")


if __name__ == "__main__":
    run_contract_review()
