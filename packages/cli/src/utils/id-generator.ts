import { ulid, decodeTime } from 'ulid';

export type IdPrefix = 'dbt' | 'cnv' | 'msg' | 'log';

const VALID_PREFIXES = new Set<string>(['dbt', 'cnv', 'msg', 'log']);

export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${ulid()}`;
}

export function parseId(id: string): { prefix: string; ulid: string; timestamp: Date } {
  const separatorIndex = id.indexOf('_');
  if (separatorIndex === -1) {
    throw new Error(`Invalid prefixed ID: ${id}`);
  }

  const prefix = id.substring(0, separatorIndex);
  const ulidPart = id.substring(separatorIndex + 1);

  if (!VALID_PREFIXES.has(prefix)) {
    throw new Error(`Unknown ID prefix: ${prefix}`);
  }

  const timestamp = new Date(decodeTime(ulidPart));

  return { prefix, ulid: ulidPart, timestamp };
}
