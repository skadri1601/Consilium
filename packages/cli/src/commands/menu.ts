import readline from "node:readline";
import { DEFAULT_WEB_ORIGIN, loadConfig } from "../utils/config.js";
import { openBrowser } from "../utils/open-browser.js";
import { style } from "../utils/visual-system.js";
import { terminal } from "../utils/terminal-capabilities.js";

const st = style();

const MENU_ITEMS = [
  "Start a Debate",
  "Red Team Assessment",
  "Blind Evaluation",
  "Configure API Keys",
  "View Stats",
  "Interactive Chat",
  "Quick Mode",
  "Logout",
] as const;

function renderMenu(selectedIndex: number, userName?: string): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(`  ${st.bold(`Welcome back, ${userName || "user"}!`)}`);
  lines.push("");
  lines.push(`  ${st.dim("What would you like to do?")}`);
  lines.push("");
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const label = MENU_ITEMS[i]!;
    if (i === selectedIndex) {
      lines.push(`  ${st.brand("❯")} ${st.brand(label)}`);
    } else {
      lines.push(`    ${st.dim(label)}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function promptInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function executeAction(index: number): Promise<boolean> {
  const config = loadConfig();
  const webUrl = config.webUrl || DEFAULT_WEB_ORIGIN;

  switch (index) {
    case 0: {
      const topic = await promptInput(st.brand("Enter topic: "));
      if (topic) {
        const { debateCommand } = await import("./debate.js");
        await debateCommand(topic, {});
      }
      return true;
    }
    case 1: {
      const content = await promptInput(st.brand("Enter content to assess: "));
      if (content) {
        const { redteamCommand } = await import("./redteam.js");
        await redteamCommand(content, {});
      }
      return true;
    }
    case 2: {
      const topic = await promptInput(st.brand("Enter topic: "));
      if (topic) {
        const { evalCommand } = await import("./eval.js");
        await evalCommand(topic, {});
      }
      return true;
    }
    case 3: {
      openBrowser(webUrl + "/settings#api-keys");
      console.log(st.success("Opened settings in browser"));
      return true;
    }
    case 4: {
      const { statsCommand } = await import("./stats.js");
      await statsCommand();
      return true;
    }
    case 5: {
      const { chatCommand } = await import("./chat.js");
      await chatCommand();
      return false;
    }
    case 6: {
      const topic = await promptInput(st.brand("Enter topic: "));
      if (topic) {
        const { debateCommand } = await import("./debate.js");
        await debateCommand(topic, { mode: "quick" });
      }
      return true;
    }
    case 7: {
      const { logoutCommand } = await import("./logout.js");
      logoutCommand();
      return false;
    }
    default:
      return true;
  }
}

export async function showMenu(): Promise<void> {
  const config = loadConfig();

  if (!terminal.isTTY) {
    console.log(`\n  Welcome back, ${config.userName || "user"}!\n`);
    console.log("  What would you like to do?\n");
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      console.log(`  ${i + 1}. ${MENU_ITEMS[i]}`);
    }
    console.log("");
    return;
  }

  let selectedIndex = 0;
  let running = true;

  while (running) {
    await new Promise<void>((resolve) => {
      const output = renderMenu(selectedIndex, config.userName);
      process.stdout.write(output);

      const lineCount = output.split("\n").length;

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onData = async (key: string) => {
        if (key === "\u0003" || key === "q") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          process.stdout.write(`\x1b[${lineCount}A`);
          process.stdout.write("\x1b[0J");
          running = false;
          resolve();
          return;
        }

        if (key === "\x1b[A") {
          selectedIndex =
            (selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
        } else if (key === "\x1b[B") {
          selectedIndex = (selectedIndex + 1) % MENU_ITEMS.length;
        } else if (key === "\r" || key === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);

          process.stdout.write(`\x1b[${lineCount}A`);
          process.stdout.write("\x1b[0J");

          console.log(st.brand(`\n  → ${MENU_ITEMS[selectedIndex]!}\n`));

          try {
            const shouldContinue = await executeAction(selectedIndex);
            running = shouldContinue;
          } catch (err: any) {
            console.error(st.error(`Error: ${err.message}`));
          }

          resolve();
          return;
        } else {
          return;
        }

        process.stdout.write(`\x1b[${lineCount}A`);
        process.stdout.write("\x1b[0J");
        process.stdout.write(renderMenu(selectedIndex, config.userName));
      };

      process.stdin.on("data", onData);
    });
  }
}
