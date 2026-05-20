import { randomBytes } from "node:crypto";
import * as vscode from "vscode";
import type { ConsiliumClient, StreamHandle } from "../api/client";
import type { CreateDebateRequest, SseEnvelope } from "../api/types";
import type { SecretsStore } from "../auth/secrets";
import type { StatusBarController } from "../status-bar";
import { collectWorkspaceContext } from "../workspace/context";
import { renderDebatePanelHtml } from "./debate-panel.html";

export type DebateMode = NonNullable<CreateDebateRequest["mode"]>;

export interface OpenDebatePanelOptions {
  topic: string;
  mode: DebateMode | string;
  models?: string[];
  initialEtaSeconds?: number;
  viewColumn?: vscode.ViewColumn;
  sessionId?: string;
}

export interface AttachExistingDebateOptions {
  debateId: string;
  topic: string;
  mode: string;
  models?: string[];
  viewColumn?: vscode.ViewColumn;
  sessionId?: string;
}

interface DebateRoundRecord {
  phase: string;
  agentId: string;
  content: string;
  timestamp: number;
}

interface DebateRecord {
  topic: string;
  mode: string;
  models?: string[];
  synthesis: string;
  rounds: DebateRoundRecord[];
  cost?: { totalUsd: number; perAgent: Record<string, number> };
  durationMs: number;
  completedAt: number;
}

let outputChannel: vscode.OutputChannel | undefined;
function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Consilium");
  }
  return outputChannel;
}

export class DebatePanel {
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private stream: StreamHandle | undefined;
  private debateId: string | undefined;
  private goldenPrompt = "";
  private totalCost = 0;
  private finished = false;
  private currentRound: number | undefined;
  private readonly mode: string;
  private readonly topic: string;
  private readonly models: string[];
  private sessionId: string | undefined;
  private wasCanceled = false;
  private persistAttempted = false;
  private startedAt: number | undefined;
  private currentPhase = "init";
  private readonly rounds: DebateRoundRecord[] = [];
  private readonly agentBuffers = new Map<string, string>();
  private readonly perAgentCost: Record<string, number> = {};

  constructor(
    private readonly client: ConsiliumClient,
    private readonly secrets: SecretsStore,
    private readonly statusBar: StatusBarController,
    private readonly onChanged: () => void,
    init: {
      topic: string;
      mode: string;
      models: string[];
      etaSeconds?: number;
      viewColumn?: vscode.ViewColumn;
      sessionId?: string;
    },
  ) {
    this.topic = init.topic;
    this.mode = init.mode;
    this.models = init.models;
    this.sessionId = init.sessionId;
    const nonce = makeNonce();
    this.panel = vscode.window.createWebviewPanel(
      "consilium.debate",
      shortTitle(init.topic, init.mode),
      init.viewColumn ?? vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );
    this.panel.webview.html = renderDebatePanelHtml({
      webview: this.panel.webview,
      nonce,
      topic: init.topic,
      mode: init.mode,
      models: init.models,
      etaSeconds: init.etaSeconds,
    });
    this.disposables.push(
      this.panel.webview.onDidReceiveMessage((msg) => this.onMessage(msg)),
      this.panel.onDidDispose(() => this.dispose()),
    );
  }

