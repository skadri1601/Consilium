import fs from 'fs';
import { ConsiliumClient, DeliberationEvent } from '../api/client';
import { requireAuth } from '../utils/require-auth';
import { style } from '../utils/visual-system';
import { terminal } from '../utils/terminal-capabilities';
import { log } from '../utils/logger';
import logUpdate from 'log-update';

const st = style();

export interface EvalCommandOptions {
  responses?: string;
  models?: string[];
}

export async function evalCommand(
  topic: string,
  options: EvalCommandOptions
): Promise<void> {
  requireAuth();

  if (!options.responses) {
    console.log(st.error('--responses <file.json> is required'));
    process.exit(1);
  }

  let responses: unknown;
  try {
    const raw = fs.readFileSync(options.responses, 'utf-8');
    responses = JSON.parse(raw);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.log(st.error(`Failed to read responses file: ${msg}`));
    process.exit(1);
  }

  const client = new ConsiliumClient();
  const useLiveProgress = terminal.isTTY && !terminal.usePlain;
  const startTime = Date.now();

  console.log(st.brand('\n  Blind Evaluation\n'));

  const isHealthy = await client.healthCheck();
  if (!isHealthy) {
    console.log(st.error('API is not available'));
    process.exit(1);
  }

  let deliberation: { id: string };
  try {
    deliberation = await client.createDeliberation(topic, {
      mode: 'blind',
      models: options.models,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Create failed';
    log('ERROR', 'eval_failed', { error: msg });
    console.log(st.error('Evaluation creation failed: ' + msg));
    process.exit(1);
  }

  log('INFO', 'eval_started', { debateId: deliberation.id });

  let currentPhase = '';
  const votes: Array<{ agent: string; position: string; confidence: number }> = [];
  let resultText = '';
  const costs: Array<{ model: string; tokens: number; cost: number }> = [];

  try {
    await client.streamDeliberation(deliberation.id, (event: DeliberationEvent) => {
      switch (event.type) {
        case 'phase_change':
          currentPhase = event.phase || '';
          if (useLiveProgress) {
            logUpdate(st.brand(`  Phase: ${currentPhase}...`));
          } else {
            console.log(st.brand(`  ${currentPhase}...`));
          }
          break;

        case 'model_progress':
          if (useLiveProgress && event.agent && event.progress !== undefined) {
            const pct = Math.round(event.progress);
            logUpdate(st.brand(`  Phase: ${currentPhase}...`) + `\n  ${event.agent}: ${pct}%`);
          }
          break;

        case 'vote_cast':
          if (event.vote) {
            votes.push(event.vote);
            if (!useLiveProgress) {
              console.log(st.dim(`  Vote: ${event.vote.agent} -> ${event.vote.position} (${Math.round(event.vote.confidence * 100)}%)`));
            }
          }
          break;

        case 'cost_update':
          if (event.cost) costs.push(event.cost);
          break;

        case 'deliberation_complete':
          if (event.text) resultText = event.text;
          if (useLiveProgress) logUpdate.clear();
          break;

        case 'error':
          if (useLiveProgress) logUpdate.clear();
          throw new Error(event.error || 'Evaluation error');
      }
    });
  } catch (error: unknown) {
    if (useLiveProgress) logUpdate.clear();
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log('ERROR', 'eval_failed', { debateId: deliberation.id, error: msg, durationMs: Date.now() - startTime });
    console.log(st.error('\n  Error: ' + msg + '\n'));
    process.exit(1);
  }

  log('INFO', 'eval_completed', { debateId: deliberation.id, durationMs: Date.now() - startTime });

  if (votes.length > 0) {
    console.log(st.dim('\n  Evaluation votes:'));
    for (const v of votes) {
      console.log(st.dim(`    ${v.agent}: ${v.position} (${Math.round(v.confidence * 100)}% confidence)`));
    }
  }

  if (resultText) {
    console.log('\n' + resultText);
  }

  if (costs.length > 0) {
    console.log(st.dim('\n  Cost breakdown:'));
    let total = 0;
    for (const c of costs) {
      total += c.cost;
      console.log(st.dim(`    ${c.model.padEnd(28)} ${c.tokens.toLocaleString()} tokens  $${c.cost.toFixed(4)}`));
    }
    console.log(st.dim(`    ${'Total'.padEnd(28)} $${total.toFixed(4)}`));
  }

  console.log(st.success('\nBlind evaluation complete.\n'));
}
