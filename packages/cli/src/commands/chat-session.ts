import { ConsiliumClient, DebateEvent } from '../api/client';
import { ContextManager } from '../utils/context-manager';
import { loadConfig } from '../utils/config';
import { createStreamHandlers } from '../utils/stream-renderer';

const DEFAULT_MODELS = ['gpt-4o-mini', 'claude-haiku', 'gemini-flash'];

export interface DebateRecord {
  topic: string;
  goldenPrompt?: string;
}

export interface ChatSessionData {
  id: string;
  debates: DebateRecord[];
  contextFilePaths: string[];
  models: string[];
  createdAt: string;
}

export class ChatSession {
  readonly client: ConsiliumClient;
  readonly contextManager: ContextManager;
  models: string[];
  lastGoldenPrompt: string | undefined;
  debates: DebateRecord[];
  id: string | undefined;
  /** Paths passed to /file for session save/resume */
  contextFilePaths: string[];

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
    this.contextFilePaths = [];
  }

  async debate(userInput: string): Promise<void> {
    const context = this.contextManager.buildContext();
    const effectiveTopic = context
      ? `${context}\n\nQUESTION: ${userInput}`
      : userInput;

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

    this.debates.push({ topic: userInput, goldenPrompt });
  }

  toJSON(): ChatSessionData {
    return {
      id: this.id || `session-${Date.now()}`,
      debates: this.debates,
      contextFilePaths: [...this.contextFilePaths],
      models: this.models,
      createdAt: new Date().toISOString(),
    };
  }

  static fromJSON(
    data: ChatSessionData,
    client: ConsiliumClient,
    contextManager: ContextManager
  ): ChatSession {
    const session = new ChatSession(client, contextManager);
    session.id = data.id;
    session.debates = data.debates || [];
    session.models = data.models || DEFAULT_MODELS;
    session.contextFilePaths = data.contextFilePaths || [];
    return session;
  }
}
