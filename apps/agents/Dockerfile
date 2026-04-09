FROM python:3.11-slim AS base

RUN pip install poetry

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_VIRTUALENVS_CREATE=true \
    POETRY_CACHE_DIR=/tmp/poetry_cache

FROM base AS deps
WORKDIR /app
COPY apps/agents/pyproject.toml apps/agents/README.md ./
RUN mkdir -p src && touch src/__init__.py
RUN poetry install --without dev

FROM base AS runner
WORKDIR /app

RUN groupadd --system --gid 1001 appuser && \
    useradd --system --uid 1001 --gid appuser appuser

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=deps /app/.venv /app/.venv
COPY apps/agents/src ./src

RUN chown -R appuser:appuser /app

ENV PATH="/app/.venv/bin:$PATH"

USER appuser

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
