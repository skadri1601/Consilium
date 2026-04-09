import EventSource from 'eventsource';
import { loadConfig } from '../utils/config';

export interface DebateOptions {
  topic: string;
  models?: string[];
  mode?: 'quick' | 'council' | 'deep' | 'blind' | 'redteam' | 'jury' | 'market' | 'auto';
  conversationId?: string;
  files?: Array<{ name: string; content: string }>;
  images?: Array<{ name: string; base64: string }>;
  projectFiles?: Array<{ path: string; content: string; category: string }>;
}

export interface DeliberationOptions {
  topic: string;
  models?: string[];
  mode?: string;
  rounds?: number;
  convergenceThreshold?: number;
}

export interface RedTeamOptions {
  content: string;
  models?: string[];
  categories?: string[];
}

export interface DeliberationEvent {
  type: 'deliberation_start' | 'phase_change' | 'model_progress' | 'convergence_update' | 'dissent_detected' | 'vote_cast' | 'cost_update' | 'deliberation_complete' | 'done' | 'error';
  phase?: string;
  agent?: string;
  text?: string;
  error?: string;
  deliberationId?: string;
  progress?: number;
  convergence?: number;
  dissent?: { agent: string; reason: string };
  vote?: { agent: string; position: string; confidence: number };
  cost?: { model: string; tokens: number; cost: number };
}

export interface DebateEvent {
  type: 'debate_start' | 'agent_start' | 'agent_chunk' | 'agent_complete' | 'consensus' | 'done' | 'error' | 'debate:cancelled';
  agent?: string;
  text?: string;
  error?: string;
  debateId?: string;
}

export class ConsiliumClient {
  private apiUrl: string;
  private apiKey?: string;
  private debug: boolean;

  constructor() {
    const config = loadConfig();
    this.apiUrl = config.apiUrl || 'http://localhost:4000';
    this.apiKey = config.apiKey;
    this.debug =
      config.debug === true ||
      process.env.CONSILIUM_DEBUG === '1' ||
      process.env.CONSILIUM_DEBUG === 'true';
  }

  private log(message: string, data?: any) {
    if (this.debug) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  private logError(message: string, error: any) {
    console.error(`[ERROR] ${message}`);
    if (error.cause) {
      console.error(`[ERROR] Cause: ${error.cause.code || error.cause.message}`);
    }
    console.error(`[ERROR] Details:`, error.message);
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.log('Checking API health...');
      const response = await fetch(`${this.apiUrl}/api/v1/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      this.log(`Health check status: ${response.status}`);

      if (!response.ok) {
        this.logError(`API health check failed with status ${response.status}`, new Error(await response.text()));
        return false;
      }

      const health = await response.json();
      this.log('API is healthy', health);
      return true;
    } catch (error: any) {
      this.logError('Failed to connect to API', error);
      console.error(`\n✗ Cannot reach API at ${this.apiUrl}`);
      console.error('   Make sure the API is running:');
      console.error('   → cd apps/api && pnpm dev\n');
      return false;
    }
  }

  private getApiKey(): string | undefined {
    return this.apiKey;
  }

  async createDebate(options: DebateOptions): Promise<{ id: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const apiKey = this.getApiKey();
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const url = `${this.apiUrl}/api/v1/debates`;
    this.log(`Creating debate at: ${url}`);

    try {
      const body: Record<string, any> = {
        topic: options.topic,
        models: options.models || ['gpt-4o-mini', 'claude-haiku-4-5-20251001', 'gemini-2.0-flash'],
      };
      if (options.mode) body.mode = options.mode;
      if (options.conversationId) body.conversationId = options.conversationId;
      if (options.files?.length) body.context = { ...body.context, files: options.files };
      if (options.images?.length) body.context = { ...body.context, images: options.images };
      if (options.projectFiles?.length) body.context = { ...body.context, projectFiles: options.projectFiles };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      this.log(`Create debate response: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        this.logError(`Failed to create debate (${response.status})`, new Error(errorBody));

        if (response.status === 503) {
          console.error('\n✗ Service Unavailable - AI workers not responding');
          console.error('   Make sure the agents service is running:');
          console.error('   → cd apps/agents && poetry run uvicorn src.main:app --reload --port 8000\n');
        }

        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const result = (await response.json()) as { id: string };
      this.log(`Debate created with ID: ${result.id}`);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logError('Request timeout', error);
        throw new Error('Request timed out - API is not responding');
      }

      if (error.cause?.code === 'ECONNREFUSED') {
        this.logError('Connection refused', error);
        console.error(`\n✗ Cannot connect to API at ${this.apiUrl}`);
        console.error('   Make sure the API is running:');
        console.error('   → cd apps/api && pnpm dev\n');
      }

      throw error;
    }
  }

