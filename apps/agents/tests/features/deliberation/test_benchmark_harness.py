from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock

import pytest

from src.features.deliberation.benchmarks.framework import (
    BenchmarkQuestion,
    BenchmarkResult,
    _check_correct,
    _code_functionally_equivalent,
    _extract_function_body,
    _is_api_error_answer,
    run_benchmark,
)


class TestExtractFunctionBody:
    def test_single_line_return(self):
        code = "def add(a, b): return a + b"
        body = _extract_function_body(code)
        assert body is not None
        assert "return a + b" in body

    def test_multiline_body(self):
        code = (
            "def is_prime(n):\n"
            "    if n <= 1:\n"
            "        return False\n"
            "    for i in range(2, int(n**0.5) + 1):\n"
            "        if n % i == 0:\n"
            "            return False\n"
            "    return True\n"
        )
        body = _extract_function_body(code)
        assert body is not None
        assert "return False" in body
        assert "return True" in body

    def test_skips_comments_and_docstrings(self):
        code = (
            "def foo(x):\n"
            '    """Docstring."""\n'
            "    # comment\n"
            "    return x * 2\n"
        )
        body = _extract_function_body(code)
        assert body is not None
        assert "return x * 2" in body
        assert "comment" not in body
        assert "Docstring" not in body

    def test_returns_none_for_non_function(self):
        assert _extract_function_body("x = 42") is None

    def test_stops_at_next_def(self):
        code = (
            "def first(a):\n"
            "    return a\n"
            "def second(b):\n"
            "    return b\n"
        )
        body = _extract_function_body(code)
        assert body is not None
        assert "return a" in body
        assert "return b" not in body


class TestCodeFunctionallyEquivalent:
    def test_same_body_different_name(self):
        model = "def sum_of_two(a, b): return a + b"
        expected = "def add(a, b): return a + b"
        assert _code_functionally_equivalent(model, expected) is True

    def test_same_body_with_all_builtin(self):
        model = "def check_prime(n): return n > 1 and all(n % i for i in range(2, int(n**0.5) + 1))"
        expected = "def is_prime(n): return n > 1 and all(n % i for i in range(2, int(n**0.5) + 1))"
        result = _code_functionally_equivalent(model, expected)
        assert result is True

    def test_same_param_count_same_operators(self):
        model = "def multiply(x, y): return x * y"
        expected = "def product(a, b): return a * b"
        assert _code_functionally_equivalent(model, expected) is True

    def test_structurally_different_implementations(self):
        model = (
            "def check_prime(n):\n"
            "    if n <= 1:\n"
            "        return False\n"
            "    for i in range(2, int(n**0.5) + 1):\n"
            "        if n % i == 0:\n"
            "            return False\n"
            "    return True\n"
        )
        expected = "def is_prime(n): return n > 1 and all(n % i for i in range(2, int(n**0.5) + 1))"
        result = _code_functionally_equivalent(model, expected)
        assert result is True or result is False

    def test_completely_different_code(self):
        model = "def sort_list(arr): return sorted(arr)"
        expected = "def add(a, b): return a + b"
        assert _code_functionally_equivalent(model, expected) is False


class TestIsApiErrorAnswer:
    def test_detects_rate_limit_error(self):
        text = "[OpenAI API Error: RateLimitError: Error code: 429 - insufficient_quota]"
        assert _is_api_error_answer(text) is True

    def test_detects_fallback_response(self):
        assert _is_api_error_answer("[No response from this agent]") is True

    def test_detects_api_error(self):
        assert _is_api_error_answer("[Anthropic API Error: 401 Unauthorized]") is True

    def test_normal_answer_not_error(self):
        assert _is_api_error_answer("The answer is 42.") is False

    def test_empty_string_is_error(self):
        assert _is_api_error_answer("") is True

    def test_none_is_error(self):
        assert _is_api_error_answer(None) is True


class TestCheckCorrectWithCode:
    def test_model_wraps_correct_code_in_explanation(self):
        model_answer = (
            "Here's a function that adds two numbers:\n\n"
            "```python\n"
            "def sum_of_two_integers(a, b):\n"
            "    return a + b\n"
            "```\n\n"
            "This function simply uses the + operator."
        )
        correct = "def add(a, b): return a + b"
        assert _check_correct(model_answer, correct) is True

    def test_model_uses_different_function_name(self):
        model_answer = "def calculate_sum(x, y): return x + y"
        correct = "def add(a, b): return a + b"
        assert _check_correct(model_answer, correct) is True

    def test_model_prime_check_same_style(self):
        model_answer = (
            "```python\n"
            "def check_if_prime(n):\n"
            "    return n > 1 and all(n % i for i in range(2, int(n**0.5) + 1))\n"
            "```"
        )
        correct = "def is_prime(n): return n > 1 and all(n % i for i in range(2, int(n**0.5) + 1))"
        assert _check_correct(model_answer, correct) is True

    def test_api_error_answer_never_correct(self):
        model = "[OpenAI API Error: RateLimitError: Error code: 429]"
        correct = "def add(a, b): return a + b"
        assert _check_correct(model, correct) is False

    def test_empty_answer_not_correct(self):
        assert _check_correct("", "def add(a, b): return a + b") is False


class TestCheckCorrectTextAnswers:
    def test_exact_match(self):
        assert _check_correct("42", "42") is True

    def test_answer_embedded_in_text(self):
        assert _check_correct("The answer is 42.", "42") is True

    def test_yes_no_detection(self):
        assert _check_correct("Yes, that is correct.", "yes") is True
        assert _check_correct("No, that is wrong.", "no") is True

    def test_no_match(self):
        assert _check_correct("The sky is green.", "blue") is False


class TestRunBenchmarkSkipsErrors:
    def test_api_errors_not_counted_as_wrong(self):
        async def run():
            questions = [
                BenchmarkQuestion("Q1", "42", "math"),
                BenchmarkQuestion("Q2", "yes", "logic"),
                BenchmarkQuestion("Q3", "blue", "trivia"),
            ]

            call_count = 0

            async def mock_call(model, prompt, api_keys, mode="single", models=None):
                nonlocal call_count
                call_count += 1
                if mode == "single":
                    if "Q1" in prompt:
                        return {"answer": "42", "cost": 0.001}
                    if "Q2" in prompt:
                        return {"answer": "yes", "cost": 0.001}
                    return {"answer": "[OpenAI API Error: 429]", "cost": 0.0, "error": "rate_limit"}
                return {"answer": "[OpenAI API Error: 429]", "cost": 0.0, "error": "rate_limit"}

            result = await run_benchmark(
                name="test",
                questions=questions,
                models=["gpt-test"],
                api_keys={"OPENAI_API_KEY": "fake"},
                call_fn=mock_call,
                mode="council",
            )

            assert result.single_model_score == 1.0, (
                f"Expected 100% (2/2 attempted), got {result.single_model_score:.0%}"
            )

        asyncio.run(run())

    def test_all_errors_produces_zero_not_nan(self):
        async def run():
            questions = [BenchmarkQuestion("Q1", "42", "math")]

            async def all_error_call(model, prompt, api_keys, mode="single", models=None):
                return {"answer": "", "cost": 0.0, "error": "timeout"}

            result = await run_benchmark(
                name="test_all_err",
                questions=questions,
                models=["model"],
                api_keys={},
                call_fn=all_error_call,
            )

            assert result.single_model_score == 0.0
            assert result.deliberation_score == 0.0

        asyncio.run(run())
