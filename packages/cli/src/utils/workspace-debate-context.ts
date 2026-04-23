import { requestCodebasePermission } from "./codebase-permissions";
import { detectWorkspace } from "./workspace-detector";
import { extractEnvMetadata } from "./env-extractor";
import { collectGitContext, formatGitContextForPrompt } from "./git-context";
import { fetchTicket, formatTicketForPrompt } from "./linear-client";
import {
  scanProject,
  type ScanManifest,
  type ScannedFile,
} from "./project-scanner";
import { resolveProjectRoot } from "./project-root";
import { style } from "./visual-system";

const st = style();

export interface WorkspaceDebateContextOptions {
  noContext?: boolean;
  gitDiff?: boolean;
  ticket?: string;
}

export interface WorkspaceDebateContext {
  files: Array<{ name: string; content: string }>;
  projectFiles: ScannedFile[];
  projectContext: Record<string, unknown>;
  gitContextPrefix: string;
  ticketPrefix: string;
  rootPath: string;
  contextManifest: ScanManifest;
}

export async function loadWorkspaceDebateContext(
  options: WorkspaceDebateContextOptions,
  cwd = process.cwd(),
): Promise<WorkspaceDebateContext | null> {
  if (options.noContext) return null;

  const rootInfo = resolveProjectRoot(cwd);
  if (rootInfo.isSubdirectory) {
    console.log(
      st.dim(
        `  Tip: running Consilium from project root (${rootInfo.root}) improves context coverage and edit accuracy.`,
      ),
    );
  }

  const permitted = await requestCodebasePermission(rootInfo.root);
  if (!permitted) return null;

  const workspace = detectWorkspace(rootInfo.root);
  const scanResult = scanProject(rootInfo.root);
  const projectFiles = scanResult.files;
  const files: Array<{ name: string; content: string }> = projectFiles.map(
    (f) => ({
      name: f.path,
      content: f.content,
    }),
  );

  const envMeta = extractEnvMetadata(rootInfo.root);

  const projectContext: Record<string, unknown> = {
    rootPath: rootInfo.root,
    cwd: rootInfo.cwd,
    isGitRepo: rootInfo.isGitRepo,
    launchedFromSubdirectory: rootInfo.isSubdirectory,
    projectType: workspace.projectType,
    language: workspace.language,
    framework: workspace.framework,
    packageManager: workspace.packageManager,
    hasTests: workspace.hasTests,
    hasDocker: workspace.hasDocker,
    hasCI: workspace.hasCI,
  };
  if (envMeta) {
    projectContext.integrations = envMeta.integrations;
  }

  let gitContextPrefix = "";
  if (options.gitDiff) {
    const gitCtx = collectGitContext(rootInfo.root);
    if (gitCtx?.diff) {
      gitContextPrefix = formatGitContextForPrompt(gitCtx);
      console.log(
        st.dim(`  Loaded git diff (branch: ${gitCtx.branch || "unknown"})`),
      );
    }
  }

  let ticketPrefix = "";
  if (options.ticket) {
    try {
      const ticket = await fetchTicket(options.ticket);
      if (ticket) {
        ticketPrefix = formatTicketForPrompt(ticket);
        console.log(
          st.dim(`  Loaded ticket: ${ticket.identifier} — ${ticket.title}`),
        );
      } else {
        console.log(
          st.dim(
            `  Could not fetch ticket ${options.ticket} (check LINEAR_API_KEY)`,
          ),
        );
      }
    } catch {
      console.log(st.dim(`  Could not fetch ticket ${options.ticket}`));
    }
  }

  if (files.length > 0) {
    console.log(
      st.dim(
        `  Loaded ${scanResult.manifest.loaded} context files (${(
          scanResult.manifest.loadedBytes / 1024
        ).toFixed(1)} KB)`,
      ),
    );
    console.log(
      st.dim(
        `  Skipped — secret:${scanResult.manifest.skipped.secret} binary:${scanResult.manifest.skipped.binary} payload-limit:${scanResult.manifest.skipped["payload-limit"]} skip-rule:${scanResult.manifest.skipped["skip-rule"]}`,
      ),
    );
  } else {
    console.log(
      st.dim("  No readable context files loaded from project root."),
    );
  }
  if (envMeta?.integrations.length) {
    console.log(
      st.dim(`  Detected integrations: ${envMeta.integrations.join(", ")}`),
    );
  }

  return {
    files,
    projectFiles,
    projectContext,
    gitContextPrefix,
    ticketPrefix,
    rootPath: rootInfo.root,
    contextManifest: scanResult.manifest,
  };
}
