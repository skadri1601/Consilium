#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };
import readline from "node:readline";
import { debateCommand } from "./commands/debate.js";
import { runDebateFromStdin } from "./commands/stdin-debate.js";
import { redteamCommand } from "./commands/redteam.js";
import { evalCommand } from "./commands/eval.js";
import { benchmarkCommand } from "./commands/benchmark.js";
import {
  configSetCommand,
  configGetCommand,
  configListCommand,
} from "./commands/config.js";
import { chatCommand, chatResumeCommand } from "./commands/chat.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { debugCommand } from "./commands/debug.js";
import { logsCommand } from "./commands/logs.js";
import { statsCommand } from "./commands/stats.js";
import { mcpCommand } from "./commands/mcp.js";
import { SessionManager } from "./utils/session-manager.js";
import { style } from "./utils/visual-system.js";
import { checkAndNotifyUpdate } from "./utils/update-checker.js";

const st = style();
const KNOWN_SUBCOMMANDS = [
  "debate",
  "ask",
  "chat",
  "config",
  "sessions",
  "history",
  "login",
  "logout",
  "debug",
  "logs",
  "stats",
  "redteam",
  "eval",
  "benchmark",
  "mcp",
  "help",
];
const args = process.argv.slice(2);
const isFlag = (s: string) => s.startsWith("-");
const isDefaultRepl = args.length === 0;
const firstArg = args[0];
const isOneShot =
  args.length === 1 &&
  firstArg !== undefined &&
  !isFlag(firstArg) &&
  !KNOWN_SUBCOMMANDS.includes(firstArg);

