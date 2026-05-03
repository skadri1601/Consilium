import * as vscode from "vscode";
import type { ConsiliumClient } from "../api/client";
import { loginCommand, logoutCommand } from "../auth/login";
import {
  PROVIDER_IDS,
  PROVIDER_LABELS,
  type ProviderId,
  type SecretsStore,
} from "../auth/secrets";
import type { SessionsTreeProvider } from "../views/sessions-tree";
import type { ChatPanelProvider } from "../webview/chat-panel";

export function registerCommands(
  context: vscode.ExtensionContext,
  client: ConsiliumClient,
  secrets: SecretsStore,
  panel: ChatPanelProvider,
  sessions: SessionsTreeProvider,
): void {
  const cfg = () => vscode.workspace.getConfiguration("consilium");

  const reg = (id: string, fn: (...args: unknown[]) => unknown): void => {
    context.subscriptions.push(vscode.commands.registerCommand(id, fn));
  };

  reg("consilium.login", async () => {
    const webUrl = cfg().get<string>("webUrl") ?? "https://myconsilium.xyz";
    const ok = await loginCommand(secrets, client, webUrl);
    if (ok) {
      sessions.refresh();
      await panel.refreshAuth();
    }
  });

  reg("consilium.logout", async () => {
    await logoutCommand(secrets);
    sessions.refresh();
    await panel.refreshAuth();
  });

  reg("consilium.debate", async () => {
    panel.reveal();
    const topic = await vscode.window.showInputBox({
      title: "New Consilium debate",
      prompt: "Enter the topic or question for the council",
      ignoreFocusOut: true,
    });
    if (!topic?.trim()) return;
    const mode = (await pickMode()) ?? cfg().get<string>("defaultMode", "council");
    await panel.startDebate(topic.trim(), mode);
  });

  reg("consilium.debateSelection", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showInformationMessage("Select code to debate first.");
      return;
    }
    panel.reveal();
    const fileLabel = vscode.workspace.asRelativePath(editor.document.uri);
    const selected = editor.document.getText(editor.selection);
    const topic = await vscode.window.showInputBox({
      title: "Debate this selection",
      prompt: `From ${fileLabel}. Provide a question or instruction.`,
      placeHolder: "e.g. Is this implementation correct? Suggest improvements.",
      ignoreFocusOut: true,
    });
    if (!topic?.trim()) return;
    const mode = (await pickMode()) ?? cfg().get<string>("defaultMode", "council");
    const composed = `${topic.trim()}\n\n--- selection from ${fileLabel} ---\n\n\`\`\`\n${selected}\n\`\`\``;
    await panel.startDebate(composed, mode);
  });

  reg("consilium.redTeamSelection", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showInformationMessage("Select code to red-team first.");
      return;
    }
    panel.reveal();
    const fileLabel = vscode.workspace.asRelativePath(editor.document.uri);
    const selected = editor.document.getText(editor.selection);
    const note = await vscode.window.showInputBox({
      title: "Red-team focus",
      prompt: "Optional focus areas (e.g. 'auth bypass, injection'). Leave blank for general assessment.",
      ignoreFocusOut: true,
    });
    const models = cfg().get<string[]>("defaultModels") ?? [];
    if (models.length < 2) {
      vscode.window.showErrorMessage(
        "Configure at least two models in `consilium.defaultModels`.",
      );
      return;
    }
    const noteSuffix = note ? `: ${note}` : "";
    await panel.startDeliberation({
      kind: "redteam",
      topic: `Red-team review of ${fileLabel}${noteSuffix}`,
      models,
      content: selected,
      categories: note ? note.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    });
  });

  reg("consilium.deliberate", async () => {
    panel.reveal();
    const topic = await vscode.window.showInputBox({
      title: "New deliberation",
      prompt: "Enter the question for deliberation",
      ignoreFocusOut: true,
    });
    if (!topic?.trim()) return;
    const mode = (await pickMode()) ?? cfg().get<string>("defaultMode", "council");
    const models = cfg().get<string[]>("defaultModels") ?? [];
    await panel.startDeliberation({
      kind: "deliberate",
      topic: topic.trim(),
      mode,
      models,
    });
  });

  reg("consilium.cancel", async () => {
    if (!panel.hasActiveSession()) {
      vscode.window.showInformationMessage("No active Consilium session.");
      return;
    }
    await panel.cancelActive();
  });

  reg("consilium.refresh", () => {
    sessions.refresh();
  });

  reg("consilium.openSession", async (id: unknown) => {
    if (typeof id !== "string") return;
    try {
      const detail = await client.getDebate(id);
      const content = formatDebateMarkdown(detail);
      const doc = await vscode.workspace.openTextDocument({
        language: "markdown",
        content,
      });
      await vscode.window.showTextDocument(doc);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to open session: ${msg}`);
    }
  });

  reg("consilium.deleteSession", async (item: unknown) => {
    const id = extractSessionId(item);
    if (!id) return;
    const confirm = await vscode.window.showWarningMessage(
      "Delete this Consilium session permanently?",
      { modal: true },
      "Delete",
    );
    if (confirm !== "Delete") return;
    try {
      await client.deleteDebate(id);
      sessions.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to delete session: ${msg}`);
    }
  });

  reg("consilium.insertGoldenPrompt", async () => {
    const sessionsList = await client.listDebates({ limit: 30 });
    const completed = sessionsList.filter((s) => s.status === "completed");
    if (completed.length === 0) {
      vscode.window.showInformationMessage(
        "No completed sessions found.",
      );
      return;
    }
    const pick = await vscode.window.showQuickPick(
      completed.map((s) => ({
        label: s.topic,
        description: `${s.mode} · ${new Date(s.createdAt).toLocaleString()}`,
        id: s.id,
      })),
      { title: "Insert golden prompt from session" },
    );
    if (!pick) return;
    const detail = await client.getDebate(pick.id);
    const text = detail.goldenPrompt;
    if (!text) {
      vscode.window.showWarningMessage("Selected session has no golden prompt.");
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit((edit) => {
        edit.insert(editor.selection.active, text);
      });
    } else {
      const doc = await vscode.workspace.openTextDocument({
        language: "markdown",
        content: text,
      });
      await vscode.window.showTextDocument(doc);
    }
  });

  reg("consilium.openSettings", async () => {
    await vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "@ext:myconsilium.consilium-vscode",
    );
  });

  reg("consilium.setProviderKey", async () => {
    const provider = await vscode.window.showQuickPick(
      PROVIDER_IDS.map((id) => ({
        label: PROVIDER_LABELS[id],
        description: id,
        id,
      })),
      { title: "Choose provider for BYOK key" },
    );
    if (!provider) return;
    const value = await vscode.window.showInputBox({
      title: `${provider.label} API key`,
      prompt: `Stored securely in VS Code SecretStorage (key for ${provider.label})`,
      password: true,
      ignoreFocusOut: true,
    });
    if (!value) return;
    await secrets.setProviderKey(provider.id as ProviderId, value.trim());
    vscode.window.showInformationMessage(`Stored ${provider.label} API key.`);
  });
}

