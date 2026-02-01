import chalk from 'chalk';
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

const DEFAULT_SESSION_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.consilium',
  'sessions'
);

const PROMPT = '> ';

function printWelcome(): void {
  console.log(chalk.bold.blue('\n Consilium'));
  console.log(chalk.gray(' Multi-agent debate. Type a topic or /help. /exit to quit.\n'));
}

function printHelp(): void {
  console.log(chalk.bold('\nCommands:\n'));
  console.log(chalk.gray('  /ask <topic>   - Run one debate (same as typing the topic)'));
  console.log(chalk.gray('  /file <path>   - Add file to context (max 100KB per file, 500KB total)'));
  console.log(chalk.gray('  /image <path>  - Add image to context (for future use)'));
  console.log(chalk.gray('  /api           - Show API key status; /api set <key> or /api open to get key'));
  console.log(chalk.gray('  /clear         - Clear context'));
  console.log(chalk.gray('  /status        - Show session status'));
  console.log(chalk.gray('  /models [m1 m2 ...] - Set models; no args to show current'));
  console.log(chalk.gray('  /save [file]   - Save golden prompt to file, or session to ~/.consilium/sessions'));
  console.log(chalk.gray('  /help          - Show this help'));
  console.log(chalk.gray('  /exit          - Exit and optionally save session'));
  console.log(chalk.gray('\n  ↑/↓ - Input history\n'));
}

async function handleSlashCommand(
  input: string,
  session: ChatSession,
  sessionManager: SessionManager
): Promise<'exit' | 'continue'> {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case '/exit': {
      const sessionId = sessionManager.saveSession(session);
      console.log(
        chalk.green('\n👋 Session saved. Resume with:'),
        chalk.cyan(`consilium sessions resume ${sessionId}\n`)
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
        console.log(chalk.yellow('Usage: /file <path>'));
        return 'continue';
      }
      try {
        session.contextManager.addFile(filePath);
        session.contextFilePaths.push(filePath);
        const files = session.contextManager.getFiles();
        const entry = files.find((f) => f.name === path.basename(filePath));
        const sizeKb = entry ? (entry.size / 1024).toFixed(1) : '?';
        console.log(
          chalk.green(`✓ Added ${path.basename(filePath)} to context (${sizeKb} KB)`)
        );
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
      }
      return 'continue';
    }

    case '/image': {
      const imagePath = args[0];
      if (!imagePath) {
        console.log(chalk.yellow('Usage: /image <path>'));
        return 'continue';
      }
      try {
        session.contextManager.addImage(imagePath);
        console.log(chalk.green(`✓ Added ${path.basename(imagePath)} to context (for future use)`));
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
      }
      return 'continue';
    }

    case '/clear': {
      session.contextManager.clear();
      session.contextFilePaths = [];
      console.log(chalk.green('Context cleared.'));
      return 'continue';
    }

    case '/status': {
      const files = session.contextManager.getFiles();
      const totalSize = session.contextManager.getTotalSize();
      console.log(chalk.bold('\n📊 Session Status\n'));
      console.log(chalk.cyan('Models:'), session.models.join(', '));
      console.log(chalk.cyan('Context files:'), files.length);
      if (files.length > 0) {
        files.forEach((f) =>
          console.log(chalk.gray(`  - ${f.name} (${f.size} bytes)`))
        );
        console.log(chalk.cyan('Total context size:'), `${totalSize} bytes`);
      }
      console.log(chalk.cyan('Debates in session:'), session.debates.length);
      if (session.lastGoldenPrompt) {
        const preview =
          session.lastGoldenPrompt.length > 50
            ? session.lastGoldenPrompt.substring(0, 50) + '...'
            : session.lastGoldenPrompt;
        console.log(chalk.cyan('Last golden prompt:'), preview);
      }
      console.log('');
      return 'continue';
    }

    case '/models': {
      if (args.length > 0) {
        session.models = args;
        console.log(chalk.green('✓ Models set:'), session.models.join(', '));
      } else {
        console.log(chalk.cyan('Current models:'), session.models.join(', '));
      }
      return 'continue';
    }

    case '/save': {
      const filepath = args[0];
      if (filepath) {
        if (session.lastGoldenPrompt) {
          fs.writeFileSync(filepath, session.lastGoldenPrompt, 'utf-8');
          console.log(chalk.green(`✓ Saved golden prompt to ${filepath}`));
        } else {
          console.log(chalk.yellow('No golden prompt to save. Run a debate first.'));
        }
      } else {
        const sessionId = sessionManager.saveSession(session);
        console.log(
          chalk.green('✓ Session saved. Resume with:'),
          chalk.cyan(`consilium sessions resume ${sessionId}`)
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
          console.log(chalk.yellow('Usage: /api set <your-api-key>'));
          console.log(chalk.gray('Get a key from the web app: Settings → CLI → Generate CLI token'));
          console.log(chalk.gray('Or run: /api open'));
          return 'continue';
        }
        updateConfig('apiKey', key);
        console.log(chalk.green('✓ API key saved. You can run debates now.'));
        return 'continue';
      }

      if (sub === 'open') {
        console.log(chalk.cyan('Opening web app to sign in and get CLI token...'));
        openBrowser(settingsCliUrl);
        console.log(chalk.green('Opened:'), settingsCliUrl);
        return 'continue';
      }

      // /api with no subcommand: show status
      const apiKey = config.apiKey?.trim();
      console.log(chalk.bold('\n🔑 API status\n'));
      console.log(chalk.cyan('API URL:'), config.apiUrl || 'http://localhost:4000');
      if (apiKey) {
        const masked = apiKey.length > 12 ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '***';
        console.log(chalk.cyan('API key:'), chalk.green('set'), chalk.gray(`(${masked})`));
      } else {
        console.log(chalk.cyan('API key:'), chalk.yellow('not set'));
        console.log(chalk.gray('  Set key: /api set <key>'));
        console.log(chalk.gray('  Get key: /api open (opens web app)'));
      }
      console.log('');
      return 'continue';
    }

    default:
      console.log(chalk.yellow(`Unknown command: ${cmd}. Use /help for commands.`));
      return 'continue';
  }
}

