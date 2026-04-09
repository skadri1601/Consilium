import os
import sys

from consilium import ConsiliumClient, ConsiliumError


def run_blind_evaluation():
    client = ConsiliumClient(
        api_key=os.environ.get("CONSILIUM_API_KEY", "your-api-key-here"),
        api_url=os.environ.get("CONSILIUM_API_URL", "http://localhost:4000/api/v1"),
    )

    evaluation_topic = (
        "Write a production-ready Python function that implements exponential "
        "backoff with jitter for retrying failed HTTP requests. Include proper "
        "exception handling, configurable max retries, and type hints."
    )

    candidate_responses = [
        (
            "def retry_with_backoff(func, max_retries=3, base_delay=1.0):\n"
            "    import random, time\n"
            "    for attempt in range(max_retries):\n"
            "        try:\n"
            "            return func()\n"
            "        except Exception:\n"
            "            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)\n"
            "            time.sleep(delay)\n"
            "    return func()"
        ),
        (
            "from typing import TypeVar, Callable\n"
            "import random, time, httpx\n"
            "T = TypeVar('T')\n"
            "def retry_with_backoff(fn: Callable[[], T], *, max_retries: int = 5,\n"
            "    base_delay: float = 0.5, max_delay: float = 30.0) -> T:\n"
            "    for attempt in range(max_retries):\n"
            "        try:\n"
            "            return fn()\n"
            "        except (httpx.TimeoutException, httpx.ConnectError) as exc:\n"
            "            if attempt == max_retries - 1:\n"
            "                raise\n"
            "            jitter = random.uniform(0, base_delay)\n"
            "            delay = min(base_delay * (2 ** attempt) + jitter, max_delay)\n"
            "            time.sleep(delay)"
        ),
    ]

    evaluator_models = ["gpt-4o", "claude-sonnet-4-20250514", "gemini-2.0-flash"]

    try:
        result = client.blind_eval(
            topic=evaluation_topic,
            responses=candidate_responses,
            models=evaluator_models,
        )
    except ConsiliumError as exc:
        print(f"Blind evaluation failed: {exc}")
        sys.exit(1)

    print("=== Blind Evaluation Results ===\n")
    print(f"Evaluation Method: {result.method}\n")

    print("Rankings:")
    for entry in result.rankings:
        print(f"  #{entry.get('rank', '?')}: Response {entry.get('index', '?')} - {entry.get('reasoning', '')}")

    print("\nScores:")
    for dimension, score in result.scores.items():
        print(f"  {dimension}: {score:.2f}")


if __name__ == "__main__":
    run_blind_evaluation()
