import { debateCommand, type DebateCommandOptions } from './debate.js';

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8').trim()));
    process.stdin.on('error', reject);
  });
}

export async function runDebateFromStdin(options: DebateCommandOptions): Promise<void> {
  const topic = await readStdin();
  if (!topic) {
    process.exit(0);
  }
  await debateCommand(topic, options);
}
