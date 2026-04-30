import {
  AuthenticationError,
  ConsiliumApiError,
  RateLimitError,
  StreamAbortedError,
} from "./errors";
import type {
  CostEstimate,
  CreateDebateRequest,
  CreateDebateResponse,
  CreateDeliberationRequest,
  CurrentUser,
  DebateDetail,
  DebateSummary,
  SseEnvelope,
} from "./types";

const API_PATH_PREFIX = "/api/v1";

export interface ConsiliumClientOptions {
  apiUrl: string;
  getToken: () => string | undefined;
  timeoutMs?: number;
}

export interface StreamHandle {
  cancel: () => void;
  done: Promise<void>;
}

export class ConsiliumClient {
  private readonly apiUrl: string;
  private readonly getToken: () => string | undefined;
  private readonly timeoutMs: number;

  constructor(opts: ConsiliumClientOptions) {
    const trimmed = opts.apiUrl.endsWith("/")
      ? opts.apiUrl.slice(0, -1)
      : opts.apiUrl;
    this.apiUrl = trimmed;
    this.getToken = opts.getToken;
    this.timeoutMs = opts.timeoutMs ?? 120_000;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  setToken(_token: string): void {
    // Token is read lazily via getToken; this method exists for forward compat.
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const base: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const token = this.getToken();
    if (token) {
      base["Authorization"] = `Bearer ${token}`;
    }
    if (extra) {
      Object.assign(base, extra);
    }
    return base;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const url = `${this.apiUrl}${API_PATH_PREFIX}${path}`;

    try {
      const res = await fetch(url, {
        method,
        headers: this.headers(),
        signal: controller.signal,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...init,
      });

      if (res.status === 401) {
        throw new AuthenticationError(await res.text().catch(() => ""));
      }
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        throw new RateLimitError(
          retryAfter ? parseInt(retryAfter, 10) : undefined,
        );
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new ConsiliumApiError(
          text || `Request failed with status ${res.status}`,
          res.status,
          text,
        );
      }

      if (res.status === 204) {
        return undefined as T;
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
        headers: this.headers(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<CurrentUser> {
    return this.request<CurrentUser>("GET", "/users/me");
  }

  async estimateCost(payload: {
    topic: string;
    models: string[];
    mode?: string;
  }): Promise<CostEstimate> {
    return this.request<CostEstimate>("POST", "/debates/estimate", payload);
  }

  async createDebate(
    payload: CreateDebateRequest,
  ): Promise<CreateDebateResponse> {
    return this.request<CreateDebateResponse>("POST", "/debates", {
      ...payload,
      debateSource: payload.debateSource ?? "vscode",
    });
  }

  async listDebates(opts: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<DebateSummary[]> {
    const params = new URLSearchParams();
    if (opts.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts.offset !== undefined) params.set("offset", String(opts.offset));
    if (opts.search) params.set("search", opts.search);
    const qs = params.toString();
    return this.request<DebateSummary[]>(
      "GET",
      qs ? `/debates?${qs}` : "/debates",
    );
  }

  async getDebate(id: string): Promise<DebateDetail> {
    return this.request<DebateDetail>("GET", `/debates/${id}`);
  }

  async cancelDebate(id: string): Promise<void> {
    await this.request<void>("POST", `/debates/${id}/cancel`);
  }

  async retryDebate(id: string): Promise<CreateDebateResponse> {
    return this.request<CreateDebateResponse>("POST", `/debates/${id}/retry`);
  }

  async deleteDebate(id: string): Promise<void> {
    await this.request<void>("DELETE", `/debates/${id}`);
  }

  async renameDebate(id: string, topic: string): Promise<DebateDetail> {
    return this.request<DebateDetail>("PATCH", `/debates/${id}`, { topic });
  }

  async archiveDebate(id: string, archived: boolean): Promise<DebateDetail> {
    return this.request<DebateDetail>("PATCH", `/debates/${id}`, { archived });
  }

  streamDebate(
    id: string,
    onEvent: (event: SseEnvelope) => void,
  ): StreamHandle {
    return this.openSseStream(`/debates/${id}/stream`, onEvent);
  }

  async createDeliberation(
    payload: CreateDeliberationRequest,
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>("POST", "/deliberation", payload);
  }

  async createRedTeam(
    payload: CreateDeliberationRequest,
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>("POST", "/deliberation/redteam", payload);
  }

  async createBlindEval(
    payload: CreateDeliberationRequest,
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>("POST", "/deliberation/blind", payload);
  }

  async cancelDeliberation(id: string): Promise<void> {
    await this.request<void>("POST", `/deliberation/${id}/cancel`);
  }

  async retryDeliberation(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>("POST", `/deliberation/${id}/retry`);
  }

  async getDeliberation(id: string): Promise<unknown> {
    return this.request<unknown>("GET", `/deliberation/${id}`);
  }

  streamDeliberation(
    id: string,
    onEvent: (event: SseEnvelope) => void,
  ): StreamHandle {
    return this.openSseStream(`/deliberation/${id}/stream`, onEvent);
  }

  private openSseStream(
    path: string,
    onEvent: (event: SseEnvelope) => void,
  ): StreamHandle {
    const controller = new AbortController();
    const url = `${this.apiUrl}${API_PATH_PREFIX}${path}`;

    const done = (async () => {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: this.headers({ Accept: "text/event-stream" }),
          signal: controller.signal,
        });

        if (res.status === 401) {
          throw new AuthenticationError();
        }
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new ConsiliumApiError(
            text || `Stream failed with status ${res.status}`,
            res.status,
            text,
          );
        }
        if (!res.body) {
          throw new ConsiliumApiError("SSE response body is null");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.replace(/\r$/, "");
            if (!trimmed.startsWith("data:")) continue;
            const raw = trimmed.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw) as SseEnvelope;
              onEvent(parsed);
            } catch {
              // skip malformed payload
            }
          }
        }
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === "AbortError" || err.name === "TimeoutError")
        ) {
          throw new StreamAbortedError();
        }
        throw err;
      }
    })();

    return {
      cancel: () => controller.abort(),
      done,
    };
  }
}
