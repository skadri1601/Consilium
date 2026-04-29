import * as vscode from "vscode";
import type { ConsiliumApiClient, DebateSummary } from "../api-client";

class DebateNode extends vscode.TreeItem {
  constructor(public readonly summary: DebateSummary) {
    const label =
      (summary.topic ?? "(no topic)").slice(0, 80) +
      (summary.topic && summary.topic.length > 80 ? "…" : "");
    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = summary.id;
    this.description = `${summary.mode ?? "?"} · ${summary.status ?? "?"}`;
    this.tooltip = `${summary.topic ?? ""}\n${summary.id}\n${summary.createdAt ?? ""}`;
    this.iconPath = new vscode.ThemeIcon(
      summary.status === "completed"
        ? "check"
        : summary.status === "failed"
          ? "error"
          : summary.status === "processing"
            ? "loading~spin"
            : "comment-discussion",
    );
    this.contextValue = "consilium.debate";
    this.command = {
      command: "consilium.openDebate",
      title: "Open debate",
      arguments: [summary.id],
    };
  }
}

export class HistoryViewProvider implements vscode.TreeDataProvider<DebateNode> {
  private readonly _onDidChangeTreeData =
    new vscode.EventEmitter<DebateNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private cache: DebateSummary[] = [];

  constructor(private readonly client: ConsiliumApiClient) {}

  refresh(): void {
    void this.load();
  }

  getTreeItem(element: DebateNode): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<DebateNode[]> {
    if (this.cache.length === 0) await this.load();
    return this.cache.map((s) => new DebateNode(s));
  }

  private async load(): Promise<void> {
    try {
      this.cache = await this.client.listDebates({ limit: 50 });
      this._onDidChangeTreeData.fire();
    } catch (err) {
      this.cache = [];
      this._onDidChangeTreeData.fire();
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Consilium history: ${msg}`);
    }
  }
}