const INPUT_HISTORY_SIZE = 100;

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
  rl.question(PROMPT, (line) => {
    const trimmed = (line || '').trim();
    if (!trimmed) {
      runReplLoop(rl, history, session, sessionManager);
      return;
    }

    pushHistory(history, trimmed);

    if (trimmed.toLowerCase().startsWith('/ask')) {
      const topic = trimmed.slice(4).trim();
      if (!topic) {
        console.log(chalk.yellow('Usage: /ask <topic>'));
        runReplLoop(rl, history, session, sessionManager);
        return;
      }
      session.debate(topic).then(
        () => runReplLoop(rl, history, session, sessionManager),
        (error: any) => {
          console.error(chalk.red('\n❌ Debate failed:'), error.message);
          if (error.message.includes('503')) {
            console.log(chalk.yellow('💡 Tip: Make sure the agents service is running.'));
            console.log(
              chalk.gray('   cd apps/agents && poetry run uvicorn src.main:app --reload --port 8000')
            );
          }
          console.log(chalk.gray('Continuing... type /help or ask something else.\n'));
          runReplLoop(rl, history, session, sessionManager);
        }
      );
      return;
    }

    if (trimmed.startsWith('/')) {
      handleSlashCommand(trimmed, session, sessionManager).then((result) => {
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
        console.error(chalk.red('\n❌ Debate failed:'), error.message);
        if (error.message.includes('503')) {
          console.log(chalk.yellow('💡 Tip: Make sure the agents service is running:'));
          console.log(
            chalk.gray('   cd apps/agents && poetry run uvicorn src.main:app --reload --port 8000')
          );
        } else if (
          error.message.includes('context size') ||
          error.message.includes('Total context')
        ) {
          console.log(chalk.yellow('💡 Tip: Try /clear to remove files, or use smaller files.'));
        }
        console.log(chalk.gray('Continuing... type /help or ask something else.\n'));
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

  const history: string[] = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: PROMPT,
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

    console.log(chalk.green(`\n🔄 Resuming session: ${sessionId}\n`));
    console.log(chalk.cyan('Previous context loaded.'), chalk.gray(`(${session.debates.length} debates in session)\n`));

    printWelcome();

    const history: string[] = [];
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: PROMPT,
      history,
      historySize: INPUT_HISTORY_SIZE,
      removeHistoryDuplicates: true,
    });
    runReplLoop(rl, history, session, sessionManager);
  } catch (error: any) {
    console.error(chalk.red('Failed to load session:'), error.message);
    process.exit(1);
  }
}
