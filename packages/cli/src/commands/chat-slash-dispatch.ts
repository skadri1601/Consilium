import fs from 'node:fs';
import path from 'node:path';
import type { Interface as ReadlineInterface } from 'node:readline';
import { ChatSession } from './chat-session';
import { SessionManager } from '../utils/session-manager';
import { loadConfig, updateConfig } from '../utils/config';
import { openBrowser } from '../utils/open-browser';
import { style } from '../utils/visual-system';
import {
  handleConversationsCommand,
  handleContextCommand,
  handleModeCommand,
  handleEstimateCommand,
  handleOutputCommand,
  handleWorkspaceCommand,
} from '../utils/chat-commands';
import { log } from '../utils/logger';

const st = style();

export type SlashResult = 'exit' | 'continue' | 'delete-pending';

export interface SlashDelegates {
  printHelp: () => void;
  printConversationHistory: (session: ChatSession) => void;
  handleSearchCommand: (query: string, sm: SessionManager) => void;
  handleSessionsListCommand: (sm: SessionManager) => void;
  handleRenameCommand: (args: string[], session: ChatSession, sm: SessionManager) => void;
}

function slashExit(sessionManager: SessionManager, session: ChatSession): SlashResult {
  const sessionId = sessionManager.saveSession(session);
  log('INFO', 'session_saved', { sessionId });
  console.log(
    st.success('\nSession saved. Resume with:'),
    st.brand(`consilium sessions resume ${sessionId}\n`)
  );
  return 'exit';
}

function slashFile(args: string[], session: ChatSession): SlashResult {
  const filePath = args[0];
  if (!filePath) {
    console.log(st.warning('Usage: /file <path>'));
    return 'continue';
  }
  try {
    session.contextManager.addFile(filePath);
    session.contextFilePaths.push(filePath);
    const files = session.contextManager.getFiles();
    const entry = files.find((f) => f.name === path.basename(filePath));
    const sizeKb = entry ? (entry.size / 1024).toFixed(1) : '?';
    console.log(st.success(`Added ${path.basename(filePath)} to context (${sizeKb} KB)`));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(st.error('Error:'), msg);
  }
  return 'continue';
}

function slashImage(args: string[], session: ChatSession): SlashResult {
  const imagePath = args[0];
  if (!imagePath) {
    console.log(st.warning('Usage: /image <path>'));
    return 'continue';
  }
  try {
    session.contextManager.addImage(imagePath);
    session.contextImagePaths.push(imagePath);
    console.log(st.success(`Added ${path.basename(imagePath)} to context`));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(st.error('Error:'), msg);
  }
  return 'continue';
}

function slashClear(session: ChatSession): SlashResult {
  session.contextManager.clear();
  session.contextFilePaths = [];
  session.contextImagePaths = [];
  console.log(st.success('Context cleared.'));
  return 'continue';
}

function slashStatus(session: ChatSession): SlashResult {
  const files = session.contextManager.getFiles();
  const totalSize = session.contextManager.getTotalSize();
  console.log(st.bold('\nSession Status\n'));
  if (session.name) console.log(st.brand('Name:'), session.name);
  if (session.id) console.log(st.brand('ID:'), session.id);
  console.log(st.brand('Models:'), session.models.join(', '));
  console.log(st.brand('Context files:'), files.length);
  if (files.length > 0) {
    files.forEach((f) => console.log(st.dim(`  - ${f.name} (${f.size} bytes)`)));
    console.log(st.brand('Total context size:'), `${totalSize} bytes`);
  }
  console.log(st.brand('Debates in session:'), session.debates.length);
  if (session.lastGoldenPrompt) {
    const preview =
      session.lastGoldenPrompt.length > 50
        ? session.lastGoldenPrompt.substring(0, 50) + '...'
        : session.lastGoldenPrompt;
    console.log(st.brand('Last synthesis:'), preview);
  }
  console.log('');
  return 'continue';
}

function slashModels(args: string[], session: ChatSession): SlashResult {
  if (args.length > 0) {
    session.models = args;
    console.log(st.success('Models set:'), session.models.join(', '));
  } else {
    console.log(st.brand('Current models:'), session.models.join(', '));
  }
  return 'continue';
}

