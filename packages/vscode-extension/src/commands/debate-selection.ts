import * as vscode from "vscode";
import type { ConsiliumClient } from "../api/client";
import type { SecretsStore } from "../auth/secrets";
import type { StatusBarController } from "../status-bar";
import { openDebatePanel } from "../webview/debate-panel";

export interface DebateSelectionDeps {
  client: ConsiliumClient;
  secrets: SecretsStore;
  statusBar: StatusBarController;
  onSessionsChanged: () => void;
}

export async function runDebateSelection(
  deps: DebateSelectionDeps,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode.window.showInformationMessage(
      "Select code in the editor to debate first.",
    );
    return;
  }

  const cfg = vscode.workspace.getConfiguration("consilium");
  const selected = editor.document.getText(editor.selection);
  const fileLabel = vscode.workspace.asRelativePath(editor.document.uri);
  const lang = editor.document.languageId || "";

  const question = await vscode.window.showInputBox({
    title: "Debate selected code",
    prompt: `From ${fileLabel}. Provide a question or instruction.`,
    placeHolder: "Debate this code:",
    value: "Debate this code:",
    ignoreFocusOut: true,
  });
  if (question === undefined) return;
  const finalQuestion = question.trim() || "Debate this code:";

  const mode = cfg.get<string>("defaultMode", "council");
  const composed = `${finalQuestion}\n\n\`\`\`${lang}\n${selected}\n\`\`\``;

  await openDebatePanel(
    deps.client,
    deps.secrets,
    deps.statusBar,
    deps.onSessionsChanged,
    {
      topic: composed,
      mode,
    },
  );
}
