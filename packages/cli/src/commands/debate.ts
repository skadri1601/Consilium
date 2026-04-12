import fs from 'node:fs';
import logUpdate from 'log-update';
import { ConsiliumClient, DebateEvent, DebateOptions, DeliberationEvent } from '../api/client';
import { createStreamHandlers } from '../utils/stream-renderer';
import { requireAuth } from '../utils/require-auth';
import { createStepTracker } from '../utils/progress-renderer';
import { style } from '../utils/visual-system';
import { terminal } from '../utils/terminal-capabilities';
import { isValidMode, getDefaultMode, estimateCost, formatCostEstimate, DebateMode, ALL_MODES } from '../utils/debate-modes';
import { isValidOutputFormat, formatOutput, getDefaultFilename, OutputFormat } from '../utils/output-formatter';
import { log } from '../utils/logger';
import { requestCodebasePermission } from '../utils/codebase-permissions';
import { detectWorkspace, getAutoLoadFiles, formatWorkspaceInfo } from '../utils/workspace-detector';
import { extractEnvMetadata } from '../utils/env-extractor';
import { isSecretFile } from '../utils/file-privacy';
import { collectGitContext, formatGitContextForPrompt } from '../utils/git-context';
import { fetchTicket, formatTicketForPrompt } from '../utils/linear-client';

const st = style();

export interface DebateCommandOptions {
  models?: string[];
  output?: string;
  mode?: string;
  scan?: boolean;
  gitDiff?: boolean;
  ticket?: string;
  noContext?: boolean;
}

const STEP_LABELS: Record<string, string> = {
  health: 'Health check',
  createDebate: 'Creating debate session',
  startStream: 'Establishing event stream',
};

const PHASE_LABELS: Record<string, string> = {
  proposing: 'Proposing',
  challenging: 'Challenging',
  rebutting: 'Rebutting',
  evaluating: 'Evaluating',
  voting: 'Voting',
  synthesizing: 'Synthesizing',
};

function renderPhaseDisplay(
  phase: string,
  modelProgress: Map<string, number>,
  convergence: number | null,
  dissents: Array<{ agent: string; reason: string }>,
): string {
  const lines: string[] = [];

  const phaseLabel = PHASE_LABELS[phase] || phase;
  lines.push(st.brand(`  Phase: ${phaseLabel}...`), '');

  for (const [model, progress] of modelProgress) {
    const filled = Math.round((20 * Math.min(100, progress)) / 100);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
    const pct = `${Math.round(progress)}%`;
    const name = model.length > 24 ? model.slice(0, 21) + '...' : model.padEnd(24);
    lines.push(`  ${name} [${bar}] ${pct}`);
  }

  if (convergence !== null) {
    lines.push('');
    const cvgPct = Math.round(convergence * 100);
    lines.push(st.dim(`  Convergence: ${cvgPct}%`));
  }

  if (dissents.length > 0) {
    lines.push('', st.warning('  Dissent detected:'));
    for (const d of dissents) {
      lines.push(st.warning(`    ${d.agent}: ${d.reason}`));
    }
  }

  return lines.join('\n');
}

function renderCostBreakdown(
  costs: Array<{ model: string; tokens: number; cost: number }>,
): string {
  if (costs.length === 0) return '';
  const lines: string[] = ['', st.dim('  Cost breakdown:')];
  let total = 0;
  for (const c of costs) {
    total += c.cost;
    lines.push(st.dim(`    ${c.model.padEnd(28)} ${c.tokens.toLocaleString()} tokens  $${c.cost.toFixed(4)}`));
  }
  lines.push(st.dim(`    ${'Total'.padEnd(28)} $${total.toFixed(4)}`));
  return lines.join('\n');
}

interface DeliberationStreamCtx {
  deliberationId: string;
  useLiveProgress: boolean;
  currentPhase: string;
  modelProgress: Map<string, number>;
  convergence: number | null;
  dissents: Array<{ agent: string; reason: string }>;
  votes: Array<{ agent: string; position: string; confidence: number }>;
  costs: Array<{ model: string; tokens: number; cost: number }>;
  resultText: string;
}

function onDeliberationStreamStart(ctx: DeliberationStreamCtx): void {
  if (ctx.useLiveProgress) return;
  console.log(st.dim(`  Deliberation ${ctx.deliberationId} started`));
}

