import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockListDebates, mockCancelDebate, mockCancelDeliberation } = vi.hoisted(() => ({
  mockListDebates: vi.fn(),
  mockCancelDebate: vi.fn(),
  mockCancelDeliberation: vi.fn(),
}));

vi.mock('../api/client', () => ({
  ConsiliumClient: vi.fn().mockImplementation(() => ({
    listDebates: mockListDebates,
    cancelDebate: mockCancelDebate,
    cancelDeliberation: mockCancelDeliberation,
  })),
}));

vi.mock('../utils/require-auth', () => ({
  requireAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/visual-system', () => ({
  style: () => ({
    brand: (s: string) => s,
    dim: (s: string) => s,
    bold: (s: string) => s,
    success: (s: string) => s,
    error: (s: string) => s,
    warning: (s: string) => s,
  }),
}));

import { listDebatesCommand, cancelDebateCommand } from '../commands/debates';

describe('listDebatesCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('calls listDebates with parsed limit/offset/search', async () => {
    mockListDebates.mockResolvedValue([]);
    await listDebatesCommand({ limit: '5', offset: '10', search: 'auth' });
    expect(mockListDebates).toHaveBeenCalledWith({ limit: 5, offset: 10, search: 'auth' });
  });

  it('clamps limit to 100 and rejects negative values', async () => {
    mockListDebates.mockResolvedValue([]);
    await listDebatesCommand({ limit: '500' });
    expect(mockListDebates).toHaveBeenCalledWith({ limit: 100, offset: 0, search: undefined });
    mockListDebates.mockClear();
    await listDebatesCommand({ limit: '-1', offset: '-5' });
    expect(mockListDebates).toHaveBeenCalledWith({ limit: 20, offset: 0, search: undefined });
  });

  it('emits JSON when --json is set', async () => {
    const debates = [{ id: 'dbt_1', topic: 'x', mode: 'council', status: 'completed' }];
    mockListDebates.mockResolvedValue(debates);
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
    await listDebatesCommand({ json: true });
    expect(JSON.parse(logs.join('\n'))).toEqual(debates);
  });

  it('prints a friendly empty message when no debates', async () => {
    mockListDebates.mockResolvedValue([]);
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
    await listDebatesCommand({});
    expect(logs.join('\n')).toContain('No debates found.');
  });

  it('sets exit code on error', async () => {
    mockListDebates.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await listDebatesCommand({});
    expect(process.exitCode).toBe(1);
  });
});

describe('cancelDebateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('cancels a classic debate by default', async () => {
    mockCancelDebate.mockResolvedValue(undefined);
    await cancelDebateCommand('dbt_1', {});
    expect(mockCancelDebate).toHaveBeenCalledWith('dbt_1');
    expect(mockCancelDeliberation).not.toHaveBeenCalled();
  });

  it('cancels a deliberation when flag set', async () => {
    mockCancelDeliberation.mockResolvedValue(undefined);
    await cancelDebateCommand('dlb_1', { deliberation: true });
    expect(mockCancelDeliberation).toHaveBeenCalledWith('dlb_1');
    expect(mockCancelDebate).not.toHaveBeenCalled();
  });

  it('sets exit code when cancel fails', async () => {
    mockCancelDebate.mockRejectedValue(new Error('nope'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await cancelDebateCommand('dbt_1', {});
    expect(process.exitCode).toBe(1);
  });
});