  async streamDebate(
    debateId: string,
    onEvent: (event: DebateEvent) => void
  ): Promise<void> {
    const streamUrl = `${this.apiUrl}/api/v1/debates/${debateId}/stream`;
    this.log(`Opening SSE stream: ${streamUrl}`);

    const init: { headers?: Record<string, string> } = {};
    const apiKey = this.getApiKey();
    if (apiKey) {
      init.headers = { Authorization: `Bearer ${apiKey}` };
    }

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(streamUrl, init);
      let eventCount = 0;
      let connectionEstablished = false;

      eventSource.onmessage = (event: any) => {
        try {
          if (!connectionEstablished) {
            this.log('SSE connection established');
            connectionEstablished = true;
          }

          const data = JSON.parse(event.data);
          const eventType = data.event ?? 'message';
          eventCount++;
          this.log(`Received event #${eventCount}: ${eventType}`);

          const debateEvent: DebateEvent = {
            type: eventType as DebateEvent['type'],
            agent: data.agent ?? data.agent_id,
            text: data.chunk ?? data.consensus ?? data.golden_prompt ?? data.goldenPrompt ?? data.response ?? data.content,
            error: data.error,
            debateId: data.debate_id ?? data.debateId,
          };

          onEvent(debateEvent);

          if (eventType === 'done') {
            this.log(`Stream completed after ${eventCount} events`);
            eventSource.close();
            resolve();
          }

          if (eventType === 'error') {
            this.logError('Received error event from server', data);
            eventSource.close();
            reject(new Error(data.error || 'Server error'));
          }

          if (eventType === 'debate:cancelled') {
            this.log('Debate cancelled');
            eventSource.close();
            resolve();
          }
        } catch (error: any) {
          this.logError('Failed to parse event data', error);
        }
      };

      eventSource.onerror = (error: any) => {
        this.logError('SSE connection error', error);

        if (!connectionEstablished) {
          console.error('\n✗ Failed to establish SSE stream');
          console.error(`   Check if agents service is running and accessible`);
          console.error(`   Stream URL: ${streamUrl}\n`);
        } else if (eventCount === 0) {
          console.error('\n✗ Stream connection closed without receiving any events');
          console.error('   The debate may not exist or agents service is not responding\n');
        } else {
          this.log(`Stream closed after ${eventCount} events`);
        }

        eventSource.close();
        reject(new Error('Stream connection failed'));
      };

      setTimeout(() => {
        this.log('Stream timeout - closing connection');
        eventSource.close();
        reject(new Error('Stream timeout after 5 minutes'));
      }, 5 * 60 * 1000);
    });
  }

  async cancelDebate(debateId: string): Promise<void> {
    const headers: Record<string, string> = {};
    const apiKey = this.getApiKey();
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${this.apiUrl}/api/v1/debates/${debateId}/cancel`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Cancel failed: HTTP ${response.status}`);
    }
  }

  async skipToJudge(debateId: string): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = this.getApiKey();
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${this.apiUrl}/api/v1/debates/${debateId}/skip`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Skip failed: HTTP ${response.status}`);
    }
  }

  async getDebateDetails(debateId: string): Promise<any> {
    const headers: Record<string, string> = {};
    const apiKey = this.getApiKey();
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${this.apiUrl}/api/v1/debates/${debateId}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async estimateCost(options: { topic: string; models: string[]; mode: string }): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = this.getApiKey();
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${this.apiUrl}/api/v1/debates/estimate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(options),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;
    return response.json();
  }

  async createDeliberation(topic: string, options: Partial<DeliberationOptions> = {}): Promise<{ id: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = this.getApiKey();
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const url = `${this.apiUrl}/api/v1/deliberation`;
    this.log(`Creating deliberation at: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ topic, ...options }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }

    return (await response.json()) as { id: string };
  }

  async streamDeliberation(
    id: string,
    onEvent: (event: DeliberationEvent) => void
  ): Promise<void> {
    const streamUrl = `${this.apiUrl}/api/v1/deliberation/${id}/stream`;
    this.log(`Opening deliberation stream: ${streamUrl}`);

    const init: { headers?: Record<string, string> } = {};
    const apiKey = this.getApiKey();
    if (apiKey) init.headers = { Authorization: `Bearer ${apiKey}` };

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(streamUrl, init);
      let eventCount = 0;
      let connectionEstablished = false;

      eventSource.onmessage = (event: any) => {
        try {
          if (!connectionEstablished) {
            this.log('Deliberation SSE connection established');
            connectionEstablished = true;
          }

          const data = JSON.parse(event.data);
          const eventType = data.event ?? 'message';
          eventCount++;
          this.log(`Deliberation event #${eventCount}: ${eventType}`);

          const deliberationEvent: DeliberationEvent = {
            type: eventType as DeliberationEvent['type'],
            phase: data.phase,
            agent: data.agent ?? data.agent_id,
            text: data.chunk ?? data.text ?? data.content ?? data.response,
            error: data.error,
            deliberationId: data.deliberation_id ?? data.deliberationId,
            progress: data.progress,
            convergence: data.convergence,
            dissent: data.dissent,
            vote: data.vote,
            cost: data.cost,
          };

          onEvent(deliberationEvent);

          if (eventType === 'done' || eventType === 'deliberation_complete') {
            this.log(`Deliberation stream completed after ${eventCount} events`);
            eventSource.close();
            resolve();
          }

          if (eventType === 'error') {
            eventSource.close();
            reject(new Error(data.error || 'Deliberation error'));
          }
        } catch (error: any) {
          this.logError('Failed to parse deliberation event', error);
        }
      };

      eventSource.onerror = (error: any) => {
        this.logError('Deliberation SSE error', error);
        eventSource.close();
        reject(new Error('Deliberation stream failed'));
      };

      setTimeout(() => {
        eventSource.close();
        reject(new Error('Deliberation stream timeout after 10 minutes'));
      }, 10 * 60 * 1000);
    });
  }

  async createRedTeam(content: string, options: Partial<RedTeamOptions> = {}): Promise<{ id: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = this.getApiKey();
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const url = `${this.apiUrl}/api/v1/deliberation/red-team`;
    this.log(`Creating red team assessment at: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, ...options }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }

    return (await response.json()) as { id: string };
  }

  getApiUrl(): string {
    return this.apiUrl;
  }
}