function slashSave(
  args: string[],
  session: ChatSession,
  sessionManager: SessionManager,
): SlashResult {
  const filepath = args[0];
  if (filepath) {
    if (session.lastGoldenPrompt) {
      try {
        fs.writeFileSync(filepath, session.lastGoldenPrompt, 'utf-8');
        console.log(st.success(`Saved synthesis to ${filepath}`));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(st.error('Failed to save synthesis file:'), msg);
        console.error(st.dim(`Path: ${filepath}`));
      }
    } else {
      console.log(st.warning('No synthesis to save. Run a debate first.'));
    }
  } else {
    const sessionId = sessionManager.saveSession(session);
    log('INFO', 'session_saved', { sessionId });
    console.log(
      st.success('Session saved. Resume with:'),
      st.brand(`consilium sessions resume ${sessionId}`)
    );
  }
  return 'continue';
}

function slashApi(args: string[]): SlashResult {
  const sub = args[0]?.toLowerCase();
  const config = loadConfig();
  const webUrl = config.webUrl || process.env.CONSILIUM_WEB_URL || 'http://localhost:3000';
  const settingsCliUrl = `${webUrl}/settings#cli`;

  if (sub === 'set') {
    const key = args.slice(1).join(' ').trim() || (args[1] ?? '');
    if (!key) {
      console.log(st.warning('Usage: /api set <your-api-key>'));
      console.log(st.dim('Get a key from the web app: Settings > CLI > Generate CLI token'));
      console.log(st.dim('Or run: /api open'));
      return 'continue';
    }
    updateConfig('apiKey', key);
    console.log(st.success('API key saved. You can run debates now.'));
    return 'continue';
  }

  if (sub === 'open') {
    console.log(st.brand('Opening web app to sign in and get CLI token...'));
    openBrowser(settingsCliUrl);
    console.log(st.success('Opened:'), settingsCliUrl);
    return 'continue';
  }

  const apiKey = config.apiKey?.trim();
  console.log(st.bold('\nAPI Configuration\n'));
  console.log(st.brand('API URL:'), config.apiUrl || 'http://localhost:4000');
  if (apiKey) {
    const masked = apiKey.length > 12 ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '***';
    console.log(st.brand('API key:'), st.success('set'), st.dim(`(${masked})`));
  } else {
    console.log(st.brand('API key:'), st.warning('not set'));
    console.log(st.dim('  Set key: /api set <key>'));
    console.log(st.dim('  Get key: /api open (opens web app)'));
  }
  console.log('');
  return 'continue';
}

function slashMode(args: string[], session: ChatSession): SlashResult {
  const result = handleModeCommand(args, session.mode);
  if (result.changed) {
    session.mode = result.mode as ChatSession['mode'];
  }
  return 'continue';
}

function slashOutput(args: string[], session: ChatSession): SlashResult {
  const result = handleOutputCommand(args, session.outputFormat);
  if (result.changed) {
    session.outputFormat = result.format as ChatSession['outputFormat'];
  }
  return 'continue';
}

export async function dispatchSlashCommand(
  cmd: string,
  args: string[],
  session: ChatSession,
  sessionManager: SessionManager,
  _rl: ReadlineInterface,
  delegates: SlashDelegates,
): Promise<SlashResult> {
  switch (cmd) {
    case '/exit':
      return slashExit(sessionManager, session);
    case '/help':
      delegates.printHelp();
      return 'continue';
    case '/file':
      return slashFile(args, session);
    case '/image':
      return slashImage(args, session);
    case '/clear':
      return slashClear(session);
    case '/status':
      return slashStatus(session);
    case '/models':
      return slashModels(args, session);
    case '/save':
      return slashSave(args, session, sessionManager);
    case '/api':
      return slashApi(args);
    case '/search': {
      const query = args.join(' ').trim();
      delegates.handleSearchCommand(query, sessionManager);
      return 'continue';
    }
    case '/rename':
      delegates.handleRenameCommand(args, session, sessionManager);
      return 'continue';
    case '/delete':
      return 'delete-pending';
    case '/history':
      delegates.printConversationHistory(session);
      return 'continue';
    case '/sessions':
      delegates.handleSessionsListCommand(sessionManager);
      return 'continue';
    case '/conversations':
      handleConversationsCommand(sessionManager);
      return 'continue';
    case '/context':
      handleContextCommand(session);
      return 'continue';
    case '/mode':
      return slashMode(args, session);
    case '/estimate':
      handleEstimateCommand(session.mode, session.models.length);
      return 'continue';
    case '/output':
      return slashOutput(args, session);
    case '/workspace':
      await handleWorkspaceCommand(process.cwd());
      return 'continue';
    default:
      console.log(st.warning(`Unknown command: ${cmd}. Use /help for commands.`));
      return 'continue';
  }
}
