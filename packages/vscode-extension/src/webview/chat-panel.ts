import * as vscode from "vscode";
import type { ConsiliumClient } from "../api/client";
import type {
  CreateDebateRequest,
  CreateDeliberationRequest,
  ProviderApiKeys,
  SseEnvelope,
} from "../api/types";
import type { SecretsStore } from "../auth/secrets";
import type { StatusBarController } from "../status-bar";
import { collectWorkspaceContext } from "../workspace/context";
import { getWebviewHtml } from "./html";

export interface ActiveSession {
  kind: "debate" | "deliberation" | "redteam";
  id: string;
  topic: string;
  mode: string;
  cancel: () => void;
  done: Promise<void>;
}

export class ChatPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "consilium.chat";

  private view: vscode.WebviewView | undefined;
  private active: ActiveSession | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly client: ConsiliumClient,
    private readonly secrets: SecretsStore,
    private readonly statusBar: StatusBarController,
    private readonly onSessionsChanged: () => void,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    view.webview.html = getWebviewHtml(view.webview, this.extensionUri, makeNonce());
    view.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    void this.refreshAuth();
  }

  isViewVisible(): boolean {
    return this.view?.visible ?? false;
  }

  reveal(): void {
    void vscode.commands.executeCommand("consilium.chat.focus");
  }

  hasActiveSession(): boolean {
    return this.active !== undefined;
  }

  async cancelActive(): Promise<void> {
    const session = this.active;
    if (!session) {
      vscode.window.showInformationMessage("No active Consilium session.");
      return;
    }
    session.cancel();
    try {
      if (session.kind === "debate") {
        await this.client.cancelDebate(session.id);
      } else {
        await this.client.cancelDeliberation(session.id);
      }
    } catch {
      // server may have already finished; ignore
    }
    this.post({ type: "cancelled" });
    this.active = undefined;
    this.statusBar.update({ kind: "idle" });
    this.onSessionsChanged();
  }

  async startDebate(topic: string, mode: string): Promise<void> {
    if (this.active) {
      vscode.window.showWarningMessage(
        "A Consilium session is already running. Cancel it before starting another.",
      );
      return;
    }
    const token = await this.secrets.getApiToken();
    if (!token) {
      const action = await vscode.window.showWarningMessage(
        "You need to sign in to Consilium first.",
        "Sign In",
      );
      if (action === "Sign In") {
        await vscode.commands.executeCommand("consilium.login");
      }
      return;
    }

    const cfg = vscode.workspace.getConfiguration("consilium");
    const models = cfg.get<string[]>("defaultModels") ?? [];
    if (models.length < 2) {
      vscode.window.showErrorMessage(
        "Configure at least two models in `consilium.defaultModels`.",
      );
      return;
    }

    const includeContext = cfg.get<boolean>("includeWorkspaceContext", true);
    const budgetKB = cfg.get<number>("contextBudgetKB", 512);

    let projectContext: Record<string, unknown> | undefined;
    if (includeContext) {
      try {
        const ctx = await collectWorkspaceContext(budgetKB * 1024);
        if (ctx) {
          projectContext = {
            ...ctx.projectContext,
            files: ctx.files,
            stats: {
              scanned: ctx.scanned,
              sent: ctx.sent,
              skipped: ctx.skipped,
            },
          };
          this.post({
            type: "init",
            workspaceContext: { scanned: ctx.scanned, sent: ctx.sent },
          });
        }
      } catch (err) {
        console.warn("Failed to collect workspace context", err);
      }
    }

    const payload: CreateDebateRequest = {
      topic,
      mode: isValidMode(mode) ? mode : "council",
      models,
      debateSource: "vscode",
      projectContext,
    };

    this.statusBar.update({ kind: "starting", mode });

    let created;
    try {
      created = await this.client.createDebate(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.post({ type: "error", message });
      this.statusBar.update({ kind: "error", message });
      return;
    }

    this.post({ type: "started", topic, mode, debateId: created.id });
    this.statusBar.update({ kind: "running", mode });

    let totalCost = 0;
    let currentRound: number | undefined;

    const stream = this.client.streamDebate(created.id, (event) => {
      this.handleStreamEvent(event);
      const eventType = (event.event ?? event.type) as string | undefined;
      if (eventType === "round_start" && typeof event.round === "number") {
        currentRound = event.round;
      }
      if (eventType === "cost_update" && typeof event.totalCost === "number") {
        totalCost = event.totalCost;
        this.statusBar.update({
          kind: "running",
          mode,
          round: currentRound,
          cost: totalCost,
        });
      }
      if (eventType === "consensus") {
        if (typeof event.totalCost === "number") totalCost = event.totalCost;
        this.statusBar.update({ kind: "consensus", cost: totalCost });
      }
    });

    this.active = {
      kind: "debate",
      id: created.id,
      topic,
      mode,
      cancel: stream.cancel,
      done: stream.done,
    };

    try {
      await stream.done;
      this.post({ type: "completed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.post({ type: "error", message });
      this.statusBar.update({ kind: "error", message });
    } finally {
      this.active = undefined;
      this.onSessionsChanged();
    }
  }

  async startDeliberation(
    payload: CreateDeliberationRequest & { kind?: "deliberate" | "redteam" | "blind" },
  ): Promise<void> {
    if (this.active) {
      vscode.window.showWarningMessage(
        "A Consilium session is already running. Cancel it before starting another.",
      );
      return;
    }
    const providerKeys: ProviderApiKeys = await this.collectProviderKeys();
    const body: CreateDeliberationRequest = {
      ...payload,
      apiKeys: { ...providerKeys, ...(payload.apiKeys ?? {}) },
    };

    this.statusBar.update({ kind: "starting", mode: payload.mode ?? "council" });

    let created: { id: string };
    try {
      if (payload.kind === "redteam") {
        created = await this.client.createRedTeam(body);
      } else if (payload.kind === "blind") {
        created = await this.client.createBlindEval(body);
      } else {
        created = await this.client.createDeliberation(body);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.post({ type: "error", message });
      this.statusBar.update({ kind: "error", message });
      return;
    }

    this.post({
      type: "started",
      topic: payload.topic,
      mode: payload.mode ?? "council",
      debateId: created.id,
    });
    this.statusBar.update({ kind: "running", mode: payload.mode ?? "council" });

    const stream = this.client.streamDeliberation(created.id, (event) => {
      this.handleStreamEvent(event);
      const eventType = (event.event ?? event.type) as string | undefined;
      if (eventType === "cost_update" && typeof event.totalCost === "number") {
        this.statusBar.update({
          kind: "running",
          mode: payload.mode ?? "council",
          cost: event.totalCost,
        });
      }
    });

    this.active = {
      kind: payload.kind === "redteam" ? "redteam" : "deliberation",
      id: created.id,
      topic: payload.topic,
      mode: payload.mode ?? "council",
      cancel: stream.cancel,
      done: stream.done,
    };

    try {
      await stream.done;
      this.post({ type: "completed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.post({ type: "error", message });
      this.statusBar.update({ kind: "error", message });
    } finally {
      this.active = undefined;
      this.onSessionsChanged();
    }
  }

  async refreshAuth(): Promise<void> {
    const token = await this.secrets.getApiToken();
    this.post({ type: "auth", authenticated: Boolean(token) });
    this.statusBar.update(token ? { kind: "idle" } : { kind: "signed-out" });
  }

  private async collectProviderKeys(): Promise<ProviderApiKeys> {
    const all = await this.secrets.getAllProviderKeys();
    return {
      openaiKey: all.openai,
      anthropicKey: all.anthropic,
      googleKey: all.google,
      groqKey: all.groq,
      xaiKey: all.xai,
      moonshotKey: all.moonshot,
      openrouterKey: all.openrouter,
    };
  }

  private handleStreamEvent(event: SseEnvelope): void {
    this.post({ type: "event", event });
  }

  private async handleMessage(msg: unknown): Promise<void> {
    if (!msg || typeof msg !== "object") return;
    const message = msg as Record<string, unknown>;
    switch (message.type) {
      case "ready":
        await this.refreshAuth();
        return;
      case "submit":
        if (typeof message.topic !== "string") return;
        await this.startDebate(message.topic, String(message.mode ?? "council"));
        return;
      case "cancel":
        await this.cancelActive();
        return;
      case "insertGoldenPrompt":
        if (typeof message.goldenPrompt === "string") {
          await insertAtCursor(message.goldenPrompt);
        }
        return;
      case "copyGoldenPrompt":
        if (typeof message.goldenPrompt === "string") {
          await vscode.env.clipboard.writeText(message.goldenPrompt);
          vscode.window.showInformationMessage("Golden prompt copied.");
        }
        return;
      case "openInNewFile":
        if (typeof message.goldenPrompt === "string") {
          const doc = await vscode.workspace.openTextDocument({
            language: "markdown",
            content: message.goldenPrompt,
          });
          await vscode.window.showTextDocument(doc);
        }
        return;
    }
  }

  private post(message: Record<string, unknown>): void {
    this.view?.webview.postMessage(message);
  }
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

function isValidMode(mode: string): mode is CreateDebateRequest["mode"] & string {
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

function makeNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
