import { ConsiliumClient, DebateEvent } from '../api/client';
import { ContextManager } from '../utils/context-manager';
import { loadConfig } from '../utils/config';
import { createStreamHandlers } from '../utils/stream-renderer';

const DEFAULT_MODELS = ['gpt-4o-mini', 'claude-haiku', 'gemini-flash'];
const MAX_CONTEXT_SYNTHESES = 5;

export interface DebateRecord {
  topic: string;
  goldenPrompt?: string;
  timestamp: string;
}

export interface ChatSessionData {
  id: string;
  name: string;
  debates: DebateRecord[];
  contextFilePaths: string[];
  models: string[];
  createdAt: string;
  updatedAt: string;
}

export class ChatSession {
  readonly client: ConsiliumClient;
  readonly contextManager: ContextManager;
  models: string[];
  lastGoldenPrompt: string | undefined;
  debates: DebateRecord[];
  id: string | undefined;
  name: string;
  contextFilePaths: string[];
  createdAt: string;
  updatedAt: string;

  constructor(client: ConsiliumClient, contextManager: ContextManager) {
    this.client = client;
    this.contextManager = contextManager;
    const config = loadConfig();
    const configModels = (config as { models?: string[] }).models;
    this.models = Array.isArray(configModels) && configModels.length > 0
      ? configModels
      : DEFAULT_MODELS;
    this.lastGoldenPrompt = undefined;
    this.debates = [];
    this.id = undefined;
    this.name = '';
    this.contextFilePaths = [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  private buildFollowUpContext(): string {
    const previous = this.debates.filter((d) => d.goldenPrompt);
    if (previous.length === 0) return '';

    const recent = previous.slice(-MAX_CONTEXT_SYNTHESES);
    const sections: string[] = ['=== PREVIOUS DEBATE SYNTHESES ===\n'];

    for (const d of recent) {
      sections.push(`--- Topic: ${d.topic} ---`);
      sections.push(d.goldenPrompt!);
      sections.push('');
    }

    sections.push('=== END PREVIOUS SYNTHESES ===\n');
    return sections.join('\n');
  }

  async debate(userInput: string): Promise<void> {
    const context = this.contextManager.buildContext();
    const followUp = this.buildFollowUpContext();

    let effectiveTopic = userInput;
    if (followUp || context) {
      const parts: string[] = [];
      if (followUp) parts.push(followUp);
      if (context) parts.push(context);
      parts.push(`QUESTION: ${userInput}`);
      effectiveTopic = parts.join('\n\n');
    }

    const debate = await this.client.createDebate({
      topic: effectiveTopic,
      models: this.models,
    });

    let goldenPrompt = '';
    const handleEvent = createStreamHandlers({
      topic: userInput,
      onComplete: () => {},
    });

    await this.client.streamDebate(debate.id, (event: DebateEvent) => {
      if (event.type === 'consensus' && event.text) {
        goldenPrompt = event.text;
        this.lastGoldenPrompt = event.text;
      }
      handleEvent(event);
    });

    const now = new Date().toISOString();
    this.debates.push({ topic: userInput, goldenPrompt, timestamp: now });
    this.updatedAt = now;

    if (!this.name && this.debates.length === 1) {
      this.name = userInput.length > 60
        ? userInput.substring(0, 60) + '...'
        : userInput;
    }
  }

  toJSON(): ChatSessionData {
    const now = new Date().toISOString();
    return {
      id: this.id || `session-${Date.now()}`,
      name: this.name,
      debates: this.debates,
      contextFilePaths: [...this.contextFilePaths],
      models: this.models,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt || now,
    };
  }

  static fromJSON(
    data: ChatSessionData,
    client: ConsiliumClient,
    contextManager: ContextManager
  ): ChatSession {
    const session = new ChatSession(client, contextManager);
    session.id = data.id;
    session.name = data.name || '';
    session.debates = data.debates || [];
    session.models = data.models || DEFAULT_MODELS;
    session.contextFilePaths = data.contextFilePaths || [];
    session.createdAt = data.createdAt || new Date().toISOString();
    session.updatedAt = data.updatedAt || data.createdAt || new Date().toISOString();
    if (session.debates.length > 0) {
      const last = session.debates[session.debates.length - 1];
      if (last.goldenPrompt) {
        session.lastGoldenPrompt = last.goldenPrompt;
      }
    }
    return session;
  }
}
