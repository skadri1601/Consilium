import * as vscode from "vscode";

interface ModelInfo {
  id: string;
  provider: string;
  tier: "fast" | "balanced" | "deep";
}

const KNOWN_MODELS: ModelInfo[] = [
  { id: "gpt-5.4-mini", provider: "OpenAI", tier: "fast" },
  { id: "gpt-5.5", provider: "OpenAI", tier: "deep" },
  { id: "claude-haiku-4-5-20251001", provider: "Anthropic", tier: "fast" },
  { id: "claude-sonnet-4-6", provider: "Anthropic", tier: "balanced" },
  { id: "claude-opus-4-7", provider: "Anthropic", tier: "deep" },
  { id: "gemini-3-flash-preview", provider: "Google", tier: "fast" },
  { id: "gemini-3.1-pro-preview", provider: "Google", tier: "deep" },
  { id: "llama-3.1-8b-instant", provider: "Groq", tier: "fast" },
  { id: "grok-4", provider: "xAI", tier: "balanced" },
];

export class ModelTreeItem extends vscode.TreeItem {
  constructor(public readonly model: ModelInfo) {
    super(model.id, vscode.TreeItemCollapsibleState.None);
    this.description = `${model.provider} · ${model.tier}`;
    this.tooltip = `${model.id} (${model.provider}, ${model.tier} tier)`;
    this.iconPath = new vscode.ThemeIcon(iconForTier(model.tier));
    this.contextValue = "model";
  }
}

export class ModelsTreeProvider implements vscode.TreeDataProvider<ModelTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ModelTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): ModelTreeItem[] {
    return KNOWN_MODELS.map((m) => new ModelTreeItem(m));
  }
}

function iconForTier(tier: ModelInfo["tier"]): string {
  switch (tier) {
    case "fast":
      return "zap";
    case "balanced":
      return "circuit-board";
    case "deep":
      return "rocket";
  }
}