function onDeliberationPhaseChange(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  ctx.currentPhase = event.phase || '';
  ctx.modelProgress.clear();
  if (ctx.useLiveProgress) {
    logUpdate(renderPhaseDisplay(ctx.currentPhase, ctx.modelProgress, ctx.convergence, ctx.dissents));
    return;
  }
  const label = PHASE_LABELS[ctx.currentPhase] || ctx.currentPhase;
  console.log(st.brand(`\n  ${label}...`));
}

function onDeliberationModelProgress(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (event.agent !== undefined && event.progress !== undefined) {
    ctx.modelProgress.set(event.agent, event.progress);
  }
  if (ctx.useLiveProgress) {
    logUpdate(renderPhaseDisplay(ctx.currentPhase, ctx.modelProgress, ctx.convergence, ctx.dissents));
  }
}

function onDeliberationConvergence(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (event.convergence !== undefined) {
    ctx.convergence = event.convergence;
  }
  if (ctx.useLiveProgress) {
    logUpdate(renderPhaseDisplay(ctx.currentPhase, ctx.modelProgress, ctx.convergence, ctx.dissents));
    return;
  }
  const cvg = Math.round((ctx.convergence ?? 0) * 100);
  console.log(st.dim(`  Convergence: ${cvg}%`));
}

function onDeliberationDissent(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (!event.dissent) return;
  ctx.dissents.push(event.dissent);
  if (ctx.useLiveProgress) return;
  console.log(st.warning(`  Dissent: ${event.dissent.agent} - ${event.dissent.reason}`));
}

function onDeliberationVote(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (!event.vote) return;
  ctx.votes.push(event.vote);
  if (ctx.useLiveProgress) return;
  console.log(st.dim(`  Vote: ${event.vote.agent} -> ${event.vote.position} (${Math.round(event.vote.confidence * 100)}%)`));
}

function onDeliberationCost(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (event.cost) {
    ctx.costs.push(event.cost);
  }
}

function onDeliberationComplete(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (event.text) {
    ctx.resultText = event.text;
  }
  if (ctx.useLiveProgress) logUpdate.clear();
}

function onDeliberationError(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (ctx.useLiveProgress) logUpdate.clear();
  throw new Error(event.error || 'Deliberation error');
}

function processDeliberationEvent(event: DeliberationEvent, ctx: DeliberationStreamCtx): void {
  if (event.type === 'deliberation_start') {
    onDeliberationStreamStart(ctx);
    return;
  }
  if (event.type === 'phase_change') {
    onDeliberationPhaseChange(event, ctx);
    return;
  }
  if (event.type === 'model_progress') {
    onDeliberationModelProgress(event, ctx);
    return;
  }
  if (event.type === 'convergence_update') {
    onDeliberationConvergence(event, ctx);
    return;
  }
  if (event.type === 'dissent_detected') {
    onDeliberationDissent(event, ctx);
    return;
  }
  if (event.type === 'vote_cast') {
    onDeliberationVote(event, ctx);
    return;
  }
  if (event.type === 'cost_update') {
    onDeliberationCost(event, ctx);
    return;
  }
  if (event.type === 'deliberation_complete') {
    onDeliberationComplete(event, ctx);
    return;
  }
  if (event.type === 'error') {
    onDeliberationError(event, ctx);
  }
}

function warnDebateCommandOptions(
  options: DebateCommandOptions,
  mode: DebateMode,
  outputFormat: OutputFormat,
): void {
  if (options.mode && !isValidMode(options.mode)) {
    console.log(st.warning(`Invalid mode "${options.mode}". Using "${mode}". Valid: ${ALL_MODES.join(', ')}`));
  }
  if (options.output && !isValidOutputFormat(options.output)) {
    console.log(st.warning(`Invalid output format "${options.output}". Using terminal output. Valid: markdown, cursorrules, claude-md, json`));
  }
}

function logStreamFailureHints(msg: string): void {
  if (msg.includes('ECONNREFUSED')) {
    console.log(st.warning('Make sure the Consilium backend is running.'));
    console.log(st.dim('Try: docker-compose up\n'));
    return;
  }
  if (msg.includes('401') || msg.includes('403')) {
    console.log(st.warning('Authentication failed. Configure your API key:'));
    console.log(st.dim('consilium config set apiKey "your-key"\n'));
    return;
  }
  if (msg.includes('timeout') || msg.includes('Timeout')) {
    console.log(st.warning('Request timed out. Increase timeout with CONSILIUM_STREAM_TIMEOUT env var.'));
    console.log(st.dim('Example: CONSILIUM_STREAM_TIMEOUT=600000 consilium debate "topic"\n'));
  }
}

