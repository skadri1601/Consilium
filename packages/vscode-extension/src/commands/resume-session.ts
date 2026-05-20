import * as vscode from "vscode";
import type { ConsiliumClient } from "../api/client";
import type { SecretsStore } from "../auth/secrets";
import type { StatusBarController } from "../status-bar";
import { attachExistingDebatePanel } from "../webview/debate-panel";

export interface ResumeSessionDeps {
  client: ConsiliumClient;
  secrets: SecretsStore;
  statusBar: StatusBarController;
  onSessionsChanged: () => void;
}

export async function runResumeSession(
  deps: ResumeSessionDeps,
  sessionIdArg?: string,
): Promise<void> {
  const token = await deps.secrets.getApiToken();
  if (!token) {
    const action = await vscode.window.showWarningMessage(
      "Sign in to Consilium first.",
      "Sign In",
    );
    if (action === "Sign In") {
      await vscode.commands.executeCommand("consilium.login");
    }
    return;
  }

  let id = sessionIdArg;
  let topic = "";
  let mode = "council";
  let models: string[] | undefined;

  if (!id) {
    const sessions = await loadResumableSessions(deps.client);
    if (sessions.length === 0) {
      vscode.window.showInformationMessage("No sessions available to resume.");
      return;
    }
    const pick = await vscode.window.showQuickPick(
      sessions.map((s) => ({
        label: s.topic || s.id,
        description: `${s.mode} · ${s.status}`,
        detail: new Date(s.createdAt).toLocaleString(),
        id: s.id,
        topic: s.topic || s.id,
        mode: s.mode,
        models: s.modelsUsed,
      })),
      {
        title: "Resume a Consilium session",
        placeHolder: "Pick a session to attach to",
      },
    );
    if (!pick) return;
    id = pick.id;
    topic = pick.topic;
    mode = pick.mode;
    models = pick.models;
  }

  if (!id) return;

  if (!topic) {
    try {
      const detail = await deps.client.getDebate(id);
      topic = detail.topic || id;
      mode = detail.mode || mode;
      models = detail.modelsUsed ?? models;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to load session: ${msg}`);
      return;
    }
  }

  await attachExistingDebatePanel(
    deps.client,
    deps.secrets,
    deps.statusBar,
    deps.onSessionsChanged,
    {
      debateId: id,
      topic,
      mode,
      models,
    },
  );
}

async function loadResumableSessions(client: ConsiliumClient): Promise<
  Array<{
    id: string;
    topic: string;
    mode: string;
    status: string;
    createdAt: string;
    modelsUsed?: string[];
  }>
> {
  try {
    const list = await client.listDebates({ limit: 50 });
    return list
      .filter((d) => d.status !== "cancelled")
      .map((d) => ({
        id: d.id,
        topic: d.topic,
        mode: d.mode,
        status: d.status,
        createdAt: d.createdAt,
        modelsUsed: d.modelsUsed,
      }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to load sessions: ${msg}`);
    return [];
  }
}