  dispose(): void {
    if (this.stream && !this.finished) {
      try {
        this.stream.cancel();
      } catch {
        // already aborted
      }
    }
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {
        // ignore
      }
    }
    this.disposables.length = 0;
  }

  reveal(): void {
    this.panel.reveal(undefined, true);
  }

  async start(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("consilium");
    const models = cfg.get<string[]>("defaultModels") ?? [];
    if (models.length < 2) {
      this.post({
        type: "error",
        message: "Configure at least two models in `consilium.defaultModels`.",
      });
      return;
    }
    const token = await this.secrets.getApiToken();
    if (!token) {
      this.post({
        type: "error",
        message: "Sign in to Consilium first (Consilium: Sign In).",
      });
      return;
    }

    const projectContext = await this.gatherProjectContext(cfg);

    const payload: CreateDebateRequest = {
      topic: this.topic,
      mode: isValidMode(this.mode) ? (this.mode as DebateMode) : "council",
      models,
      debateSource: "vscode",
      projectContext,
    };

    this.statusBar.update({ kind: "starting", mode: this.mode });
    this.post({ type: "status", text: "Creating debate…" });
    this.startedAt = Date.now();

    try {
      const created = await this.client.createDebate(payload);
      this.debateId = created.id;
      this.post({ type: "status", text: "Running" });
      this.statusBar.update({ kind: "running", mode: this.mode });
      this.streamDebate(created.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.post({ type: "error", message });
      this.statusBar.update({ kind: "error", message });
    }
  }

  async attach(opts: { debateId: string }): Promise<void> {
    this.debateId = opts.debateId;
    this.startedAt = Date.now();
    this.post({ type: "status", text: "Streaming existing session…" });
    this.statusBar.update({ kind: "running", mode: this.mode });
    this.streamDebate(opts.debateId);
  }

  private streamDebate(id: string): void {
    const handle = this.client.streamDebate(id, (event) => {
      this.handleStreamEvent(event);
      this.post({ type: "event", payload: event });
    });
    this.stream = handle;

    handle.done
      .then(() => {
        if (!this.finished) {
          this.finished = true;
          this.post({ type: "completed" });
          this.statusBar.update({ kind: "consensus", cost: this.totalCost });
        }
        void this.persistDebate();
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.finished = true;
        this.post({ type: "error", message });
        this.statusBar.update({ kind: "error", message });
      })
      .finally(() => {
        this.onChanged();
      });
  }

  private handleStreamEvent(event: SseEnvelope): void {
    const eventType = event.event ?? event.type;
    if (eventType === "round_start" && typeof event.round === "number") {
      this.currentRound = event.round;
      this.currentPhase = `round_${event.round}`;
    }
    if (eventType === "phase_change" && typeof event.phase === "string") {
      this.currentPhase = event.phase;
    }
    if (eventType === "agent_start") {
      const agentId =
        stringField(event, "agentId") ?? stringField(event, "agent");
      if (agentId) this.agentBuffers.set(agentId, "");
    }
    if (eventType === "agent_chunk") {
      const agentId =
        stringField(event, "agentId") ?? stringField(event, "agent");
      const chunk = stringField(event, "chunk");
      if (agentId && chunk) {
        const prev = this.agentBuffers.get(agentId) ?? "";
        this.agentBuffers.set(agentId, prev + chunk);
      }
    }
    if (eventType === "agent_complete") {
      const agentId =
        stringField(event, "agentId") ?? stringField(event, "agent");
      if (agentId) {
        const content = this.agentBuffers.get(agentId) ?? "";
        this.rounds.push({
          phase: this.currentPhase,
          agentId,
          content,
          timestamp: Date.now(),
        });
        this.agentBuffers.delete(agentId);
        if (typeof event.cost === "number") {
          this.perAgentCost[agentId] =
            (this.perAgentCost[agentId] ?? 0) + event.cost;
        }
      }
    }
    if (eventType === "cost_update" && typeof event.totalCost === "number") {
      this.totalCost = event.totalCost;
      this.statusBar.update({
        kind: "running",
        mode: this.mode,
        round: this.currentRound,
        cost: this.totalCost,
      });
    }
    if (eventType === "consensus" && typeof event.goldenPrompt === "string") {
      this.goldenPrompt = event.goldenPrompt;
      if (typeof event.totalCost === "number") {
        this.totalCost = event.totalCost;
      }
      this.statusBar.update({ kind: "consensus", cost: this.totalCost });
    }
    if (
      eventType === "done" &&
      typeof event.goldenPrompt === "string" &&
      !this.goldenPrompt
    ) {
      this.goldenPrompt = event.goldenPrompt;
    }
  }

  private async persistDebate(): Promise<void> {
    if (this.persistAttempted) return;
    if (this.wasCanceled) return;
    if (!this.debateId) return;
    if (!this.goldenPrompt) return;
    this.persistAttempted = true;

    const record: DebateRecord = {
      topic: this.topic,
      mode: this.mode,
      models: this.models,
      synthesis: this.goldenPrompt,
      rounds: [...this.rounds],
      cost: {
        totalUsd: this.totalCost,
        perAgent: { ...this.perAgentCost },
      },
      durationMs: this.startedAt ? Date.now() - this.startedAt : 0,
      completedAt: Date.now(),
    };

    try {
      let sessionId = this.sessionId;
      let sessionTitle = this.topic.slice(0, 60);
      if (!sessionId) {
        const created = await this.client.createSession(sessionTitle);
        sessionId = created.id;
        sessionTitle = created.title || sessionTitle;
        this.sessionId = sessionId;
      }
      await this.client.appendDebateToSession(sessionId, this.debateId);
      this.post({
        type: "sessionSaved",
        sessionId,
        sessionTitle,
        debateId: this.debateId,
        record,
      });
      this.onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      getOutputChannel().appendLine(
        `[session-sync] Failed to persist debate ${this.debateId}: ${message}`,
      );
      void vscode.window.showWarningMessage(
        `Debate completed but failed to save: ${message}`,
      );
    }
  }

  private async onMessage(msg: unknown): Promise<void> {
    if (!msg || typeof msg !== "object") return;
    const m = msg as Record<string, unknown>;
    switch (m.type) {
      case "ready":
        return;
      case "cancel":
        await this.cancel();
        return;
      case "insertGoldenPrompt":
        if (typeof m.goldenPrompt === "string") {
          await insertAtCursor(m.goldenPrompt);
        }
        return;
      case "copyGoldenPrompt":
        if (typeof m.goldenPrompt === "string") {
          await vscode.env.clipboard.writeText(m.goldenPrompt);
          vscode.window.showInformationMessage("Golden prompt copied.");
        }
        return;
      case "openInNewFile":
        if (typeof m.goldenPrompt === "string") {
          const doc = await vscode.workspace.openTextDocument({
            language: "markdown",
            content: m.goldenPrompt,
          });
          await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        }
        return;
      case "openSavedSession":
        await vscode.commands.executeCommand("consilium.refresh");
        return;
    }
  }

  async cancel(): Promise<void> {
    if (this.finished) return;
    this.wasCanceled = true;
    if (this.stream) {
      try {
        this.stream.cancel();
      } catch {
        // ignore
      }
    }
    if (this.debateId) {
      try {
        await this.client.cancelDebate(this.debateId);
      } catch {
        // server may have already completed
      }
    }
    this.finished = true;
    this.post({ type: "cancelled" });
    this.statusBar.update({ kind: "idle" });
    this.onChanged();
  }

  private post(message: Record<string, unknown>): void {
    void this.panel.webview.postMessage(message);
  }

  private async gatherProjectContext(
    cfg: vscode.WorkspaceConfiguration,
  ): Promise<Record<string, unknown> | undefined> {
    if (!cfg.get<boolean>("includeWorkspaceContext", true)) return undefined;
    const budgetKB = cfg.get<number>("contextBudgetKB", 512);
    try {
      const ctx = await collectWorkspaceContext(budgetKB * 1024);
      if (!ctx) return undefined;
      return {
        ...ctx.projectContext,
        files: ctx.files,
        stats: { scanned: ctx.scanned, sent: ctx.sent, skipped: ctx.skipped },
      };
    } catch {
      return undefined;
    }
  }
}

