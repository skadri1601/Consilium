import { DEFAULT_API_ORIGIN, loadConfig } from "./config.js";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  provider: string;
}

const UNAVAILABLE_MESSAGE =
  "Web search requires backend support - see docs/superpowers/specs/2026-05-20-web-search-grounding.md";

export async function webSearch(query: string): Promise<WebSearchResponse> {
  const config = loadConfig();
  const apiUrl = (config.apiUrl ?? DEFAULT_API_ORIGIN).replace(/\/$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/api/v1/tools/web-search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    console.log(UNAVAILABLE_MESSAGE);
    return { results: [], provider: "unavailable" };
  }

  if (res.status === 404) {
    console.log(UNAVAILABLE_MESSAGE);
    return { results: [], provider: "unavailable" };
  }
  if (!res.ok) {
    console.log(UNAVAILABLE_MESSAGE);
    return { results: [], provider: "unavailable" };
  }

  try {
    const data = (await res.json()) as Partial<WebSearchResponse>;
    if (!Array.isArray(data.results)) {
      return { results: [], provider: data.provider ?? "unavailable" };
    }
    return {
      results: data.results,
      provider: data.provider ?? "unknown",
    };
  } catch {
    console.log(UNAVAILABLE_MESSAGE);
    return { results: [], provider: "unavailable" };
  }
}
