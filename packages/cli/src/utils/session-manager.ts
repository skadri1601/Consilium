import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { ChatSession, ChatSessionData } from '../commands/chat-session';
import { ConsiliumClient } from '../api/client';
import { ContextManager } from './context-manager';

const SESSION_DIR = path.join(os.homedir(), '.consilium', 'sessions');

export interface SessionMetadata {
  id: string;
  topic: string;
  date: string;
  modelCount: number;
}

export class SessionManager {
  private sessionDir: string;

  constructor(sessionDir: string = SESSION_DIR) {
    this.sessionDir = sessionDir;
  }

  private ensureSessionDir(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  saveSession(session: ChatSession): string {
    this.ensureSessionDir();
    const data = session.toJSON();
    const sessionId = data.id || `session-${Date.now()}`;
    data.id = sessionId;
    session.id = sessionId;

    const filePath = path.join(this.sessionDir, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return sessionId;
  }

  listSessions(): SessionMetadata[] {
    if (!fs.existsSync(this.sessionDir)) {
      return [];
    }

    const files = fs.readdirSync(this.sessionDir).filter((f) => f.endsWith('.json'));
    const result: SessionMetadata[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(this.sessionDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: ChatSessionData = JSON.parse(content);
        const raw = data.debates?.[0]?.topic || 'Untitled';
        const topic = raw.length > 40 ? raw.substring(0, 40) + '...' : raw;
        result.push({
          id: data.id || path.basename(file, '.json'),
          topic,
          date: data.createdAt || '',
          modelCount: data.models?.length ?? 0,
        });
      } catch {
        // Skip invalid session files
      }
    }

    result.sort((a, b) => (b.date > a.date ? 1 : -1));
    return result;
  }

  loadSession(sessionId: string): ChatSession {
    this.ensureSessionDir();
    const filePath = path.join(this.sessionDir, `${sessionId}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data: ChatSessionData = JSON.parse(content);

    const client = new ConsiliumClient();
    const contextManager = new ContextManager();
    const session = ChatSession.fromJSON(data, client, contextManager);

    if (data.contextFilePaths?.length) {
      for (const filePath of data.contextFilePaths) {
        try {
          contextManager.addFile(filePath);
        } catch (error: any) {
          console.warn(
            chalk.yellow(`⚠️  Could not reload file: ${filePath}`),
            error?.message || ''
          );
        }
      }
    }

    return session;
  }
}
