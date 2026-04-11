import os
import sys

from consilium import ConsiliumClient, DeliberationMode, ConsiliumError


def run_prediction_market():
    client = ConsiliumClient(
        api_key=os.environ.get("CONSILIUM_API_KEY", "your-api-key-here"),
        api_url=os.environ.get("CONSILIUM_API_URL", "http://localhost:4000/api/v1"),
    )

    prediction_topic = (
        "Will Rust surpass C++ in systems programming adoption by 2028? "
        "Consider: major tech company adoption rates, TIOBE/Stack Overflow trends, "
        "safety-critical industry mandates (automotive, aerospace, defense), "
        "the Linux kernel's Rust integration pace, and developer hiring pipelines."
    )

    market_participants = [
        "gpt-4o",
        "claude-sonnet-4-20250514",
        "gemini-2.0-flash",
    ]

    try:
        result = client.deliberate(
            topic=prediction_topic,
            models=market_participants,
            mode=DeliberationMode.PREDICTION_MARKET,
            max_rounds=5,
        )
    except ConsiliumError as exc:
        print(f"Prediction market failed: {exc}")
        sys.exit(1)

    print("=== Prediction Market Consensus ===\n")
    print(f"Synthesized Position:\n{result.golden_prompt}\n")

    print("Market Confidence Distribution:")
    for model_name, confidence in result.confidence_scores.items():
        bar_length = int(confidence * 40)
        bar = "\u2588" * bar_length + "\u2591" * (40 - bar_length)
        print(f"  {model_name:30s} [{bar}] {confidence:.1%}")

    print(f"\nDissenting Views:\n{result.dissent_report}\n")

    print("Vote Positions:")
    for model_name, position in result.votes.items():
        print(f"  {model_name}: {position}")

    print(f"\nTotal Cost: ${result.cost:.4f}")


if __name__ == "__main__":
    run_prediction_market()
