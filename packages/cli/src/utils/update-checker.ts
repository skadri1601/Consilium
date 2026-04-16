import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { loadConfig, saveConfig } from './config.js';

const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

function resolvePackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(here, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [lMaj = 0, lMin = 0, lPat = 0] = parse(latest);
  const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch('https://registry.npmjs.org/@consilium/cli/latest', {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { version: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

export async function checkAndNotifyUpdate(): Promise<void> {
  try {
    const config = loadConfig() as Record<string, unknown>;
    const lastCheck = (config['lastUpdateCheck'] as number | undefined) ?? 0;
    if (Date.now() - lastCheck < UPDATE_CHECK_INTERVAL_MS) return;

    (config as Record<string, unknown>)['lastUpdateCheck'] = Date.now();
    saveConfig(config as Parameters<typeof saveConfig>[0]);

    const current = resolvePackageVersion();
    const latest = await fetchLatestVersion();
    if (!latest || !isNewer(latest, current)) return;

    const hasColor = Boolean(process.stdout.isTTY);
    if (hasColor) {
      console.log();
      console.log(chalk.yellow('  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510'));
      console.log(chalk.yellow('  \u2502') + chalk.white(`  Update available: ${current} \u2192 `) + chalk.green(latest) + chalk.yellow('  \u2502'));
      console.log(chalk.yellow('  \u2502') + chalk.white('  Run: ') + chalk.cyan('npm i -g @consilium/cli') + chalk.white('            ') + chalk.yellow('\u2502'));
      console.log(chalk.yellow('  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518'));
      console.log();
    } else {
      console.log(`\nUpdate available: ${current} -> ${latest}. Run: npm i -g @consilium/cli\n`);
    }
  } catch {
  }
}
