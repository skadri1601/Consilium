import chalk from 'chalk';
import { loadConfig } from './config';
import { openBrowser } from './open-browser';

/**
 * If the user has no apiKey, show login instructions, open the web app, and exit.
 * Returns normally if apiKey is set.
 */
export function requireAuth(): void {
  const config = loadConfig();
  const apiKey = config.apiKey?.trim();
  if (apiKey) return;

  const webUrl = config.webUrl || process.env.CONSILIUM_WEB_URL || 'http://localhost:3000';
  const settingsCliUrl = `${webUrl}/settings#cli`;

  console.log(chalk.bold.yellow('\n Sign in first\n'));
  console.log(chalk.gray('Consilium CLI needs an API key. Sign in on the web app, then get a CLI token.\n'));
  console.log(chalk.cyan('1. Sign in (or sign up):'), chalk.white(webUrl));
  console.log(chalk.cyan('2. Go to Settings → CLI and generate a CLI token'));
  console.log(chalk.cyan('3. Run:'), chalk.white('consilium config set apiKey "consilium_..."'));
  console.log(chalk.gray('\nOr run'), chalk.white('consilium login'), chalk.gray('to open the sign-in page.\n'));

  openBrowser(settingsCliUrl);
  process.exit(1);
}
