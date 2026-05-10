from __future__ import annotations
import os
import logging
from contextlib import contextmanager
from typing import Generator

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource

logger = logging.getLogger(__name__)

_initialized = False


def init_telemetry(
    service_name: str | None = None,
    export_to_console: bool = False,
) -> TracerProvider:
    global _initialized
    if _initialized:
        return trace.get_tracer_provider()

    name = service_name or os.getenv("OTEL_SERVICE_NAME", "consilium-agents")
    resource = Resource.create({
        "service.name": name,
        "service.version": os.getenv("SERVICE_VERSION", "0.1.0"),
    })

    provider = TracerProvider(resource=resource)

    if export_to_console:
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        try:
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
            exporter = OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces")
            provider.add_span_processor(BatchSpanProcessor(exporter))
        except Exception as exc:
            logger.warning("Failed to initialize OTLP exporter: %s", exc)

    trace.set_tracer_provider(provider)
    _initialized = True
    return provider


def get_tracer(name: str = "consilium.agents") -> trace.Tracer:
    return trace.get_tracer(name)


@contextmanager
def create_debate_span(
    tracer: trace.Tracer,
    debate_id: str,
    mode: str = "council",
    models: list[str] | None = None,
) -> Generator[trace.Span, None, None]:
    with tracer.start_as_current_span(
        "debate",
        attributes={
            "debate.id": debate_id,
            "debate.mode": mode,
            "debate.model_count": len(models) if models else 0,
        },
    ) as span:
        yield span


@contextmanager
def create_round_span(
    tracer: trace.Tracer,
    debate_id: str,
    round_number: int,
    description: str = "",
) -> Generator[trace.Span, None, None]:
    with tracer.start_as_current_span(
        f"debate.round.{round_number}",
        attributes={
            "debate.id": debate_id,
            "debate.round": round_number,
            "debate.round.description": description,
        },
    ) as span:
        yield span


@contextmanager
def create_agent_span(
    tracer: trace.Tracer,
    model_id: str,
    round_number: int,
) -> Generator[trace.Span, None, None]:
    with tracer.start_as_current_span(
        "debate.agent.generate",
        attributes={
            "agent.model": model_id,
            "agent.round": round_number,
        },
    ) as span:
        yield span


@contextmanager
def create_tool_span(
    tracer: trace.Tracer,
    tool_name: str,
    call_id: str,
) -> Generator[trace.Span, None, None]:
    with tracer.start_as_current_span(
        "debate.tool.execute",
        attributes={
            "tool.name": tool_name,
            "tool.call_id": call_id,
        },
    ) as span:
        yield span