async function pickMode(): Promise<string | undefined> {
  const items: Array<vscode.QuickPickItem & { mode: string }> = [
    { label: "$(zap) quick", description: "1 round, fastest", mode: "quick" },
    { label: "$(comment-discussion) council", description: "3 rounds (default)", mode: "council" },
    { label: "$(rocket) deep", description: "5 rounds + sub-agents", mode: "deep" },
    { label: "$(eye-closed) blind", description: "Names hidden until scoring", mode: "blind" },
    { label: "$(shield) redteam", description: "Adversarial assessment", mode: "redteam" },
    { label: "$(law) jury", description: "Voting panel", mode: "jury" },
    { label: "$(graph) market", description: "Confidence aggregation", mode: "market" },
    { label: "$(sparkle) auto", description: "Pick best mode automatically", mode: "auto" },
  ];
  const pick = await vscode.window.showQuickPick(items, {
    title: "Debate mode",
    placeHolder: "Select a deliberation mode",
  });
  return pick?.mode;
}

function extractSessionId(item: unknown): string | undefined {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    if (typeof obj.id === "string") return obj.id;
    if (obj.debate && typeof obj.debate === "object") {
      const d = obj.debate as Record<string, unknown>;
      if (typeof d.id === "string") return d.id;
    }
  }
  return undefined;
}

function formatDebateMarkdown(detail: {
  id: string;
  topic: string;
  mode: string;
  status: string;
  createdAt: string;
  totalCost?: number;
  totalTokens?: number;
  modelsUsed?: string[];
  goldenPrompt?: string | null;
  rounds?: Array<Record<string, unknown>>;
}): string {
  const lines: string[] = [
    `# ${detail.topic}`,
    "",
    `- **ID**: \`${detail.id}\``,
    `- **Mode**: ${detail.mode}`,
    `- **Status**: ${detail.status}`,
    `- **Created**: ${new Date(detail.createdAt).toLocaleString()}`,
  ];
  if (typeof detail.totalCost === "number") {
    lines.push(`- **Total cost**: $${detail.totalCost.toFixed(4)}`);
  }
  if (typeof detail.totalTokens === "number") {
    lines.push(`- **Total tokens**: ${detail.totalTokens}`);
  }
  if (detail.modelsUsed?.length) {
    lines.push(`- **Models**: ${detail.modelsUsed.join(", ")}`);
  }
  lines.push("");
  if (detail.goldenPrompt) {
    lines.push("## Golden Prompt", "", detail.goldenPrompt, "");
  }
  if (detail.rounds?.length) {
    lines.push("## Rounds", "");
    for (let i = 0; i < detail.rounds.length; i++) {
      const round = detail.rounds[i] as Record<string, unknown>;
      lines.push(
        `### Round ${i + 1}`,
        "",
        "```json",
        JSON.stringify(round, null, 2),
        "```",
        "",
      );
    }
  }
  return lines.join("\n");
}
