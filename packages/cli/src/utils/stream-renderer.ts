import chalk from 'chalk';
import { DebateEvent } from '../api/client';

const AGENT_LABEL_WIDTH = 22;

function padAgent(name: string): string {
  return name.length >= AGENT_LABEL_WIDTH
    ? name.slice(0, AGENT_LABEL_WIDTH - 2) + '…'
    : name.padEnd(AGENT_LABEL_WIDTH);
}

export interface StreamRenderOptions {
  /** Called when debate finishes (consensus or done) */
  onComplete?: () => void;
}

/**
 * Richer streaming layout: clear agent turns, indented text, progress.
 * Use from both debate command and chat session.
 */
export function createStreamHandlers(options: StreamRenderOptions = {}) {
  let currentAgent = '';
  let agentIndex = 0;
  const agentsSeen: string[] = [];

  return function handleEvent(event: DebateEvent): void {
    switch (event.type) {
      case 'debate_start': {
        console.log(chalk.gray('\n────────────────────────────────────────\n'));
        break;
      }

      case 'agent_start': {
        agentIndex++;
        currentAgent = event.agent || 'Unknown';
        agentsSeen.push(currentAgent);
        const label = padAgent(currentAgent);
        console.log(chalk.cyan(`  ▶ ${label}`) + chalk.gray(' thinking…'));
        console.log(chalk.gray('  │ '));
        break;
      }

      case 'agent_chunk': {
        if (event.text) process.stdout.write(chalk.gray(event.text));
        break;
      }

      case 'agent_complete': {
        const label = padAgent(currentAgent);
        console.log(chalk.gray('  └─ ') + chalk.green(`✓ ${label} done`));
        console.log('');
        break;
      }

      case 'consensus': {
        if (event.text) {
          console.log(chalk.bold.yellow('\n  📝 Golden Prompt'));
          console.log(chalk.gray('  ─────────────────────────────────────'));
          console.log(chalk.white('  ' + event.text.replace(/\n/g, '\n  ')));
          console.log(chalk.gray('  ─────────────────────────────────────\n'));
        }
        options.onComplete?.();
        break;
      }

      case 'done': {
        console.log(chalk.bold.green('  ✓ Debate complete.\n'));
        options.onComplete?.();
        break;
      }

      case 'error': {
        console.log(chalk.red('\n  ✖ Error: ' + (event.error || 'Unknown error') + '\n'));
        throw new Error(event.error || 'Unknown error');
      }

      default:
        break;
    }
  };
}
