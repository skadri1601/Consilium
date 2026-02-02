import fs from 'fs';
import logUpdate from 'log-update';
import { ConsiliumClient, DebateEvent } from '../api/client';
import { createStreamHandlers } from '../utils/stream-renderer';
import { requireAuth } from '../utils/require-auth';
import { createStepTracker } from '../utils/progress-renderer';
import { style } from '../utils/visual-system';
import { terminal } from '../utils/terminal-capabilities';

const st = style();

export interface DebateCommandOptions {
  models?: string[];
  output?: string;
}

const STEP_LABELS: Record<string, string> = {
  health: 'Health check',
  createDebate: 'Creating debate session',
  startStream: 'Establishing event stream',
};

export async function debateCommand(
  topic: string,
  options: DebateCommandOptions
): Promise<void> {
  requireAuth();

  const client = new ConsiliumClient();
  const stepIds: string[] = ['health', 'createDebate', 'startStream'];
  const tracker = createStepTracker(stepIds, STEP_LABELS);
  const useLiveProgress = terminal.isTTY && !terminal.usePlain;

  function renderProgress() {
    if (useLiveProgress) {
      logUpdate(tracker.render('Initializing'));
    }
  }

  tracker.start('health');
  renderProgress();
  const isHealthy = await client.healthCheck();

  if (!isHealthy) {
    if (useLiveProgress) logUpdate.clear();
    console.log(st.error('API is not available'));
    process.exit(1);
  }

  tracker.complete('health');
  tracker.start('createDebate');
  renderProgress();

  let debate: { id: string };
  try {
    debate = await client.createDebate({
      topic,
      models: options.models,
    });
  } catch (err: unknown) {
    tracker.fail('createDebate', err instanceof Error ? err.message : 'Create failed');
    if (useLiveProgress) logUpdate.clear();
    console.log(st.error('Debate creation failed'));
    console.error(st.error((err as Error).message));
    process.exit(1);
  }

  tracker.complete('createDebate');
  tracker.start('startStream');
  renderProgress();

  let goldenPrompt = '';
  const handleEvent = createStreamHandlers({ topic });

  try {
    await client.streamDebate(debate.id, (event: DebateEvent) => {
      if (event.type === 'debate_start') {
        tracker.complete('startStream');
        if (useLiveProgress) logUpdate.clear();
      }
      if (event.type === 'consensus' && event.text) goldenPrompt = event.text;
      handleEvent(event);
    });
  } catch (error: unknown) {
    if (useLiveProgress) logUpdate.clear();
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.log(st.error('\n  ✗ Error: ' + msg + '\n'));
    if (msg.includes('ECONNREFUSED')) {
      console.log(st.warning('Make sure the Consilium backend is running.'));
      console.log(st.dim('Try: docker-compose up\n'));
    } else if (msg.includes('401') || msg.includes('403')) {
      console.log(st.warning('Authentication failed. Configure your API key:'));
      console.log(st.dim('consilium config set apiKey "your-key"\n'));
    }
    process.exit(1);
  }

  if (options.output && goldenPrompt) {
    fs.writeFileSync(options.output, goldenPrompt, 'utf-8');
    console.log(st.success('Saved to ' + options.output));
  }

  console.log(st.success('Debate complete.\n'));
}