export async function openDebatePanel(
  client: ConsiliumClient,
  secrets: SecretsStore,
  statusBar: StatusBarController,
  onChanged: () => void,
  opts: OpenDebatePanelOptions,
): Promise<DebatePanel> {
  const cfg = vscode.workspace.getConfiguration("consilium");
  const models = opts.models ?? cfg.get<string[]>("defaultModels") ?? [];
  const panel = new DebatePanel(client, secrets, statusBar, onChanged, {
    topic: opts.topic,
    mode: String(opts.mode),
    models,
    etaSeconds: opts.initialEtaSeconds,
    viewColumn: opts.viewColumn,
    sessionId: opts.sessionId,
  });
  await panel.start();
  return panel;
}

export async function attachExistingDebatePanel(
  client: ConsiliumClient,
  secrets: SecretsStore,
  statusBar: StatusBarController,
  onChanged: () => void,
  opts: AttachExistingDebateOptions,
): Promise<DebatePanel> {
  const cfg = vscode.workspace.getConfiguration("consilium");
  const models = opts.models ?? cfg.get<string[]>("defaultModels") ?? [];
  const panel = new DebatePanel(client, secrets, statusBar, onChanged, {
    topic: opts.topic,
    mode: opts.mode,
    models,
    viewColumn: opts.viewColumn,
    sessionId: opts.sessionId,
  });
  await panel.attach({ debateId: opts.debateId });
  return panel;
}

function stringField(event: SseEnvelope, key: string): string | undefined {
  const value = event[key];
  return typeof value === "string" ? value : undefined;
}

async function insertAtCursor(text: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    const doc = await vscode.workspace.openTextDocument({
      language: "markdown",
      content: text,
    });
    await vscode.window.showTextDocument(doc);
    return;
  }
  await editor.edit((edit) => {
    edit.insert(editor.selection.active, text);
  });
}

function isValidMode(mode: string): boolean {
  return [
    "quick",
    "council",
    "deep",
    "blind",
    "redteam",
    "jury",
    "market",
    "auto",
  ].includes(mode);
}

function shortTitle(topic: string, mode: string): string {
  const trimmed = topic.length > 48 ? `${topic.slice(0, 45)}…` : topic;
  return `Consilium · ${mode} · ${trimmed}`;
}

function makeNonce(): string {
  return randomBytes(24).toString("base64url");
}
