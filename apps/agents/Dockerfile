FROM python:3.13.13-alpine3.23 AS deps
WORKDIR /app

RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY apps/agents/pyproject.toml apps/agents/README.md ./
RUN mkdir -p src && touch src/__init__.py
RUN pip install --no-cache-dir .

FROM python:3.13.13-alpine3.23 AS runner
WORKDIR /app

RUN addgroup -S -g 1001 appuser && \
    adduser -S -u 1001 -G appuser appuser

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=deps /app/.venv /app/.venv
COPY apps/agents/src ./src

RUN chown -R appuser:appuser /app

ENV PATH="/app/.venv/bin:$PATH"

USER appuser

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
