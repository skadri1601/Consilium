import { ALL_COMMANDS, filterCommands, type SlashCommand } from "./commands.js";
import { style } from "../utils/visual-system.js";
import { terminal } from "../utils/terminal-capabilities.js";

const st = style();

const MAX_VISIBLE = 8;

export interface PaletteState {
  buffer: string;
  paletteIndex: number;
  prevLines: number;
}

export function createState(): PaletteState {
  return { buffer: "", paletteIndex: 0, prevLines: 0 };
}

export function isPaletteOpen(buffer: string): boolean {
  if (!buffer.startsWith("/")) return false;
  return !buffer.includes(" ");
}

export function paletteQuery(buffer: string): string {
  return buffer.startsWith("/") ? buffer.slice(1) : "";
}

export function visibleMatches(buffer: string): SlashCommand[] {
  if (!isPaletteOpen(buffer)) return [];
  return filterCommands(paletteQuery(buffer));
}

function widestUsage(items: SlashCommand[]): number {
  let max = 0;
  for (const c of items) {
    const u = (c.usage ?? `/${c.name}`).length;
    if (u > max) max = u;
  }
  return max;
}

function clipLine(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + "…";
}

function renderPalette(buffer: string, paletteIndex: number): string {
  const matches = visibleMatches(buffer);
  if (matches.length === 0) {
    return `\n  ${st.dim("(no matching commands — press esc to dismiss)")}\n`;
  }
  const widest = widestUsage(ALL_COMMANDS);
  const visible = matches.slice(0, MAX_VISIBLE);
  const totalCols = Math.max(40, terminal.width);
  const lines: string[] = [""];
  for (let i = 0; i < visible.length; i++) {
    const cmd = visible[i]!;
    const usage = cmd.usage ?? `/${cmd.name}`;
    const usagePadded = usage.padEnd(widest + 2);
    const isSel = i === paletteIndex;
    const arrow = isSel ? st.brand("❯ ") : "  ";
    const summaryRoom = Math.max(10, totalCols - widest - 8);
    const summary = clipLine(cmd.summary, summaryRoom);
    if (isSel) {
      lines.push(`  ${arrow}${st.brand(usagePadded)}${summary}`);
    } else {
      lines.push(`  ${arrow}${st.dim(usagePadded)}${st.dim(summary)}`);
    }
  }
  if (matches.length > visible.length) {
    lines.push(`     ${st.dim(`+${matches.length - visible.length} more — keep typing to filter`)}`);
  }
  lines.push(`     ${st.dim("↑↓ navigate · enter selects · esc dismiss · tab completes")}`);
  return lines.join("\n") + "\n";
}

export function renderPrompt(buffer: string): string {
  return `${st.brand("consilium")} ${st.dim("›")} ${buffer}`;
}

export function renderFrame(state: PaletteState): { frame: string; lines: number } {
  const palette = isPaletteOpen(state.buffer)
    ? renderPalette(state.buffer, state.paletteIndex)
    : "";
  const frame = palette + renderPrompt(state.buffer);
  const lines = (frame.match(/\n/g)?.length ?? 0);
  return { frame, lines };
}

export function clampPaletteIndex(state: PaletteState): void {
  const matches = visibleMatches(state.buffer);
  if (matches.length === 0) {
    state.paletteIndex = 0;
    return;
  }
  if (state.paletteIndex >= matches.length) {
    state.paletteIndex = matches.length - 1;
  }
  if (state.paletteIndex < 0) state.paletteIndex = 0;
}
