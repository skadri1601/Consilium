import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DEFAULT_API_ORIGIN, loadConfig } from "../utils/config.js";
import { SessionManager } from "../utils/session-manager.js";
import { style } from "../utils/visual-system.js";

const st = style();

export interface ShareCommandOptions {
  public?: boolean;
}

interface ShareResponse {
  url?: string;
  shareId?: string;
  public?: boolean;
}

function localExportPath(sessionId: string): string {
  return path.resolve(process.cwd(), `.consilium-session-${sessionId}.json`);
}

function exportSessionLocally(sessionId: string): string | null {
  const sessionDir = path.join(os.homedir(), ".consilium", "sessions");
  const manager = new SessionManager(sessionDir);
  let session;
  try {
    session = manager.loadSession(sessionId);
  } catch {
    return null;
  }
  const data = session.toJSON();
  const outPath = localExportPath(sessionId);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  return outPath;
}

export async function shareCommand(
  sessionId: string,
  opts: ShareCommandOptions = {},
): Promise<void> {
  const config = loadConfig();
  const apiUrl = (config.apiUrl ?? DEFAULT_API_ORIGIN).replace(/\/$/, "");
  const isPublic = opts.public ?? false;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  let res: Response | null = null;
  let networkError = false;
  try {
    res = await fetch(`${apiUrl}/api/v1/sessions/${sessionId}/share`, {
      method: "POST",
      headers,
      body: JSON.stringify({ public: isPublic }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    networkError = true;
  }

  if (!networkError && res && res.ok) {
    let body: ShareResponse = {};
    try {
      body = (await res.json()) as ShareResponse;
    } catch {
      body = {};
    }
    const url = body.url;
    const shareId = body.shareId ?? sessionId;
    console.log(st.success(`Shared session ${sessionId}`));
    if (url) console.log(st.dim(`  ${url}`));
    else console.log(st.dim(`  share id: ${shareId}`));
    if (isPublic) console.log(st.dim("  visibility: public"));
    else console.log(st.dim("  visibility: link-only"));
    return;
  }

  const exported = exportSessionLocally(sessionId);
  if (!exported) {
    console.log(
      st.error(
        `Session ${sessionId} not found locally and share endpoint unavailable.`,
      ),
    );
    console.log(
      st.dim(
        "  Backend share endpoint not yet implemented. Once available, this command will POST to /api/v1/sessions/<id>/share.",
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    st.warning(
      "Share endpoint not available - exported session to local JSON instead.",
    ),
  );
  console.log(st.dim(`  ${exported}`));
  console.log(
    st.dim(
      "  Local-export fallback: send this file to a collaborator who can run `consilium sessions resume`.",
    ),
  );
}
