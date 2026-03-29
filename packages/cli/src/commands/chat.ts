import readline from 'readline';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { ConsiliumClient } from '../api/client';
import { ContextManager } from '../utils/context-manager';
import { ChatSession } from './chat-session';
import { SessionManager } from '../utils/session-manager';
import { requireAuth } from '../utils/require-auth';
import { loadConfig, updateConfig } from '../utils/config';
import { openBrowser } from '../utils/open-browser';
import { border, borderBottom, contentLine, style } from '../utils/visual-system';
import { formatPrompt } from '../utils/prompt-renderer';
import { terminal } from '../utils/terminal-capabilities';

const DEFAULT_SESSION_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.consilium',
  'sessions'
);

const st = style();
const w = terminal.width;
const DEFAULT_PROMPT = 'consilium > ';
const INPUT_HISTORY_SIZE = 100;

function getPrompt(session: ChatSession): string {
  return formatPrompt({ fileCount: session.contextFilePaths.length }) + ' ';
}

function printWelcome(): void {
  console.log(st.dim('\n' + border('Consilium', w)));
  console.log(contentLine('  Multi-Agent Debate Platform', w));
  console.log(contentLine('', w));
  console.log(contentLine('  Type your question to start a debate', w));
  console.log(contentLine('  Use / for commands  •  ↑↓ for history  •  Ctrl+C to exit', w));
  console.log(contentLine('', w));
  console.log(st.dim(borderBottom(w)) + '\n');
}

function printHelp(): void {
  console.log(st.bold('\nCommands:\n'));
  console.log(st.dim('  /ask <topic>   - Run one debate (same as typing the topic)'));
  console.log(st.dim('  /file <path>   - Add file to context (max 100KB per file, 500KB total)'));
  console.log(st.dim('  /image <path>  - Add image to context (for future use)'));
  console.log(st.dim('  /api           - Show API key status; /api set <key> or /api open to get key'));
  console.log(st.dim('  /clear         - Clear context'));
  console.log(st.dim('  /status        - Show session status'));
  console.log(st.dim('  /models [m1 m2 ...] - Set models; no args to show current'));
  console.log(st.dim('  /save [file]   - Save synthesis to file, or session to ~/.consilium/sessions'));
  console.log(st.dim('  /search <query> - Search across all conversations'));
  console.log(st.dim('  /rename <name> - Rename current session'));
  console.log(st.dim('  /delete <id>   - Delete a saved session'));
  console.log(st.dim('  /history       - Show conversation history'));
  console.log(st.dim('  /sessions      - List all saved sessions'));
  console.log(st.dim('  /help          - Show this help'));
  console.log(st.dim('  /exit          - Exit and optionally save session'));
  console.log(st.dim('\n  ↑/↓ - Input history\n'));
}

function printConversationHistory(session: ChatSession): void {
  if (session.debates.length === 0) {
    console.log(st.dim('\nNo debates in this session yet.\n'));
    return;
  }

  console.log(st.bold('\nConversation History:\n'));
  for (let i = 0; i < session.debates.length; i++) {
    const d = session.debates[i];
    const topicPreview = d.topic.length > 70
      ? d.topic.substring(0, 70) + '...'
      : d.topic;
    const time = d.timestamp
      ? st.dim(` (${new Date(d.timestamp).toLocaleString()})`)
      : '';
    console.log(st.brand(`  ${i + 1}.`), topicPreview + time);

    if (d.goldenPrompt) {
      const synthPreview = d.goldenPrompt.length > 100
        ? d.goldenPrompt.substring(0, 100) + '...'
        : d.goldenPrompt;
      console.log(st.dim(`     Synthesis: ${synthPreview}`));
    }
  }
  console.log('');
}

function handleSearchCommand(query: string, sessionManager: SessionManager): void {
  if (!query) {
    console.log(st.warning('Usage: /search <query>'));
    return;
  }

  const results = sessionManager.searchSessions(query);
  if (results.length === 0) {
    console.log(st.dim(`\nNo results for "${query}".\n`));
    return;
  }

  console.log(st.bold(`\nSearch results for "${query}":\n`));
  for (const r of results) {
    const typeLabel = r.matchType === 'topic' ? 'Topic' : 'Synthesis';
    console.log(st.brand(`  [${r.sessionId}]`), r.sessionName);
    console.log(st.dim(`    ${typeLabel}: ${r.matchSnippet}`));
  }
  console.log('');
}

function handleSessionsListCommand(sessionManager: SessionManager): void {
  const list = sessionManager.listSessions();
  if (list.length === 0) {
    console.log(st.dim('\nNo saved sessions.\n'));
    return;
  }

  console.log(st.bold('\nSaved sessions:\n'));
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const timeAgo = sessionManager.formatRelativeTime(s.updatedAt);
    const label = s.name || s.topic || 'Untitled';
    const displayLabel = label.length > 50 ? label.substring(0, 50) + '...' : label;
    console.log(
      st.brand(`  ${i + 1}.`),
      displayLabel,
      st.dim(`(${s.debateCount} debate${s.debateCount !== 1 ? 's' : ''}, ${timeAgo})`)
    );
    if (s.preview && s.preview !== '(no synthesis)') {
      console.log(st.dim(`     ${s.preview}`));
    }
  }
  console.log(st.dim('\n  Resume with: consilium sessions resume <session-id>\n'));
}

