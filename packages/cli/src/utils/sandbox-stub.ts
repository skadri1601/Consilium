export interface SandboxAvailability {
  available: boolean;
  reason?: string;
}

const SANDBOX_UNAVAILABLE_REASON =
  "Native sandbox not yet implemented. See docs/superpowers/specs/2026-05-20-cli-sandbox-design.md. Use --worktree for git isolation.";

export function isSandboxAvailable(): SandboxAvailability {
  return { available: false, reason: SANDBOX_UNAVAILABLE_REASON };
}

export function runInSandbox(_cmd: string, _args: string[]): Promise<never> {
  return Promise.reject(new Error(SANDBOX_UNAVAILABLE_REASON));
}

export function describeSandboxStub(): string {
  return SANDBOX_UNAVAILABLE_REASON;
}
