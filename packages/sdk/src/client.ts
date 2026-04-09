import type {
  ClientConfig,
  DeliberateOptions,
  DeliberationResult,
  DeliberationEvent,
  RedTeamOptions,
  RedTeamReport,
  BlindEvalOptions,
  EvaluationResult,
  CostEstimate,
  HealthStatus,
} from './types.js';
import {
  AuthenticationError,
  ConsiliumError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from './errors.js';

const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1_000;

export class ConsiliumClient {
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(config: ClientConfig = {}) {
    const url = config.apiUrl ?? 'http://localhost:3000/api';
    this.apiUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      h['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return h;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await this.sleep(this.retryDelay * attempt);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const init: RequestInit = {
          method,
          headers: this.headers(),
          signal: controller.signal,
        };
        if (body !== undefined) {
          init.body = JSON.stringify(body);
        }

        const res = await fetch(`${this.apiUrl}${path}`, init);
        clearTimeout(timer);

        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          lastError = new RateLimitError(
            undefined,
            retryAfter ? parseInt(retryAfter, 10) : undefined,
          );
          continue;
        }

        if (res.status >= 500) {
          const text = await res.text().catch(() => '');
          lastError = new ServerError(text || undefined, res.status);
          continue;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (res.status === 401) throw new AuthenticationError(text || undefined);
          throw new ConsiliumError(text || `Request failed with status ${res.status}`, res.status);
        }

        return res.json() as Promise<T>;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof ConsiliumError) throw err;
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastError = new TimeoutError();
          continue;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    if (lastError instanceof ConsiliumError) throw lastError;
    throw new ConsiliumError(lastError?.message ?? 'Request failed after retries');
  }

  async deliberate(options: DeliberateOptions): Promise<DeliberationResult> {
    return this.request<DeliberationResult>('POST', '/deliberate', options);
  }

  async redTeam(options: RedTeamOptions): Promise<RedTeamReport> {
    return this.request<RedTeamReport>('POST', '/red-team', options);
  }

  async blindEval(options: BlindEvalOptions): Promise<EvaluationResult> {
    return this.request<EvaluationResult>('POST', '/blind-eval', options);
  }

  async estimateCost(options: Pick<DeliberateOptions, 'topic' | 'mode'>): Promise<CostEstimate> {
    return this.request<CostEstimate>('POST', '/estimate-cost', options);
  }

  async healthCheck(): Promise<HealthStatus> {
    return this.request<HealthStatus>('GET', '/health');
  }

  async *streamDeliberation(options: DeliberateOptions): AsyncIterable<DeliberationEvent> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}/deliberate/stream`, {
        method: 'POST',
        headers: { ...this.headers(), Accept: 'text/event-stream' },
        body: JSON.stringify(options),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new TimeoutError();
      }
      throw new ConsiliumError(err instanceof Error ? err.message : String(err));
    }

    if (!res.ok) {
      clearTimeout(timer);
      const text = await res.text().catch(() => '');
      if (res.status === 401) throw new AuthenticationError(text || undefined);
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        throw new RateLimitError(undefined, retryAfter ? parseInt(retryAfter, 10) : undefined);
      }
      if (res.status >= 500) throw new ServerError(text || undefined, res.status);
      throw new ConsiliumError(text || `Request failed with status ${res.status}`, res.status);
    }

    if (!res.body) {
      clearTimeout(timer);
      throw new ConsiliumError('Response body is null');
    }

    try {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
              yield JSON.parse(raw) as DeliberationEvent;
            } catch {
              // skip malformed
            }
          }
        }
      }
    } finally {
      clearTimeout(timer);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
