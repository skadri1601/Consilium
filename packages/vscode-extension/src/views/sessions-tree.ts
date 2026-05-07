import * as vscode from "vscode";
import type { ConsiliumClient } from "../api/client";
import type { DebateSummary } from "../api/types";

export class SessionTreeItem extends vscode.TreeItem {
  constructor(public readonly debate: DebateSummary) {
    super(debate.topic || debate.id, vscode.TreeItemCollapsibleState.None);
    this.id = debate.id;
    this.description = formatDescription(debate);
    this.tooltip = formatTooltip(debate);
    this.iconPath = iconForStatus(debate.status);
    this.contextValue = "session";
    this.command = {
      command: "consilium.openSession",
      title: "Open Session",
      arguments: [debate.id],
    };
  }
}

export class SessionsTreeProvider implements vscode.TreeDataProvider<SessionTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly client: ConsiliumClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SessionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<SessionTreeItem[]> {
    try {
      const debates = await this.client.listDebates({ limit: 30 });
      return debates.map((d) => new SessionTreeItem(d));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const item = new vscode.TreeItem(
        message.includes("401") || message.includes("Not authenticated")
          ? "Sign in to view sessions"
          : `Failed to load: ${message}`,
        vscode.TreeItemCollapsibleState.None,
      );
      item.iconPath = new vscode.ThemeIcon("warning");
      return [item as SessionTreeItem];
    }
  }
}

function formatDescription(debate: DebateSummary): string {
  const parts: string[] = [debate.mode];
  if (typeof debate.totalCost === "number") {
    parts.push(`$${debate.totalCost.toFixed(3)}`);
  }
  return parts.join(" · ");
}

function formatTooltip(debate: DebateSummary): string {
  const lines = [
    debate.topic,
    `Mode: ${debate.mode}`,
    `Status: ${debate.status}`,
    `Created: ${new Date(debate.createdAt).toLocaleString()}`,
  ];
  if (debate.modelsUsed?.length) {
    lines.push(`Models: ${debate.modelsUsed.join(", ")}`);
  }
  return lines.join("\n");
}

function iconForStatus(status: string): vscode.ThemeIcon {
  switch (status) {
    case "completed":
      return new vscode.ThemeIcon("pass");
    case "failed":
      return new vscode.ThemeIcon("error");
    case "cancelled":
      return new vscode.ThemeIcon("circle-slash");
    case "processing":
    case "pending":
      return new vscode.ThemeIcon("loading~spin");
    default:
      return new vscode.ThemeIcon("comment-discussion");
  }
}