function handleRenameCommand(
  args: string[],
  session: ChatSession,
  sessionManager: SessionManager
): void {
  const newName = args.join(' ').trim();
  if (!newName) {
    console.log(st.warning('Usage: /rename <new name>'));
    return;
  }

  session.name = newName;

  if (session.id) {
    sessionManager.renameSession(session.id, newName);
    console.log(st.success(`Session renamed to: ${newName}`));
  } else {
    console.log(st.success(`Session will be saved as: ${newName}`));
  }
}

function handleDeleteCommand(
  args: string[],
  sessionManager: SessionManager,
  rl: readline.Interface,
  callback: () => void
): void {
  const targetId = args[0];
  if (!targetId) {
    console.log(st.warning('Usage: /delete <session-id>'));
    callback();
    return;
  }

  rl.question(st.warning(`Delete session "${targetId}"? (y/N) `), (answer) => {
    const confirmed = answer.trim().toLowerCase() === 'y';
    if (!confirmed) {
      console.log(st.dim('Cancelled.'));
      callback();
      return;
    }

    const deleted = sessionManager.deleteSession(targetId);
    if (deleted) {
      console.log(st.success(`Session "${targetId}" deleted.`));
    } else {
      console.log(st.error(`Session not found: ${targetId}`));
    }
    callback();
  });
}

