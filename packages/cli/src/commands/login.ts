import { loadConfig } from '../utils/config';
import { openBrowser } from '../utils/open-browser';
import { style } from '../utils/visual-system';
import { typography } from '../utils/typography';

const st = style();

/**
 * Opens the web app so the user can sign in and generate a CLI token.
 * After signing in, they go to Settings → CLI, generate a token, then run:
 *   consilium config set apiKey "consilium_..."
 */
export function loginCommand(): void {
  const config = loadConfig();
  const webUrl = config.webUrl || process.env.CONSILIUM_WEB_URL || 'http://localhost:3000';
  const settingsCliUrl = `${webUrl}/settings#cli`;

  console.log(typography.h1('\n Consilium – Sign in\n'));
  console.log(st.dim('Opening the Consilium web app so you can sign in and get a CLI token.\n'));
  console.log(st.brand('1. Sign in (or sign up) on the web app'));
  console.log(st.brand('2. Go to Settings → CLI'));
  console.log(st.brand('3. Click "Generate CLI token" and copy it'));
  console.log(st.brand('4. Run:'), st.bold('consilium config set apiKey "consilium_..."'));
  console.log(st.dim('\nOr set your API key with /api in the CLI chat.\n'));

  openBrowser(settingsCliUrl);
  console.log(st.success('Opened:'), settingsCliUrl);
  console.log('');
}
