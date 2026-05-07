import * as vscode from "vscode";
import { ConsiliumClient } from "./api/client";
import { SecretsStore } from "./auth/secrets";
import { registerCommands } from "./commands";
import { StatusBarController } from "./status-bar";
import { ModelsTreeProvider } from "./views/models-tree";
import { SessionsTreeProvider } from "./views/sessions-tree";
import { ChatPanelProvider } from "./webview/chat-panel";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const secrets = new SecretsStore(context.secrets);

  const cfg = () => vscode.workspace.getConfiguration("consilium");
  const apiUrl = () =>
    cfg().get<string>("apiUrl", "https://api.myconsilium.xyz");

  const client = new ConsiliumClient({
    apiUrl: apiUrl(),
    getToken: () => {
      // SecretStorage is async; we cache the latest token in a closure.
      return cachedToken;
    },
  });

  let cachedToken: string | undefined = await secrets.getApiToken();

  const refreshToken = async (): Promise<void> => {
    cachedToken = await secrets.getApiToken();
    await vscode.commands.executeCommand(
      "setContext",
      "consilium.authenticated",
      Boolean(cachedToken),
    );
  };
  await refreshToken();

  const statusBar = new StatusBarController();
  const sessionsProvider = new SessionsTreeProvider(client);
  const modelsProvider = new ModelsTreeProvider();
  const chatProvider = new ChatPanelProvider(
    context.extensionUri,
    client,
    secrets,
    statusBar,
    () => sessionsProvider.refresh(),
  );

  context.subscriptions.push(
    context.secrets.onDidChange(async (e) => {
      if (e.key === "consilium.apiToken") {
        await refreshToken();
        await chatProvider.refreshAuth();
        sessionsProvider.refresh();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("consilium.apiUrl")) {
        // Recreate client URL by mutating closure-bound URL through new instance.
        // Simpler: prompt reload.
        vscode.window
          .showInformationMessage(
            "Consilium API URL changed. Reload the window to apply.",
            "Reload",
          )
          .then((choice) => {
            if (choice === "Reload") {
              vscode.commands.executeCommand("workbench.action.reloadWindow");
            }
          });
      }
    }),
    statusBar,
    vscode.window.registerTreeDataProvider(
      "consilium.sessions",
      sessionsProvider,
    ),
    vscode.window.registerTreeDataProvider("consilium.models", modelsProvider),
    vscode.window.registerWebviewViewProvider(
      ChatPanelProvider.viewType,
      chatProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  registerCommands(context, client, secrets, chatProvider, sessionsProvider);

  statusBar.update(cachedToken ? { kind: "idle" } : { kind: "signed-out" });

  if (!cachedToken) {
    vscode.window
      .showInformationMessage(
        "Consilium is installed. Sign in to start running debates.",
        "Sign In",
      )
      .then((choice) => {
        if (choice === "Sign In") {
          return vscode.commands.executeCommand("consilium.login");
        }
        return undefined;
      })
      .then(
        () => undefined,
        () => undefined,
      );
  }
}

export function deactivate(): void {
  // Subscriptions are cleaned up by VS Code via context.subscriptions.
}
