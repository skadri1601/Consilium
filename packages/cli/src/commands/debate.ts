import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import { ConsiliumClient, DebateEvent } from '../api/client';
import { createStreamHandlers } from '../utils/stream-renderer';
import { requireAuth } from '../utils/require-auth';

export interface DebateCommandOptions {
  models?: string[];
  output?: string;
}

export async function debateCommand(
  topic: string,
  options: DebateCommandOptions
): Promise<void> {
  requireAuth();

  const client = new ConsiliumClient();

  // Health check first
  const spinner = ora('Checking API connection...').start();
  const isHealthy = await client.healthCheck();

  if (!isHealthy) {
    spinner.fail('API is not available');
    process.exit(1);
  }

  spinner.text = 'Creating debate...';

  try {
    // Create debate
    const debate = await client.createDebate({
      topic,
      models: options.models,
    });

    spinner.succeed('Debate created!');

    console.log(chalk.bold('\n🤖 Agents debating\n'));

    let goldenPrompt = '';
    const handleEvent = createStreamHandlers();

    await client.streamDebate(debate.id, (event: DebateEvent) => {
      if (event.type === 'consensus' && event.text) goldenPrompt = event.text;
      handleEvent(event);
    });

    // Save to file if requested
    if (options.output && goldenPrompt) {
      fs.writeFileSync(options.output, goldenPrompt, 'utf-8');
      console.log(chalk.green(`\n✓ Saved to ${options.output}`));
    }

    console.log(chalk.bold.green('\n✓ Debate complete!\n'));
  } catch (error: any) {
    spinner.fail('Debate failed');
    console.error(chalk.red(`\nError: ${error.message}\n`));

    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.log(chalk.yellow('Make sure the Consilium backend is running.'));
      console.log(chalk.gray('Try: docker-compose up\n'));
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log(chalk.yellow('Authentication failed. Configure your API key:'));
      console.log(chalk.gray('consilium config set apiKey "your-key"\n'));
    }

    process.exit(1);
  }
}
