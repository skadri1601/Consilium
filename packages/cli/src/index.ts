#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { debateCommand } from "./commands/debate.js";
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
import { debugCommand } from "./commands/debug.js";
import { logsCommand } from "./commands/logs.js";
import { statsCommand } from "./commands/stats.js";
import { SessionManager } from "./utils/session-manager.js";
import { style } from "./utils/visual-system.js";

const st = style();
const KNOWN_SUBCOMMANDS = [
  "debate",
  "ask",
  "chat",
  "config",
  "sessions",
  "login",
  "debug",
  "logs",
  "stats",
  "redteam",
  "eval",
  "benchmark",
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
  if (isDefaultRepl) {
    await chatCommand();
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
    .version("0.1.0");

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
      "Output format: markdown, cursorrules, claude-md, json (default: pretty-print)",
    )
    .action(debateCommand);

  program
    .command("ask")
    .description("Ask a question (alias for debate)")
    .argument("<topic>", "Question or topic")
    .option("-m, --models <models...>", "Models to use")
    .option("--mode <mode>", "Debate mode: quick, council, deep, blind, redteam, jury, market, auto")
    .option(
      "--output <format>",
      "Output format: markdown, cursorrules, claude-md, json",
    )
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
    .action(loginCommand);

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
