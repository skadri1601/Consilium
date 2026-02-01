import chalk from 'chalk';
import { loadConfig } from '../utils/config';
import { openBrowser } from '../utils/open-browser';

/**
 * Opens the web app so the user can sign in and generate a CLI token.
 * After signing in, they go to Settings → CLI, generate a token, then run:
 *   consilium config set apiKey "consilium_..."
 */
export function loginCommand(): void {
  const config = loadConfig();
  const webUrl = config.webUrl || process.env.CONSILIUM_WEB_URL || 'http://localhost:3000';
  const settingsCliUrl = `${webUrl}/settings#cli`;

  console.log(chalk.bold.blue('\n Consilium – Sign in\n'));
  console.log(chalk.gray('Opening the Consilium web app so you can sign in and get a CLI token.\n'));
  console.log(chalk.cyan('1. Sign in (or sign up) on the web app'));
  console.log(chalk.cyan('2. Go to Settings → CLI'));
  console.log(chalk.cyan('3. Click "Generate CLI token" and copy it'));
  console.log(chalk.cyan('4. Run:'), chalk.white('consilium config set apiKey "consilium_..."'));
  console.log(chalk.gray('\nOr set your API key with /api in the CLI chat.\n'));

  openBrowser(settingsCliUrl);
  console.log(chalk.green('Opened:'), settingsCliUrl);
  console.log('');
}