function writeFormattedDebateOutput(
  goldenPrompt: string,
  outputFormat: OutputFormat,
  topic: string,
  models: string[],
  mode: DebateMode,
  debateId: string,
): void {
  if (!goldenPrompt || outputFormat === 'text') return;
  const formatted = formatOutput(goldenPrompt, {
    format: outputFormat,
    topic,
    models,
    mode,
    debateId,
    timestamp: new Date().toISOString(),
  });
  if (outputFormat === 'cursorrules' || outputFormat === 'claude-md') {
    const filename = getDefaultFilename(outputFormat, topic);
    fs.writeFileSync(filename, formatted, 'utf-8');
    console.log(st.success(`Saved to ${filename}`));
    return;
  }
  if (outputFormat === 'json' || outputFormat === 'markdown') {
    console.log(formatted);
  }
}

async function runClassicDebateFlow(
  client: ConsiliumClient,
  topic: string,
  mode: DebateMode,
  models: string[],
  outputFormat: OutputFormat,
  useLiveProgress: boolean,
  wsContext?: WorkspaceContext | null,
): Promise<void> {
  const stepIds: string[] = ['health', 'createDebate', 'startStream'];
  const tracker = createStepTracker(stepIds, STEP_LABELS);

  const renderProgress = () => {
    if (useLiveProgress) {
      logUpdate(tracker.render('Initializing'));
    }
  };

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
    const contextParts = [wsContext?.ticketPrefix, wsContext?.gitContextPrefix].filter(Boolean).join('');
    const effectiveTopic = contextParts ? contextParts + topic : topic;
    const debateOpts: DebateOptions = { topic: effectiveTopic, models, mode };
    if (wsContext) {
      debateOpts.files = wsContext.files;
      debateOpts.projectContext = wsContext.projectContext;
    }
    debate = await client.createDebate(debateOpts);
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
    console.log(st.error('\n  Error: ' + msg + '\n'));
    logStreamFailureHints(msg);
    process.exit(1);
  } finally {
    process.removeListener('SIGINT', sigintHandler);
  }

  log('INFO', 'debate_completed', { debateId: debate.id, durationMs: Date.now() - debateStartTime });

  writeFormattedDebateOutput(goldenPrompt, outputFormat, topic, models, mode, debate.id);

  console.log(st.success('Debate complete.\n'));
}

interface WorkspaceContext {
  files: Array<{ name: string; content: string }>;
  projectContext: Record<string, unknown>;
  gitContextPrefix: string;
  ticketPrefix: string;
}

async function loadWorkspaceContext(options: DebateCommandOptions): Promise<WorkspaceContext | null> {
  if (options.noContext) return null;

  const cwd = process.cwd();
  const permitted = await requestCodebasePermission(cwd);
  if (!permitted) return null;

  const workspace = detectWorkspace(cwd);
  const autoFiles = getAutoLoadFiles(workspace, cwd);

  const files: Array<{ name: string; content: string }> = [];
  for (const filePath of autoFiles) {
    if (isSecretFile(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('\0')) continue;
      if (content.length > 100 * 1024) continue;
      files.push({ name: require('node:path').basename(filePath), content });
    } catch {}
  }

  const envMeta = extractEnvMetadata(cwd);

  const projectContext: Record<string, unknown> = {
    projectType: workspace.projectType,
    language: workspace.language,
    framework: workspace.framework,
    packageManager: workspace.packageManager,
    hasTests: workspace.hasTests,
    hasDocker: workspace.hasDocker,
    hasCI: workspace.hasCI,
  };
  if (envMeta) {
    projectContext.integrations = envMeta.integrations;
  }

  let gitContextPrefix = '';
  if (options.gitDiff) {
    const gitCtx = collectGitContext(cwd);
    if (gitCtx?.diff) {
      gitContextPrefix = formatGitContextForPrompt(gitCtx);
      console.log(st.dim(`  Loaded git diff (branch: ${gitCtx.branch || 'unknown'})`));
    }
  }

  let ticketPrefix = '';
  if (options.ticket) {
    try {
      const ticket = await fetchTicket(options.ticket);
      if (ticket) {
        ticketPrefix = formatTicketForPrompt(ticket);
        console.log(st.dim(`  Loaded ticket: ${ticket.identifier} — ${ticket.title}`));
      } else {
        console.log(st.dim(`  Could not fetch ticket ${options.ticket} (check LINEAR_API_KEY)`));
      }
    } catch {
      console.log(st.dim(`  Could not fetch ticket ${options.ticket}`));
    }
  }

  if (files.length > 0) {
    console.log(st.dim(`  Loaded ${files.length} context files (${files.map(f => f.name).join(', ')})`));
  }
  if (envMeta?.integrations.length) {
    console.log(st.dim(`  Detected integrations: ${envMeta.integrations.join(', ')}`));
  }

  return { files, projectContext, gitContextPrefix, ticketPrefix };
}

