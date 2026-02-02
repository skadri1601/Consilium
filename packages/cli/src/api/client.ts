import EventSource from 'eventsource';
import { loadConfig } from '../utils/config';

export interface DebateOptions {
  topic: string;
  models?: string[];
}

export interface DebateEvent {
  type: 'debate_start' | 'agent_start' | 'agent_chunk' | 'agent_complete' | 'consensus' | 'done' | 'error';
  agent?: string;
  text?: string;
  error?: string;
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
    const config = loadConfig();
    return config.apiKey ?? this.apiKey;
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
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: options.topic,
          models: options.models || ['gpt-4o-mini', 'claude-haiku', 'gemini-flash'],
        }),
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

      // Handler for processing all event types
      const handleEvent = (eventType: string) => (event: any) => {
        try {
          if (!connectionEstablished) {
            this.log('SSE connection established');
            connectionEstablished = true;
          }

          eventCount++;
          this.log(`Received event #${eventCount}: ${eventType}`);

          const data = JSON.parse(event.data);
          // Add the event type to the data
          const debateEvent: DebateEvent = {
            type: eventType as any,
            agent: data.agent,
            text: data.chunk || data.consensus || data.response,
            error: data.error,
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
        } catch (error: any) {
          this.logError('Failed to parse event data', error);
        }
      };

      // Add listeners for all event types
      eventSource.addEventListener('debate_start', handleEvent('debate_start'));
      eventSource.addEventListener('agent_start', handleEvent('agent_start'));
      eventSource.addEventListener('agent_chunk', handleEvent('agent_chunk'));
      eventSource.addEventListener('agent_complete', handleEvent('agent_complete'));
      eventSource.addEventListener('consensus', handleEvent('consensus'));
      eventSource.addEventListener('done', handleEvent('done'));
      eventSource.addEventListener('error', handleEvent('error'));

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

      // Timeout after 5 minutes
      setTimeout(() => {
        this.log('Stream timeout - closing connection');
        eventSource.close();
        reject(new Error('Stream timeout after 5 minutes'));
      }, 5 * 60 * 1000);
    });
  }
}