async function handleSlashCommand(
  input: string,
  session: ChatSession,
  sessionManager: SessionManager,
  rl: readline.Interface
): Promise<'exit' | 'continue' | 'delete-pending'> {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case '/exit': {
      const sessionId = sessionManager.saveSession(session);
      console.log(
        st.success('\nSession saved. Resume with:'),
        st.brand(`consilium sessions resume ${sessionId}\n`)
      );
      return 'exit';
    }

    case '/help': {
      printHelp();
      return 'continue';
    }

    case '/file': {
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
        console.log(
          st.success(`Added ${path.basename(filePath)} to context (${sizeKb} KB)`)
        );
      } catch (error: any) {
        console.error(st.error('Error:'), error.message);
      }
      return 'continue';
    }

    case '/image': {
      const imagePath = args[0];
      if (!imagePath) {
        console.log(st.warning('Usage: /image <path>'));
        return 'continue';
      }
      try {
        session.contextManager.addImage(imagePath);
        console.log(st.success(`Added ${path.basename(imagePath)} to context (for future use)`));
      } catch (error: any) {
        console.error(st.error('Error:'), error.message);
      }
      return 'continue';
    }

    case '/clear': {
      session.contextManager.clear();
      session.contextFilePaths = [];
      console.log(st.success('Context cleared.'));
      return 'continue';
    }

    case '/status': {
      const files = session.contextManager.getFiles();
      const totalSize = session.contextManager.getTotalSize();
      console.log(st.bold('\nSession Status\n'));
      if (session.name) {
        console.log(st.brand('Name:'), session.name);
      }
      if (session.id) {
        console.log(st.brand('ID:'), session.id);
      }
      console.log(st.brand('Models:'), session.models.join(', '));
      console.log(st.brand('Context files:'), files.length);
      if (files.length > 0) {
        files.forEach((f) =>
          console.log(st.dim(`  - ${f.name} (${f.size} bytes)`))
        );
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

    case '/models': {
      if (args.length > 0) {
        session.models = args;
        console.log(st.success('Models set:'), session.models.join(', '));
      } else {
        console.log(st.brand('Current models:'), session.models.join(', '));
      }
      return 'continue';
    }

    case '/save': {
      const filepath = args[0];
      if (filepath) {
        if (session.lastGoldenPrompt) {
          fs.writeFileSync(filepath, session.lastGoldenPrompt, 'utf-8');
          console.log(st.success(`Saved synthesis to ${filepath}`));
        } else {
          console.log(st.warning('No synthesis to save. Run a debate first.'));
        }
      } else {
        const sessionId = sessionManager.saveSession(session);
        console.log(
          st.success('Session saved. Resume with:'),
          st.brand(`consilium sessions resume ${sessionId}`)
        );
      }
      return 'continue';
    }

    case '/api': {
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

    case '/search': {
      const query = args.join(' ').trim();
      handleSearchCommand(query, sessionManager);
      return 'continue';
    }

    case '/rename': {
      handleRenameCommand(args, session, sessionManager);
      return 'continue';
    }

    case '/delete': {
      return 'delete-pending';
    }

    case '/history': {
      printConversationHistory(session);
      return 'continue';
    }

    case '/sessions': {
      handleSessionsListCommand(sessionManager);
      return 'continue';
    }

    default:
      console.log(st.warning(`Unknown command: ${cmd}. Use /help for commands.`));
      return 'continue';
  }
}

function pushHistory(history: string[], line: string): void {
  if (!line || history[history.length - 1] === line) return;
  history.push(line);
  if (history.length > INPUT_HISTORY_SIZE) history.shift();
}

function runReplLoop(
  rl: readline.Interface,
  history: string[],
  session: ChatSession,
  sessionManager: SessionManager
): void {
  rl.question(getPrompt(session), (line) => {
    const trimmed = (line || '').trim();
    if (!trimmed) {
      runReplLoop(rl, history, session, sessionManager);
      return;
    }

    pushHistory(history, trimmed);

    if (trimmed.toLowerCase().startsWith('/ask')) {
      const topic = trimmed.slice(4).trim();
      if (!topic) {
        console.log(st.warning('Usage: /ask <topic>'));
        runReplLoop(rl, history, session, sessionManager);
        return;
      }
      session.debate(topic).then(
        () => runReplLoop(rl, history, session, sessionManager),
        (error: any) => {
          console.error(st.error('\nDebate failed:'), error.message);
          if (error.message.includes('503')) {
            console.log(st.warning('Suggestion: Make sure the agents service is running.'));
            console.log(
              st.dim('   cd apps/agents && poetry run uvicorn src.main:app --reload --port 8000')
            );
          }
          console.log(st.dim('Continuing... type /help or ask something else.\n'));
          runReplLoop(rl, history, session, sessionManager);
        }
      );
      return;
    }

    if (trimmed.startsWith('/')) {
      if (trimmed.toLowerCase().startsWith('/delete')) {
        const parts = trimmed.split(/\s+/);
        const deleteArgs = parts.slice(1);
        if (!deleteArgs[0]) {
          console.log(st.warning('Usage: /delete <session-id>'));
          runReplLoop(rl, history, session, sessionManager);
          return;
        }
        handleDeleteCommand(deleteArgs, sessionManager, rl, () => {
          runReplLoop(rl, history, session, sessionManager);
        });
        return;
      }

      handleSlashCommand(trimmed, session, sessionManager, rl).then((result) => {
        if (result === 'exit') {
          rl.close();
          return;
        }
        runReplLoop(rl, history, session, sessionManager);
      });
      return;
    }

    session.debate(trimmed).then(
      () => runReplLoop(rl, history, session, sessionManager),
      (error: any) => {
        console.error(st.error('\nDebate failed:'), error.message);
        if (error.message.includes('503')) {
          console.log(st.warning('Suggestion: Make sure the agents service is running:'));
          console.log(
            st.dim('   cd apps/agents && poetry run uvicorn src.main:app --reload --port 8000')
          );
        } else if (
          error.message.includes('context size') ||
          error.message.includes('Total context')
        ) {
          console.log(st.warning('Suggestion: Try /clear to remove files, or use smaller files.'));
        }
        console.log(st.dim('Continuing... type /help or ask something else.\n'));
        runReplLoop(rl, history, session, sessionManager);
      }
    );
  });
}

export async function chatCommand(): Promise<void> {
  requireAuth();

  const client = new ConsiliumClient();
  const contextManager = new ContextManager();
  const session = new ChatSession(client, contextManager);
  const sessionManager = new SessionManager(DEFAULT_SESSION_DIR);

  const spinner = ora('Checking API connection...').start();
  const isHealthy = await client.healthCheck();

  if (!isHealthy) {
    spinner.fail('API is not available');
    process.exit(1);
  }
  spinner.succeed('Connected');

  printWelcome();
  const config = loadConfig();
  const baseUrl = config.apiUrl || 'http://localhost:4000';
  try {
    const host = new URL(baseUrl).host;
    console.log(st.dim('Ready. Connected to ' + host + '\n'));
  } catch {
    console.log(st.dim('Ready. Connected.\n'));
  }

  const history: string[] = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: DEFAULT_PROMPT,
    history,
    historySize: INPUT_HISTORY_SIZE,
    removeHistoryDuplicates: true,
  });
  runReplLoop(rl, history, session, sessionManager);
}

export async function chatResumeCommand(sessionId: string): Promise<void> {
  requireAuth();

  const sessionManager = new SessionManager(DEFAULT_SESSION_DIR);

  try {
    const session = sessionManager.loadSession(sessionId);
    const displayName = session.name || sessionId;

    console.log(st.success(`\nResuming session: ${displayName}\n`));

    if (session.debates.length > 0) {
      console.log(st.bold('Conversation history:'));
      for (let i = 0; i < session.debates.length; i++) {
        const d = session.debates[i];
        const topicPreview = d.topic.length > 60
          ? d.topic.substring(0, 60) + '...'
          : d.topic;
        console.log(st.brand(`  ${i + 1}.`), topicPreview);
      }
      console.log(st.dim(`\n  ${session.debates.length} debate${session.debates.length !== 1 ? 's' : ''} loaded. Previous syntheses will be used as context.\n`));
    }

    printWelcome();

    const history: string[] = [];
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: DEFAULT_PROMPT,
      history,
      historySize: INPUT_HISTORY_SIZE,
      removeHistoryDuplicates: true,
    });
    runReplLoop(rl, history, session, sessionManager);
  } catch (error: any) {
    console.error(st.error('Failed to load session:'), error.message);
    process.exit(1);
  }
}
