import fs from 'fs';
import { ConsiliumClient, DeliberationEvent } from '../api/client';
import { requireAuth } from '../utils/require-auth';
import { style } from '../utils/visual-system';
import { terminal } from '../utils/terminal-capabilities';
import { log } from '../utils/logger';
import logUpdate from 'log-update';

const st = style();

const VALID_BENCHMARKS = ['mmlu', 'truthfulqa', 'humaneval'] as const;
type BenchmarkName = typeof VALID_BENCHMARKS[number];

export interface BenchmarkCommandOptions {
  benchmark: string;
  models?: string[];
  mode?: string;
  n?: string;
  output?: string;
  local?: boolean;
}

interface BenchmarkProgress {
  currentQuestion: number;
  totalQuestions: number;
  singleCorrect: number;
  deliberationCorrect: number;
  costSoFar: number;
  currentCategory: string;
}

interface BenchmarkResultData {
  benchmark_name: string;
  single_model_score: number;
  deliberation_score: number;
  improvement_pct: number;
  num_questions: number;
  cost_single: number;
  cost_deliberation: number;
  details: Array<{
    category: string;
    single: { question: string; model_answer: string; correct: boolean; model_id: string };
    deliberation: { question: string; golden_prompt_answer: string; correct: boolean; votes: Record<string, string>; rounds_used: number };
  }>;
}

function renderProgressDisplay(progress: BenchmarkProgress): string {
  const lines: string[] = [];
  const pct = Math.round((progress.currentQuestion / progress.totalQuestions) * 100);
  const filled = Math.round((30 * Math.min(100, pct)) / 100);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(30 - filled);

  lines.push(st.brand(`  Benchmark Progress`));
  lines.push('');
  lines.push(`  [${bar}] ${progress.currentQuestion}/${progress.totalQuestions} (${pct}%)`);
  lines.push('');

  const singleAcc = progress.currentQuestion > 0
    ? ((progress.singleCorrect / progress.currentQuestion) * 100).toFixed(1)
    : '0.0';
  const delibAcc = progress.currentQuestion > 0
    ? ((progress.deliberationCorrect / progress.currentQuestion) * 100).toFixed(1)
    : '0.0';

  lines.push(st.dim(`  Single accuracy:       ${singleAcc}%`));
  lines.push(st.dim(`  Deliberation accuracy: ${delibAcc}%`));
  lines.push(st.dim(`  Cost so far:           $${progress.costSoFar.toFixed(4)}`));
  lines.push(st.dim(`  Current category:      ${progress.currentCategory}`));

  return lines.join('\n');
}

function renderResultsTable(result: BenchmarkResultData): string {
  const lines: string[] = [];

  lines.push(st.brand(`\n  Benchmark Report: ${result.benchmark_name.toUpperCase()}`));
  lines.push('');

  const metricCol = 'Metric'.padEnd(14);
  const singleCol = 'Single Model'.padEnd(14);
  const delibCol = 'Deliberation'.padEnd(14);

  lines.push(st.dim(`  ${''.padEnd(14 + 14 + 14 + 8, '-')}`));
  lines.push(`  ${st.bold(metricCol)} ${st.bold(singleCol)} ${st.bold(delibCol)}`);
  lines.push(st.dim(`  ${''.padEnd(14 + 14 + 14 + 8, '-')}`));

  const singlePct = `${(result.single_model_score * 100).toFixed(1)}%`.padEnd(14);
  const delibPct = `${(result.deliberation_score * 100).toFixed(1)}%`.padEnd(14);
  lines.push(`  ${'Accuracy'.padEnd(14)} ${singlePct} ${delibPct}`);

  const singleCost = `$${result.cost_single.toFixed(4)}`.padEnd(14);
  const delibCost = `$${result.cost_deliberation.toFixed(4)}`.padEnd(14);
  lines.push(`  ${'Cost'.padEnd(14)} ${singleCost} ${delibCost}`);

  const qCount = `${result.num_questions}`.padEnd(14);
  lines.push(`  ${'Questions'.padEnd(14)} ${qCount} ${qCount}`);

  lines.push(st.dim(`  ${''.padEnd(14 + 14 + 14 + 8, '-')}`));

  const sign = result.improvement_pct >= 0 ? '+' : '';
  const improvementStr = `${sign}${result.improvement_pct.toFixed(1)}%`;
  lines.push('');
  lines.push(st.brand(`  Improvement: ${improvementStr}`));

  if (result.details.length > 0) {
    lines.push('');
    lines.push(st.bold('  Per-Question Results'));
    lines.push('');

    const numCol = '#'.padEnd(4);
    const catCol = 'Category'.padEnd(14);
    const sCol = 'Single'.padEnd(8);
    const dCol = 'Delib'.padEnd(8);
    const rCol = 'Rounds'.padEnd(8);

    lines.push(st.dim(`  ${''.padEnd(4 + 14 + 8 + 8 + 8 + 4, '-')}`));
    lines.push(`  ${st.bold(numCol)} ${st.bold(catCol)} ${st.bold(sCol)} ${st.bold(dCol)} ${st.bold(rCol)}`);
    lines.push(st.dim(`  ${''.padEnd(4 + 14 + 8 + 8 + 8 + 4, '-')}`));

    for (let i = 0; i < result.details.length; i++) {
      const d = result.details[i]!;
      const singleMark = d.single.correct ? st.success('pass') : st.error('fail');
      const delibMark = d.deliberation.correct ? st.success('pass') : st.error('fail');
      const num = `${i + 1}`.padEnd(4);
      const cat = d.category.padEnd(14);
      const rounds = `${d.deliberation.rounds_used}`.padEnd(8);
      lines.push(`  ${num} ${cat} ${singleMark.padEnd(8)} ${delibMark.padEnd(8)} ${rounds}`);
    }

    lines.push(st.dim(`  ${''.padEnd(4 + 14 + 8 + 8 + 8 + 4, '-')}`));
  }

  return lines.join('\n');
}