async function main(): Promise<void> {
  const isStdinPipe = !process.stdin.isTTY;

  if (isStdinPipe && (isDefaultRepl || (firstArg !== undefined && firstArg === 'debate') || (firstArg !== undefined && firstArg === 'ask'))) {
    const rawArgs = process.argv.slice(2);
    const mode = (() => {
      const idx = rawArgs.indexOf('--mode');
      return idx !== -1 ? rawArgs[idx + 1] : undefined;
    })();
    const outputFlag = (() => {
      const idx = rawArgs.indexOf('--output');
      return idx !== -1 ? rawArgs[idx + 1] : undefined;
    })();
    const modelsIdx = rawArgs.indexOf('--models');
    const models = modelsIdx !== -1 ? rawArgs.slice(modelsIdx + 1).filter(a => !a.startsWith('-')) : undefined;
    await runDebateFromStdin({ mode, output: outputFlag, models });
    return;
  }

  if (isDefaultRepl) {
    const { isLoggedIn } = await import("./utils/config.js");
    if (isLoggedIn()) {
      checkAndNotifyUpdate().catch(() => {});
      const { showMenu } = await import("./commands/menu.js");
      await showMenu();
    } else {
      const { loginFlow } = await import("./commands/login.js");
      const ok = await loginFlow();
      if (ok) {
        checkAndNotifyUpdate().catch(() => {});
        const { showMenu } = await import("./commands/menu.js");
        await showMenu();
      }
    }
    return;
  }
  if (isOneShot && firstArg !== undefined) {
    await debateCommand(firstArg, {});
    return;
  }

  const program = new Command();

  program
    .name("consilium")
    .description("Consilium CLI - Multi-agent debate platform")
    .version(pkg.version);

  program
    .command("debate")
    .description("Start a multi-agent debate on a topic")
    .argument("<topic>", "Topic to debate")
    .option(
      "-m, --models <models...>",
      "Models to use (e.g., gpt-4o-mini claude-haiku)",
    )
    .option(
      "--mode <mode>",
      "Debate mode: quick, council, deep, blind, redteam, jury, market, auto (default: auto)",
    )
    .option(
      "--output <format>",
      "Output format: markdown, cursorrules, claude-md, json, minimal (default: pretty-print)",
    )
    .option("--output-file <path>", "Write output to file instead of stdout")
    .option("--git-diff", "Include git diff in context")
    .option("--no-context", "Disable automatic codebase context loading")
    .option("--ticket <id>", "Linear ticket ID to include as context (e.g., MYC-123)")
    .option("--apply", "Apply structured edits from synthesis directly to files")
    .action(debateCommand);

  program
    .command("ask")
    .description("Ask a question (alias for debate)")
    .argument("<topic>", "Question or topic")
    .option("-m, --models <models...>", "Models to use")
    .option("--mode <mode>", "Debate mode: quick, council, deep, blind, redteam, jury, market, auto")
    .option(
      "--output <format>",
      "Output format: markdown, cursorrules, claude-md, json, minimal",
    )
    .option("--output-file <path>", "Write output to file instead of stdout")
    .option("--git-diff", "Include git diff in context")
    .option("--no-context", "Disable automatic codebase context loading")
    .option("--ticket <id>", "Linear ticket ID to include as context (e.g., MYC-123)")
    .option("--apply", "Apply structured edits from synthesis directly to files")
    .action(debateCommand);

  program
    .command("redteam")
    .description("Run adversarial red team assessment")
    .argument("<content>", "Content to assess")
    .option("-m, --models <models...>", "Models to use")
    .option("--categories <categories...>", "Assessment categories")
    .action(redteamCommand);

  program
    .command("eval")
    .description("Run blind evaluation of responses")
    .argument("<topic>", "Topic or question")
    .option("--responses <file>", "JSON file with responses to evaluate")
    .option("-m, --models <models...>", "Models to use as evaluators")
    .action(evalCommand);

  program
    .command("benchmark")
    .description("Run deliberation benchmarks (MMLU, TruthfulQA, HumanEval)")
    .requiredOption("--benchmark <name>", "Benchmark: mmlu, truthfulqa, humaneval")
    .option("-m, --models <models...>", "Models to use")
    .option("--mode <mode>", "Deliberation mode (default: council)")
    .option("-n, --n <count>", "Number of questions")
    .option("--output <path>", "Save results to JSON file")
    .option("--local", "Run benchmark locally via Python")
    .action(benchmarkCommand);

  program
    .command("chat")
    .description("Start interactive chat with multi-agent debates")
    .action(chatCommand);

  program
    .command("login")
    .description("Sign in and get a CLI token (opens web app)")
    .option("--force", "Re-authenticate even if already logged in")
    .action((options: { force?: boolean }) => loginCommand(options));

  program
    .command("logout")
    .description("Sign out and clear stored credentials")
    .action(logoutCommand);

  program
    .command("debug")
    .description("Show full debug trace for a debate")
    .argument("<debateId>", "Debate ID (e.g., dbt_01HY3K...)")
    .action(debugCommand);

  program
    .command("logs")
    .description("Query logs for a debate")
    .argument("<debateId>", "Debate ID")
    .option("-l, --level <level>", "Filter by level: DEBUG, INFO, WARN, ERROR")
    .action(logsCommand);

  program
    .command("stats")
    .description("Show model performance dashboard")
    .action(statsCommand);

  program
    .command("mcp")
    .description("Print MCP (Model Context Protocol) setup for Cursor and Python stdio")
    .option("--json", "Emit only JSON suitable for merging into MCP config")
    .action((opts: { json?: boolean }) => mcpCommand(opts));

  const historySessionManager = new SessionManager(path.join(os.homedir(), ".consilium", "sessions"));

  program
    .command("history [id]")
    .description("Show session history or a specific session by ID")
    .option("--all", "List all sessions (default: last 10)")
    .action((id: string | undefined, opts: { all?: boolean }) => {
      if (id) {
        try {
          const session = historySessionManager.loadSession(id);
          const data = session.toJSON();
          console.log(st.bold(`\nSession: ${data.name || data.id}\n`));
          if (data.createdAt) console.log(st.dim(`Created: ${new Date(data.createdAt).toLocaleString()}`));
          if (data.updatedAt) console.log(st.dim(`Updated: ${new Date(data.updatedAt).toLocaleString()}`));
          console.log(st.brand(`Models: ${(data.models || []).join(', ')}`));
          console.log(st.brand(`Mode: ${data.mode || 'auto'}`));
          console.log(st.brand(`Debates: ${(data.debates || []).length}`));
          console.log('');
          for (const debate of data.debates || []) {
            const ts = debate.timestamp ? new Date(debate.timestamp).toLocaleString() : '';
            console.log(st.bold(`  ${debate.topic}`));
            if (ts) console.log(st.dim(`  ${ts}`));
            if (debate.goldenPrompt) {
              const preview = debate.goldenPrompt.length > 200
                ? debate.goldenPrompt.substring(0, 200) + '...'
                : debate.goldenPrompt;
              console.log('');
              console.log(preview);
            }
            console.log('');
          }
        } catch {
          console.log(st.error(`Session not found: ${id}`));
          process.exit(1);
        }
        return;
      }

      const list = historySessionManager.listSessions();
      const limit = opts.all ? list.length : Math.min(10, list.length);
      const shown = list.slice(0, limit);

      if (shown.length === 0) {
        console.log(st.dim('No sessions found. Start a debate with "consilium chat".'));
        return;
      }

      console.log(st.bold(`\nSession history (${shown.length}${opts.all ? '' : ` of ${list.length}`})\n`));
      for (let i = 0; i < shown.length; i++) {
        const s = shown[i]!;
        const timeAgo = historySessionManager.formatRelativeTime(s.updatedAt);
        const label = s.name || s.topic || 'Untitled';
        const preview = label.length > 60 ? label.substring(0, 60) + '...' : label;
        const modelStr = s.modelCount > 0 ? `${s.modelCount} model${s.modelCount !== 1 ? 's' : ''}` : '';
        const debateStr = `${s.debateCount} debate${s.debateCount !== 1 ? 's' : ''}`;
        console.log(
          st.brand(`  ${String(i + 1).padStart(2)}.`),
          preview,
        );
        const meta = [timeAgo, debateStr, modelStr].filter(Boolean).join(' · ');
        console.log(st.dim(`       ${meta}`));
        console.log(st.dim(`       ID: ${s.id}`));
      }

      if (!opts.all && list.length > 10) {
        console.log(st.dim(`\n  Showing 10 of ${list.length}. Use --all to see all.\n`));
      } else {
        console.log('');
      }
    });

  const sessionDir = path.join(os.homedir(), ".consilium", "sessions");
  const sessionManager = new SessionManager(sessionDir);

  const sessions = program
    .command("sessions")
    .description("Manage saved chat sessions");

  sessions
    .command("list")
    .description("List saved sessions")
    .action(() => {
      const list = sessionManager.listSessions();
      if (list.length === 0) {
        console.log(
          st.dim(
            'No saved sessions. Use "consilium chat" and /save or /exit to save.',
          ),
        );
        return;
      }
      console.log(st.bold("\nSaved sessions:\n"));
      for (let i = 0; i < list.length; i++) {
        const s = list[i]!;
        const timeAgo = sessionManager.formatRelativeTime(s.updatedAt);
        const label = s.name || s.topic || "Untitled";
        const displayLabel =
          label.length > 50 ? label.substring(0, 50) + "..." : label;
        const debateSuffix = s.debateCount === 1 ? "" : "s";
        console.log(
          st.brand(`  ${i + 1}.`),
          displayLabel,
          st.dim(
            `(${s.debateCount} debate${debateSuffix}, ${timeAgo})`,
          ),
        );
        console.log(st.dim(`     ID: ${s.id}`));
      }
      console.log(
        st.dim("\n  Resume: consilium sessions resume <session-id>\n"),
      );
    });

  sessions
    .command("resume")
    .description("Resume a saved session")
    .argument("<sessionId>", 'Session ID from "consilium sessions list"')
    .action(chatResumeCommand);

  sessions
    .command("rename")
    .description("Rename a saved session")
    .argument("<sessionId>", "Session ID")
    .argument("<name>", "New session name")
    .action((sessionId: string, name: string) => {
      const success = sessionManager.renameSession(sessionId, name);
      if (success) {
        console.log(st.success(`Session renamed to: ${name}`));
      } else {
        console.log(st.error(`Session not found: ${sessionId}`));
      }
    });

  sessions
    .command("delete")
    .description("Delete a saved session")
    .argument("<sessionId>", "Session ID")
    .action(async (sessionId: string) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(
        st.warning(`Delete session "${sessionId}"? (y/N) `),
        (answer: string) => {
          rl.close();
          if (answer.trim().toLowerCase() === "y") {
            const deleted = sessionManager.deleteSession(sessionId);
            if (deleted) {
              console.log(st.success(`Session "${sessionId}" deleted.`));
            } else {
              console.log(st.error(`Session not found: ${sessionId}`));
            }
          } else {
            console.log(st.dim("Cancelled."));
          }
        },
      );
    });

  const config = program.command("config").description("Manage configuration");

  config
    .command("set")
    .description("Set a configuration value")
    .argument("<key>", "Configuration key (e.g., apiKey, apiUrl)")
    .argument("<value>", "Configuration value")
    .action(configSetCommand);

  config
    .command("get")
    .description("Get a configuration value")
    .argument("<key>", "Configuration key")
    .action(configGetCommand);

  config
    .command("list")
    .description("List all configuration")
    .action(configListCommand);

  program.parse();
}

try {
  await main();
} catch (err) {
  console.error(st.error((err as Error).message));
  process.exit(1);
}
