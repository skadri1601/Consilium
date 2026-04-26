import os
import sys

from consilium import ConsiliumClient, DeliberationMode, ConsiliumError


def run_differential_diagnosis():
    client = ConsiliumClient(
        api_key=os.environ.get("CONSILIUM_API_KEY", "your-api-key-here"),
        api_url=os.environ.get("CONSILIUM_API_URL", "http://localhost:4000/api/v1"),
    )

    clinical_presentation = (
        "HEALTHCARE VERTICAL: Differential Diagnosis\n\n"
        "Patient: 45-year-old female presenting with:\n"
        "- Progressive fatigue over 3 months\n"
        "- Unexplained weight loss (8 kg)\n"
        "- Intermittent low-grade fever (37.8C)\n"
        "- Night sweats\n"
        "- Mild splenomegaly on physical exam\n"
        "- Labs: WBC 15.2, mild anemia (Hgb 10.8), elevated LDH (380), ESR 55\n"
        "- No travel history, no known exposures\n\n"
        "Generate a ranked differential diagnosis with recommended workup "
        "for each candidate diagnosis. Consider oncologic, infectious, "
        "autoimmune, and hematologic etiologies."
    )

    specialist_models = [
        "gpt-5.4",
        "claude-sonnet-4-6",
        "gemini-3-flash-preview",
    ]

    try:
        result = client.deliberate(
            topic=clinical_presentation,
            models=specialist_models,
            mode=DeliberationMode.COUNCIL,
            max_rounds=3,
        )
    except ConsiliumError as exc:
        print(f"Diagnosis deliberation failed: {exc}")
        sys.exit(1)

    print("=== Multi-Model Differential Diagnosis ===\n")
    print("DISCLAIMER: For educational purposes only. Not medical advice.\n")
    print(f"Consensus Differential:\n{result.golden_prompt}\n")

    print("Model Agreement Levels:")
    for model_name, confidence in result.confidence_scores.items():
        agreement_label = "Strong" if confidence > 0.8 else "Moderate" if confidence > 0.5 else "Weak"
        print(f"  {model_name}: {confidence:.1%} ({agreement_label} agreement)")

    if result.dissent_report:
        print(f"\nDissenting Opinions:\n{result.dissent_report}")

    print(f"\nTotal Cost: ${result.cost:.4f}")


if __name__ == "__main__":
    run_differential_diagnosis()
