import * as vscode from "vscode";
import type { ConsiliumClient } from "../api/client";
import type { SecretsStore } from "./secrets";

const TOKEN_PREFIX = "consilium_";
const MIN_TOKEN_LENGTH = 20;

export async function loginCommand(
  secrets: SecretsStore,
  client: ConsiliumClient,
  webUrl: string,
): Promise<boolean> {
  const authUrl = `${webUrl.replace(/\/$/, "")}/cli/auth`;

  const action = await vscode.window.showInformationMessage(
    "Sign in to Consilium",
    {
      modal: true,
      detail:
        "Your browser will open a sign-in page. Generate a CLI token there, then paste it back here.",
    },
    "Open Browser",
    "I already have a token",
  );

  if (!action) return false;

  if (action === "Open Browser") {
    await vscode.env.openExternal(vscode.Uri.parse(authUrl));
  }

  const token = await vscode.window.showInputBox({
    title: "Paste your Consilium CLI token",
    prompt: `Token starts with "${TOKEN_PREFIX}"`,
    placeHolder: `${TOKEN_PREFIX}…`,
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => validateToken(value),
  });

  if (!token) return false;

  const trimmed = token.trim();
  await secrets.setApiToken(trimmed);

  try {
    const user = await client.getCurrentUser();
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    const display = name || user.email || "user";
    vscode.window.showInformationMessage(
      `Signed in to Consilium as ${display}.`,
    );
    await vscode.commands.executeCommand(
      "setContext",
      "consilium.authenticated",
      true,
    );
    return true;
  } catch (err) {
    await secrets.clearApiToken();
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Sign-in failed: ${message}`);
    return false;
  }
}

export async function logoutCommand(secrets: SecretsStore): Promise<void> {
  await secrets.clearApiToken();
  await vscode.commands.executeCommand(
    "setContext",
    "consilium.authenticated",
    false,
  );
  vscode.window.showInformationMessage("Signed out of Consilium.");
}

function validateToken(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Token is required";
  if (!trimmed.startsWith(TOKEN_PREFIX)) {
    return `Token must start with "${TOKEN_PREFIX}"`;
  }
  if (trimmed.length < MIN_TOKEN_LENGTH) {
    return "Token looks too short";
  }
  return undefined;
}
