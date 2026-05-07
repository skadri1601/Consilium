import * as vscode from "vscode";

export type SessionState =
  | { kind: "idle" }
  | { kind: "signed-out" }
  | { kind: "starting"; mode: string }
  | { kind: "running"; mode: string; round?: number; cost?: number }
  | { kind: "consensus"; cost?: number }
  | { kind: "error"; message: string };

export class StatusBarController {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.item.command = "consilium.openSettings";
    this.update({ kind: "idle" });
    this.item.show();
  }

  dispose(): void {
    this.item.dispose();
  }

  update(state: SessionState): void {
    switch (state.kind) {
      case "signed-out":
        this.item.text = "$(circle-slash) Consilium";
        this.item.tooltip = "Click to sign in to Consilium";
        this.item.command = "consilium.login";
        this.item.backgroundColor = undefined;
        return;
      case "idle":
        this.item.text = "$(comment-discussion) Consilium";
        this.item.tooltip = "Open Consilium council";
        this.item.command = "consilium.debate";
        this.item.backgroundColor = undefined;
        return;
      case "starting":
        this.item.text = `$(loading~spin) Consilium · ${state.mode}`;
        this.item.tooltip = "Starting debate…";
        this.item.command = "consilium.cancel";
        this.item.backgroundColor = undefined;
        return;
      case "running": {
        const parts: string[] = [`$(loading~spin) ${state.mode}`];
        if (state.round !== undefined) parts.push(`R${state.round}`);
        if (typeof state.cost === "number")
          parts.push(`$${state.cost.toFixed(3)}`);
        this.item.text = parts.join(" · ");
        this.item.tooltip = "Click to cancel the active debate";
        this.item.command = "consilium.cancel";
        this.item.backgroundColor = undefined;
        return;
      }
      case "consensus":
        this.item.text = `$(check) Consilium · consensus${
          typeof state.cost === "number" ? ` · $${state.cost.toFixed(3)}` : ""
        }`;
        this.item.tooltip = "Consensus reached";
        this.item.command = "consilium.debate";
        this.item.backgroundColor = undefined;
        return;
      case "error":
        this.item.text = `$(error) Consilium`;
        this.item.tooltip = state.message;
        this.item.command = "consilium.debate";
        this.item.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.errorBackground",
        );
        return;
    }
  }
}
