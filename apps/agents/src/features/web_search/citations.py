from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable
from urllib.parse import urlparse

from .providers import WebSearchResult


@dataclass
class Citation:
    index: int
    title: str
    url: str
    snippet: str
    domain: str
    source: str = ""


def _domain_for(url: str) -> str:
    try:
        parsed = urlparse(url)
        host = (parsed.netloc or "").lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except ValueError:
        return ""


def extract_citations(results: Iterable[WebSearchResult]) -> list[Citation]:
    seen: set[str] = set()
    citations: list[Citation] = []
    next_index = 1
    for result in results:
        url = (result.url or "").strip()
        if not url:
            continue
        key = url.lower()
        if key in seen:
            continue
        seen.add(key)
        citations.append(
            Citation(
                index=next_index,
                title=result.title.strip(),
                url=url,
                snippet=_short_snippet(result.snippet),
                domain=_domain_for(url),
                source=result.source or "",
            )
        )
        next_index += 1
    return citations


def _short_snippet(snippet: str, *, max_length: int = 320) -> str:
    text = re.sub(r"\s+", " ", snippet or "").strip()
    if len(text) <= max_length:
        return text
    return text[: max_length - 1].rstrip() + "…"


def format_citations_markdown(citations: list[Citation]) -> str:
    if not citations:
        return ""
    lines = []
    for citation in citations:
        label = citation.title or citation.url
        line = f"[{citation.index}] {label} - {citation.url}"
        if citation.snippet:
            line += f"\n    {citation.snippet}"
        lines.append(line)
    return "\n".join(lines)