export async function debateCommand(
  topic: string,
  options: DebateCommandOptions
): Promise<void> {
  await requireAuth();

  const mode: DebateMode = (options.mode && isValidMode(options.mode)) ? options.mode : getDefaultMode();
  const outputFormat: OutputFormat = (options.output && isValidOutputFormat(options.output)) ? options.output : 'text';

  warnDebateCommandOptions(options, mode, outputFormat);

  const models = options.models || ['gpt-4o-mini', 'claude-haiku-4-5-20251001', 'gemini-2.0-flash'];
  const estimate = estimateCost(mode, models.length);
  console.log(st.dim(formatCostEstimate(estimate)));

  const wsContext = await loadWorkspaceContext(options);

  const client = new ConsiliumClient();
  const useLiveProgress = terminal.isTTY && !terminal.usePlain;
  const useDeliberation = ['redteam', 'jury', 'market'].includes(mode);

  if (useDeliberation) {
    await runDeliberation(client, topic, mode, models, outputFormat, useLiveProgress, wsContext);
    return;
  }

  await runClassicDebateFlow(client, topic, mode, models, outputFormat, useLiveProgress, wsContext);
}

async function runDeliberation(
  client: ConsiliumClient,
  topic: string,
  mode: DebateMode,
  models: string[],
  outputFormat: OutputFormat,
  useLiveProgress: boolean,
  wsContext?: WorkspaceContext | null,
): Promise<void> {
  const startTime = Date.now();

  console.log(st.brand(`\n  Deliberation mode: ${mode}\n`));

  let deliberation: { id: string };
  try {
    const delibContextParts = [wsContext?.ticketPrefix, wsContext?.gitContextPrefix].filter(Boolean).join('');
    const effectiveDelibTopic = delibContextParts ? delibContextParts + topic : topic;
    deliberation = await client.createDeliberation(effectiveDelibTopic, {
      models,
      mode,
      ...(wsContext && { files: wsContext.files, projectContext: wsContext.projectContext }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Create failed';
    log('ERROR', 'deliberation_failed', { error: msg });
    console.log(st.error('Deliberation creation failed: ' + msg));
    process.exit(1);
  }

  log('INFO', 'deliberation_started', { debateId: deliberation.id, data: { topic, mode, models } });

  const ctx: DeliberationStreamCtx = {
    deliberationId: deliberation.id,
    useLiveProgress,
    currentPhase: '',
    modelProgress: new Map<string, number>(),
    convergence: null,
    dissents: [],
    votes: [],
    costs: [],
    resultText: '',
  };

  try {
    await client.streamDeliberation(deliberation.id, (event: DeliberationEvent) => {
      processDeliberationEvent(event, ctx);
    });
  } catch (error: unknown) {
    if (useLiveProgress) logUpdate.clear();
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log('ERROR', 'deliberation_failed', { debateId: deliberation.id, error: msg, durationMs: Date.now() - startTime });
    console.log(st.error('\n  Error: ' + msg + '\n'));
    logStreamFailureHints(msg);
    process.exit(1);
  }

  log('INFO', 'deliberation_completed', { debateId: deliberation.id, durationMs: Date.now() - startTime });

  if (ctx.dissents.length > 0) {
    console.log(st.warning('\n  Dissent report:'));
    for (const d of ctx.dissents) {
      console.log(st.warning(`    ${d.agent}: ${d.reason}`));
    }
  }

  if (ctx.votes.length > 0) {
    console.log(st.dim('\n  Votes:'));
    for (const v of ctx.votes) {
      console.log(st.dim(`    ${v.agent}: ${v.position} (${Math.round(v.confidence * 100)}% confidence)`));
    }
  }

  if (ctx.resultText) {
    console.log('\n' + ctx.resultText);
  }

  console.log(renderCostBreakdown(ctx.costs));

  writeFormattedDebateOutput(ctx.resultText, outputFormat, topic, models, mode, deliberation.id);

  console.log(st.success('\nDeliberation complete.\n'));
}
