import { DEBATE_MODES, type DebateMode } from "@consilium/shared";

export type SlashRunResult = {
  exit?: boolean;
  cleared?: boolean;
};

export interface SlashCommand {
  name: string;
  category: "mode" | "session" | "config" | "system";
  summary: string;
  usage?: string;
  hint?: string;
  run: (rawArgs: string) => Promise<SlashRunResult | void>;
}

function modeHint(mode: DebateMode): string {
  const cfg = DEBATE_MODES[mode];
  return `${cfg.description} (${cfg.estimatedTime})`;
}

async function runDebate(topic: string, mode: DebateMode): Promise<void> {
  const trimmed = topic.trim();
  if (!trimmed) {
    const { default: chalk } = await import("chalk");
    console.log(chalk.hex("#9ca3af")(`(no topic provided — usage: /${mode} <topic>)`));
    return;
  }
  const { debateCommand } = await import("../commands/debate.js");
  await debateCommand(trimmed, { mode });
}

const MODE_ORDER: DebateMode[] = [
  "auto",
  "quick",
  "council",
  "deep",
  "blind",
  "jury",
  "market",
];

const modeCommands: SlashCommand[] = MODE_ORDER.map((mode) => ({
  name: mode,
  category: "mode",
  summary: modeHint(mode),
  usage: `/${mode} <topic>`,
  run: async (rawArgs) => {
    await runDebate(rawArgs, mode);
  },
}));