export async function benchmarkCommand(
  options: BenchmarkCommandOptions
): Promise<void> {
  requireAuth();

  if (!options.benchmark || !VALID_BENCHMARKS.includes(options.benchmark as BenchmarkName)) {
    console.log(st.error(`Invalid benchmark "${options.benchmark}". Valid: ${VALID_BENCHMARKS.join(', ')}`));
    process.exit(1);
  }

  const models = options.models || ['gpt-4o-mini', 'claude-haiku-4-5-20251001', 'gemini-2.0-flash'];
  const mode = options.mode || 'council';
  const n = options.n ? parseInt(options.n, 10) : undefined;

  if (n !== undefined && (isNaN(n) || n <= 0)) {
    console.log(st.error('--n must be a positive integer'));
    process.exit(1);
  }

  const client = new ConsiliumClient();
  const useLiveProgress = terminal.isTTY && !terminal.usePlain;
  const startTime = Date.now();

  console.log(st.brand('\n  Benchmark Runner\n'));
  console.log(st.dim(`  Benchmark:  ${options.benchmark}`));
  console.log(st.dim(`  Models:     ${models.join(', ')}`));
  console.log(st.dim(`  Mode:       ${mode}`));
  if (n !== undefined) console.log(st.dim(`  Questions:  ${n}`));
  if (options.local) console.log(st.dim(`  Execution:  local`));
  console.log('');

  if (options.local) {
    await runLocalBenchmark(options.benchmark, models, mode, n, options.output, useLiveProgress, startTime);
    return;
  }

  const isHealthy = await client.healthCheck();
  if (!isHealthy) {
    console.log(st.error('API is not available'));
    process.exit(1);
  }

  let benchmarkRun: { id: string };
  try {
    benchmarkRun = await client.createBenchmark({
      benchmark: options.benchmark,
      models,
      mode,
      n,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Create failed';
    log('ERROR', 'benchmark_failed', { error: msg });
    console.log(st.error('Benchmark creation failed: ' + msg));
    process.exit(1);
  }

  log('INFO', 'benchmark_started', { benchmarkId: benchmarkRun.id, data: { benchmark: options.benchmark, models, mode, n } });

  const progress: BenchmarkProgress = {
    currentQuestion: 0,
    totalQuestions: n || 50,
    singleCorrect: 0,
    deliberationCorrect: 0,
    costSoFar: 0,
    currentCategory: '',
  };

  let resultData: BenchmarkResultData | null = null;

  const sigintHandler = async () => {
    if (useLiveProgress) logUpdate.clear();
    console.log(st.warning('\n  Benchmark cancelled'));
    process.exit(0);
  };
  process.on('SIGINT', sigintHandler);

  try {
    await client.streamBenchmark(benchmarkRun.id, (event: DeliberationEvent) => {
      switch (event.type) {
        case 'phase_change':
          if (event.phase === 'benchmark_start' && event.progress !== undefined) {
            progress.totalQuestions = event.progress;
          }
          break;

        case 'model_progress':
          if (event.progress !== undefined) {
            progress.currentQuestion = event.progress;
          }
          if (event.agent) {
            progress.currentCategory = event.agent;
          }
          if (useLiveProgress) {
            logUpdate(renderProgressDisplay(progress));
          } else {
            const pct = progress.totalQuestions > 0
              ? Math.round((progress.currentQuestion / progress.totalQuestions) * 100)
              : 0;
            console.log(st.dim(`  Question ${progress.currentQuestion}/${progress.totalQuestions} (${pct}%) - ${progress.currentCategory}`));
          }
          break;

        case 'convergence_update':
          if (event.convergence !== undefined) {
            const data = event as any;
            if (data.single_correct !== undefined) progress.singleCorrect = data.single_correct;
            if (data.deliberation_correct !== undefined) progress.deliberationCorrect = data.deliberation_correct;
          }
          if (useLiveProgress) {
            logUpdate(renderProgressDisplay(progress));
          }
          break;

        case 'cost_update':
          if (event.cost) {
            progress.costSoFar += event.cost.cost;
          }
          if (useLiveProgress) {
            logUpdate(renderProgressDisplay(progress));
          }
          break;

        case 'deliberation_complete':
          if (useLiveProgress) logUpdate.clear();
          if (event.text) {
            try {
              resultData = JSON.parse(event.text);
            } catch {
              resultData = null;
            }
          }
          break;

        case 'error':
          if (useLiveProgress) logUpdate.clear();
          throw new Error(event.error || 'Benchmark error');
      }
    });
  } catch (error: unknown) {
    if (useLiveProgress) logUpdate.clear();
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log('ERROR', 'benchmark_failed', { benchmarkId: benchmarkRun.id, error: msg, durationMs: Date.now() - startTime });
    console.log(st.error('\n  Error: ' + msg + '\n'));
    process.exit(1);
  } finally {
    process.removeListener('SIGINT', sigintHandler);
  }

  log('INFO', 'benchmark_completed', { benchmarkId: benchmarkRun.id, durationMs: Date.now() - startTime });

  if (resultData) {
    console.log(renderResultsTable(resultData));
  }

  if (resultData && options.output) {
    fs.writeFileSync(options.output, JSON.stringify(resultData, null, 2), 'utf-8');
    console.log(st.success(`\n  Results saved to ${options.output}`));
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(st.success(`\n  Benchmark complete. (${elapsed}s)\n`));
}

async function runLocalBenchmark(
  benchmark: string,
  models: string[],
  mode: string,
  n: number | undefined,
  output: string | undefined,
  useLiveProgress: boolean,
  startTime: number,
): Promise<void> {
  const { execSync, spawn } = await import('child_process');

  const args = [
    '-m', 'src.features.deliberation.benchmarks.runner',
    '--benchmark', benchmark,
    '--models', models.join(','),
    '--mode', mode,
  ];
  if (n !== undefined) args.push('--n', String(n));
  if (output) args.push('--output', output);

  console.log(st.dim('  Running benchmark locally via Python...\n'));

  const child = spawn('python', args, {
    cwd: process.env.CONSILIUM_AGENTS_DIR || 'apps/agents',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data: Buffer) => {
    const text = data.toString();
    stdout += text;
    if (!useLiveProgress) {
      process.stdout.write(text);
    }
  });

  child.stderr.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  return new Promise((resolve) => {
    child.on('close', (code: number | null) => {
      if (code !== 0) {
        log('ERROR', 'benchmark_local_failed', { error: stderr, durationMs: Date.now() - startTime });
        console.log(st.error(`\n  Local benchmark failed (exit code ${code})`));
        if (stderr) console.log(st.dim(stderr));
        process.exit(1);
      }

      if (useLiveProgress && stdout) {
        console.log(stdout);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      log('INFO', 'benchmark_local_completed', { durationMs: Date.now() - startTime });
      console.log(st.success(`\n  Local benchmark complete. (${elapsed}s)\n`));
      resolve();
    });
  });
}
