FROM python:3.11-slim AS base

# Install Poetry
RUN pip install poetry

# Configure Poetry
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_VIRTUALENVS_CREATE=true \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY apps/agents/pyproject.toml apps/agents/poetry.lock apps/agents/README.md ./
# Create minimal src directory structure for Poetry
RUN mkdir -p src && touch src/__init__.py
RUN poetry install --without dev

# Production
FROM base AS runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=deps /app/.venv /app/.venv
COPY apps/agents/src ./src

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