const utilityCommands: SlashCommand[] = [
  {
    name: "ask",
    category: "mode",
    summary: "Ask the council a question (alias for /auto)",
    usage: "/ask <topic>",
    run: async (rawArgs) => {
      await runDebate(rawArgs, "auto");
    },
  },
  {
    name: "chat",
    category: "session",
    summary: "Start an interactive multi-agent chat session",
    usage: "/chat",
    run: async () => {
      const { chatCommand } = await import("../commands/chat.js");
      await chatCommand();
    },
  },
  {
    name: "redteam",
    category: "mode",
    summary: "Run an adversarial red-team assessment",
    usage: "/redteam <content>",
    run: async (rawArgs) => {
      const trimmed = rawArgs.trim();
      if (!trimmed) {
        const { default: chalk } = await import("chalk");
        console.log(chalk.hex("#9ca3af")("(no content provided — usage: /redteam <content>)"));
        return;
      }
      const { redteamCommand } = await import("../commands/redteam.js");
      await redteamCommand(trimmed, {});
    },
  },
  {
    name: "eval",
    category: "mode",
    summary: "Run a blind evaluation of model responses",
    usage: "/eval <topic>",
    run: async (rawArgs) => {
      const trimmed = rawArgs.trim();
      if (!trimmed) {
        const { default: chalk } = await import("chalk");
        console.log(chalk.hex("#9ca3af")("(no topic provided — usage: /eval <topic>)"));
        return;
      }
      const { evalCommand } = await import("../commands/eval.js");
      await evalCommand(trimmed, {});
    },
  },
  {
    name: "stats",
    category: "session",
    summary: "Show model performance dashboard",
    usage: "/stats",
    run: async () => {
      const { statsCommand } = await import("../commands/stats.js");
      await statsCommand();
    },
  },
  {
    name: "debates",
    category: "session",
    summary: "List your recent debate sessions",
    usage: "/debates [search]",
    run: async (rawArgs) => {
      const { listDebatesCommand } = await import("../commands/debates.js");
      const search = rawArgs.trim();
      await listDebatesCommand(search ? { search } : {});
    },
  },
  {
    name: "debug",
    category: "session",
    summary: "Show full debug trace for a debate",
    usage: "/debug <debateId>",
    run: async (rawArgs) => {
      const id = rawArgs.trim();
      if (!id) {
        const { default: chalk } = await import("chalk");
        console.log(chalk.hex("#9ca3af")("(no debate id — usage: /debug <debateId>)"));
        return;
      }
      const { debugCommand } = await import("../commands/debug.js");
      await debugCommand(id);
    },
  },
  {
    name: "logs",
    category: "session",
    summary: "Query logs for a debate",
    usage: "/logs <debateId>",
    run: async (rawArgs) => {
      const id = rawArgs.trim();
      if (!id) {
        const { default: chalk } = await import("chalk");
        console.log(chalk.hex("#9ca3af")("(no debate id — usage: /logs <debateId>)"));
        return;
      }
      const { logsCommand } = await import("../commands/logs.js");
      await logsCommand(id, {});
    },
  },
  {
    name: "config",
    category: "config",
    summary: "Open the web settings page to manage API keys",
    usage: "/config",
    run: async () => {
      const { loadConfig, DEFAULT_WEB_ORIGIN } = await import("../utils/config.js");
      const { openBrowser } = await import("../utils/open-browser.js");
      const { style } = await import("../utils/visual-system.js");
      const cfg = loadConfig();
      const webUrl = cfg.webUrl || DEFAULT_WEB_ORIGIN;
      openBrowser(`${webUrl}/settings#api-keys`);
      console.log(style().success("Opened settings in browser"));
    },
  },
  {
    name: "mcp",
    category: "config",
    summary: "Print MCP setup snippet for Cursor / Python clients",
    usage: "/mcp",
    run: async () => {
      const { mcpCommand } = await import("../commands/mcp.js");
      await mcpCommand({});
    },
  },
  {
    name: "upgrade",
    category: "system",
    summary: "Update Consilium CLI to the latest version",
    usage: "/upgrade [--check]",
    run: async (rawArgs) => {
      const { upgradeCommand } = await import("../commands/upgrade.js");
      const checkOnly = rawArgs.trim() === "--check";
      await upgradeCommand({ check: checkOnly });
    },
  },
  {
    name: "login",
    category: "system",
    summary: "Sign in via the web (refresh CLI token)",
    usage: "/login",
    run: async () => {
      const { loginCommand } = await import("../commands/login.js");
      await loginCommand({ force: true });
    },
  },
  {
    name: "logout",
    category: "system",
    summary: "Sign out and clear stored credentials",
    usage: "/logout",
    run: async () => {
      const { logoutCommand } = await import("../commands/logout.js");
      logoutCommand();
      return { exit: true };
    },
  },
  {
    name: "clear",
    category: "system",
    summary: "Clear the screen",
    usage: "/clear",
    run: async () => ({ cleared: true }),
  },
  {
    name: "help",
    category: "system",
    summary: "Show all available slash commands",
    usage: "/help",
    run: async () => {
      const { style } = await import("../utils/visual-system.js");
      const st = style();
      console.log("");
      console.log(st.bold("  Available commands"));
      console.log("");
      const widest = ALL_COMMANDS.reduce(
        (acc, c) => Math.max(acc, (c.usage ?? `/${c.name}`).length),
        0,
      );
      const groups: Array<{ label: string; key: SlashCommand["category"] }> = [
        { label: "Deliberation", key: "mode" },
        { label: "Sessions", key: "session" },
        { label: "Config", key: "config" },
        { label: "System", key: "system" },
      ];
      for (const g of groups) {
        const items = ALL_COMMANDS.filter((c) => c.category === g.key);
        if (items.length === 0) continue;
        console.log(st.dim(`  ${g.label}`));
        for (const c of items) {
          const left = (c.usage ?? `/${c.name}`).padEnd(widest + 2);
          console.log(`    ${st.brand(left)}${st.dim(c.summary)}`);
        }
        console.log("");
      }
      console.log(st.dim("  Press /  to open the command palette · Ctrl+C or /exit to quit"));
      console.log("");
    },
  },
  {
    name: "exit",
    category: "system",
    summary: "Exit the Consilium REPL",
    usage: "/exit",
    run: async () => ({ exit: true }),
  },
  {
    name: "quit",
    category: "system",
    summary: "Exit the Consilium REPL (alias for /exit)",
    usage: "/quit",
    run: async () => ({ exit: true }),
  },
];

export const ALL_COMMANDS: SlashCommand[] = [...modeCommands, ...utilityCommands];

export function findCommand(name: string): SlashCommand | undefined {
  const lower = name.toLowerCase();
  return ALL_COMMANDS.find((c) => c.name === lower);
}

export function filterCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_COMMANDS;
  const startsWith: SlashCommand[] = [];
  const contains: SlashCommand[] = [];
  for (const c of ALL_COMMANDS) {
    if (c.name.startsWith(q)) startsWith.push(c);
    else if (c.name.includes(q) || c.summary.toLowerCase().includes(q)) contains.push(c);
  }
  return [...startsWith, ...contains];
}
