#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import os from 'os';
import { debateCommand } from './commands/debate';
import { configSetCommand, configGetCommand, configListCommand } from './commands/config';
import { chatCommand, chatResumeCommand } from './commands/chat';
import { loginCommand } from './commands/login';
import { SessionManager } from './utils/session-manager';
import { style } from './utils/visual-system';

const st = style();
const KNOWN_SUBCOMMANDS = ['debate', 'chat', 'config', 'sessions', 'login', 'help'];
const args = process.argv.slice(2);
const isFlag = (s: string) => s.startsWith('-');
const isDefaultRepl = args.length === 0;
const isOneShot =
  args.length === 1 &&
  !isFlag(args[0]) &&
  !KNOWN_SUBCOMMANDS.includes(args[0]);

if (isDefaultRepl) {
  chatCommand().catch((err) => {
    console.error(st.error((err as Error).message));
    process.exit(1);
  });
} else if (isOneShot) {
  debateCommand(args[0], {}).catch((err) => {
    console.error(st.error((err as Error).message));
    process.exit(1);
  });
} else {
  const program = new Command();

  program
    .name('consilium')
    .description('Consilium CLI - Multi-agent debate platform')
    .version('0.1.0');

  // Debate command
  program
    .command('debate')
    .description('Start a multi-agent debate on a topic')
    .argument('<topic>', 'Topic to debate')
    .option('-m, --models <models...>', 'Models to use (e.g., gpt-4o-mini claude-haiku)')
    .option('-o, --output <file>', 'Save golden prompt to file')
    .action(debateCommand);

  // Chat command
  program
    .command('chat')
    .description('Start interactive chat with multi-agent debates')
    .action(chatCommand);

  // Login command
  program
    .command('login')
    .description('Sign in and get a CLI token (opens web app)')
    .action(loginCommand);

  // Sessions command
  const sessionDir = path.join(os.homedir(), '.consilium', 'sessions');
  const sessionManager = new SessionManager(sessionDir);

  const sessions = program
    .command('sessions')
    .description('Manage saved chat sessions');

  sessions
    .command('list')
    .description('List saved sessions')
    .action(() => {
      const list = sessionManager.listSessions();
      if (list.length === 0) {
        console.log(st.dim('No saved sessions. Use "consilium chat" and /save or /exit to save.'));
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
        console.log(st.dim(`     ID: ${s.id}`));
      }
      console.log(st.dim('\n  Resume: consilium sessions resume <session-id>\n'));
    });

  sessions
    .command('resume')
    .description('Resume a saved session')
    .argument('<sessionId>', 'Session ID from "consilium sessions list"')
    .action(chatResumeCommand);

  sessions
    .command('rename')
    .description('Rename a saved session')
    .argument('<sessionId>', 'Session ID')
    .argument('<name>', 'New session name')
    .action((sessionId: string, name: string) => {
      const success = sessionManager.renameSession(sessionId, name);
      if (success) {
        console.log(st.success(`Session renamed to: ${name}`));
      } else {
        console.log(st.error(`Session not found: ${sessionId}`));
      }
    });

  sessions
    .command('delete')
    .description('Delete a saved session')
    .argument('<sessionId>', 'Session ID')
    .action((sessionId: string) => {
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(st.warning(`Delete session "${sessionId}"? (y/N) `), (answer: string) => {
        rl.close();
        if (answer.trim().toLowerCase() === 'y') {
          const deleted = sessionManager.deleteSession(sessionId);
          if (deleted) {
            console.log(st.success(`Session "${sessionId}" deleted.`));
          } else {
            console.log(st.error(`Session not found: ${sessionId}`));
          }
        } else {
          console.log(st.dim('Cancelled.'));
        }
      });
    });

  // Config command
  const config = program
    .command('config')
    .description('Manage configuration');

  config
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Configuration key (e.g., apiKey, apiUrl)')
    .argument('<value>', 'Configuration value')
    .action(configSetCommand);

  config
    .command('get')
    .description('Get a configuration value')
    .argument('<key>', 'Configuration key')
    .action(configGetCommand);

  config
    .command('list')
    .description('List all configuration')
    .action(configListCommand);

  program.parse();
}
