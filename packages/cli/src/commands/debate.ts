import fs from 'fs';
import logUpdate from 'log-update';
import { ConsiliumClient, DebateEvent } from '../api/client';
import { createStreamHandlers } from '../utils/stream-renderer';
import { requireAuth } from '../utils/require-auth';
import { createStepTracker } from '../utils/progress-renderer';
import { style } from '../utils/visual-system';
import { terminal } from '../utils/terminal-capabilities';
import { isValidMode, getDefaultMode, estimateCost, formatCostEstimate, DebateMode } from '../utils/debate-modes';
import { isValidOutputFormat, formatOutput, getDefaultFilename, OutputFormat } from '../utils/output-formatter';
import { log } from '../utils/logger';

const st = style();

export interface DebateCommandOptions {
  models?: string[];
  output?: string;
  mode?: string;
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

  const mode: DebateMode = (options.mode && isValidMode(options.mode)) ? options.mode : getDefaultMode();
  const outputFormat: OutputFormat = (options.output && isValidOutputFormat(options.output)) ? options.output : 'text';

  if (options.mode && !isValidMode(options.mode)) {
    console.log(st.warning(`Invalid mode "${options.mode}". Using "${mode}". Valid: quick, council, deep, blind`));
  }

  if (options.output && !isValidOutputFormat(options.output)) {
    console.log(st.warning(`Invalid output format "${options.output}". Using terminal output. Valid: markdown, cursorrules, claude-md, json`));
  }

  const models = options.models || ['gpt-4o-mini', 'claude-haiku-4-5-20251001', 'gemini-2.0-flash'];
  const estimate = estimateCost(mode, models.length);
  console.log(st.dim(formatCostEstimate(estimate)));

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

  const debateStartTime = Date.now();
  let debate: { id: string };
  try {
    debate = await client.createDebate({
      topic,
      models,
      mode,
    });
  } catch (err: unknown) {
    tracker.fail('createDebate', err instanceof Error ? err.message : 'Create failed');
    if (useLiveProgress) logUpdate.clear();
    log('ERROR', 'debate_failed', { error: err instanceof Error ? err.message : 'Create failed', durationMs: Date.now() - debateStartTime });
    console.log(st.error('Debate creation failed'));
    console.error(st.error((err as Error).message));
    process.exit(1);
  }

  log('INFO', 'debate_started', { debateId: debate.id, data: { topic, mode, models } });

  tracker.complete('createDebate');
  tracker.start('startStream');
  renderProgress();

  let goldenPrompt = '';
  const handleEvent = createStreamHandlers({ topic });

  const sigintHandler = async () => {
    try {
      await client.cancelDebate(debate.id);
    } catch {}
    process.exit(0);
  };
  process.on('SIGINT', sigintHandler);

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
    log('ERROR', 'debate_failed', { debateId: debate.id, error: msg, durationMs: Date.now() - debateStartTime });
    console.log(st.error('\n  ✗ Error: ' + msg + '\n'));
    if (msg.includes('ECONNREFUSED')) {
      console.log(st.warning('Make sure the Consilium backend is running.'));
      console.log(st.dim('Try: docker-compose up\n'));
    } else if (msg.includes('401') || msg.includes('403')) {
      console.log(st.warning('Authentication failed. Configure your API key:'));
      console.log(st.dim('consilium config set apiKey "your-key"\n'));
    }
    process.exit(1);
  } finally {
    process.removeListener('SIGINT', sigintHandler);
  }

  log('INFO', 'debate_completed', { debateId: debate.id, durationMs: Date.now() - debateStartTime });

  if (goldenPrompt && outputFormat !== 'text') {
    const formatted = formatOutput(goldenPrompt, {
      format: outputFormat,
      topic,
      models,
      mode,
      debateId: debate.id,
      timestamp: new Date().toISOString(),
    });
    if (outputFormat === 'cursorrules' || outputFormat === 'claude-md') {
      const filename = getDefaultFilename(outputFormat, topic);
      fs.writeFileSync(filename, formatted, 'utf-8');
      console.log(st.success(`Saved to ${filename}`));
    } else if (outputFormat === 'json' || outputFormat === 'markdown') {
      console.log(formatted);
    }
  }

  console.log(st.success('Debate complete.\n'));
}
