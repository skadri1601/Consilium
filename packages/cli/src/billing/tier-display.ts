import chalk from 'chalk';
import { terminal } from '../utils/terminal-capabilities.js';
import type { BillingInfo } from './billing-service.js';

function c() {
  return terminal.hasColor;
}

export function formatTierBadge(tier: string): string {
  if (!c()) return tier;
  switch (tier) {
    case 'PRO':
      return chalk.hex('#3b82f6').bold(tier);
    case 'MAX':
      return chalk.hex('#a855f7').bold(tier);
    default:
      return chalk.hex('#6b7280').bold(tier);
  }
}

export function formatUsageBar(used: number, limit: number, label: string): string {
  if (limit === -1) {
    return `  ${label}: ${used} / \u221e`;
  }

  const barWidth = 20;
  const pct = limit > 0 ? Math.min(1, used / limit) : 0;
  const filled = Math.round(pct * barWidth);
  const empty = barWidth - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  const pctStr = (pct * 100).toFixed(1) + '%';

  if (!c()) {
    return `  ${label}: ${used} / ${limit}\n  [${bar}] ${pctStr}`;
  }

  const barColored =
    pct >= 0.9
      ? chalk.hex('#ef4444')(bar)
      : pct >= 0.7
        ? chalk.hex('#f59e0b')(bar)
        : chalk.hex('#10b981')(bar);

  return `  ${label}: ${used} / ${limit}\n  ${barColored} ${chalk.hex('#6b7280')(pctStr)}`;
}

export function formatWalletBalance(balanceCents: number): string {
  return `$${(balanceCents / 100).toFixed(2)}`;
}

export function formatBillingDashboard(info: BillingInfo): string {
  const { subscription, wallet, usage } = info;
  const lines: string[] = [];
  const boxW = 40;
  const h = '\u2550';
  const v = '\u2551';
  const tl = '\u2554';
  const tr = '\u2557';
  const bl = '\u255a';
  const br = '\u255d';
  const ml = '\u2560';
  const mr = '\u2563';

  const inner = boxW - 2;

  function row(text: string): string {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = Math.max(0, inner - visible.length - 1);
    return `${v} ${text}${' '.repeat(pad)}${v}`;
  }

  function divider(): string {
    return `${ml}${h.repeat(inner + 1)}${mr}`;
  }

  const tier = formatTierBadge(subscription.tier);
  const statusStr = subscription.status === 'ACTIVE' ? (c() ? chalk.hex('#10b981')('\u2713 ACTIVE') : '\u2713 ACTIVE') : subscription.status;

  let periodStr = '';
  if (subscription.currentPeriodEnd) {
    const end = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    periodStr = `${fmt(start)} \u2192 ${fmt(end)}`;
  }

  const computeUsed = usage.period.costCentsUsed / 100;
  const computeLimit = usage.limits.maxCostCentsPerMonth / 100;

  lines.push(`${tl}${h.repeat(inner + 1)}${tr}`);
  lines.push(row('Consilium Billing'));
  lines.push(divider());
  lines.push(row(`Tier: ${tier}  ${statusStr}`));
  if (periodStr) lines.push(row(`Period: ${periodStr}`));
  lines.push(divider());

  const todayDebates = usage.today.debatesCount;
  const todayLimit = usage.limits.debatesPerDay;
  if (todayLimit === -1) {
    lines.push(row(`Today's Debates: ${todayDebates} / \u221e`));
  } else {
    const todayPct = todayLimit > 0 ? Math.min(1, todayDebates / todayLimit) : 0;
    const filled = Math.round(todayPct * 20);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
    lines.push(row(`Today's Debates: ${todayDebates} / ${todayLimit}`));
    lines.push(row(`${bar} ${(todayPct * 100).toFixed(1)}%`));
  }

  lines.push(row(''));

  if (computeLimit === -1 || usage.limits.maxCostCentsPerMonth === -1) {
    lines.push(row(`Monthly Compute: $${computeUsed.toFixed(2)} / \u221e`));
  } else {
    const computePct = computeLimit > 0 ? Math.min(1, computeUsed / computeLimit) : 0;
    const computeFilled = Math.round(computePct * 20);
    const computeBar = '\u2588'.repeat(computeFilled) + '\u2591'.repeat(20 - computeFilled);
    lines.push(row(`Monthly Compute: $${computeUsed.toFixed(2)} / $${computeLimit.toFixed(2)}`));
    lines.push(row(`${computeBar} ${(computePct * 100).toFixed(1)}%`));
  }

  lines.push(divider());
  lines.push(row(`Wallet Balance: ${formatWalletBalance(wallet.balanceCents)}`));
  lines.push(`${bl}${h.repeat(inner + 1)}${br}`);

  return lines.join('\n');
}
