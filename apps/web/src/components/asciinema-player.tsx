"use client";

import { useEffect, useRef } from "react";

/**
 * Lazy-loaded asciinema player. Imports the asciinema-player runtime
 * from a CDN at mount time so we don't bloat the main bundle. Falls
 * back to a static <pre> message if the script can't load (offline,
 * CSP block, etc.).
 *
 * Recording instructions live at docs/distribution/demo-script.md.
 */

interface AsciinemaPlayerProps {
  src: string;
  cols?: number;
  rows?: number;
  autoPlay?: boolean;
  loop?: boolean;
  preload?: boolean;
  idleTimeLimit?: number;
  poster?: string;
  speed?: number;
  className?: string;
}

const ASCIINEMA_PLAYER_VERSION = "3.7.1";
const ASCIINEMA_JS = `https://cdn.jsdelivr.net/npm/asciinema-player@${ASCIINEMA_PLAYER_VERSION}/dist/bundle/asciinema-player.min.js`;
const ASCIINEMA_CSS = `https://cdn.jsdelivr.net/npm/asciinema-player@${ASCIINEMA_PLAYER_VERSION}/dist/bundle/asciinema-player.css`;

declare global {
  interface Window {
    AsciinemaPlayer?: {
      create: (
        src: string,
        target: HTMLElement,
        opts?: Record<string, unknown>,
      ) => { dispose: () => void };
    };
  }
}

let injectedStyle = false;
let scriptPromise: Promise<void> | null = null;

function ensureStyle(): void {
  if (typeof document === "undefined" || injectedStyle) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = ASCIINEMA_CSS;
  document.head.appendChild(link);
  injectedStyle = true;
}

function ensureScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.AsciinemaPlayer) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = ASCIINEMA_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load asciinema-player"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function AsciinemaPlayer({
  src,
  cols = 100,
  rows = 30,
  autoPlay = true,
  loop = true,
  preload = true,
  idleTimeLimit = 1.5,
  poster,
  speed = 1.0,
  className,
}: AsciinemaPlayerProps): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const fallbackRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let instance: { dispose: () => void } | null = null;

    ensureStyle();
    ensureScript()
      .then(() => {
        if (disposed || !ref.current || !window.AsciinemaPlayer) return;
        instance = window.AsciinemaPlayer.create(src, ref.current, {
          cols,
          rows,
          autoPlay,
          loop,
          preload,
          idleTimeLimit,
          poster,
          speed,
        });
        if (fallbackRef.current) fallbackRef.current.style.display = "none";
      })
      .catch(() => {
        // Fallback stays visible. Nothing else to do.
      });

    return () => {
      disposed = true;
      if (instance) {
        try {
          instance.dispose();
        } catch {
          /* ignore */
        }
      }
    };
  }, [src, cols, rows, autoPlay, loop, preload, idleTimeLimit, poster, speed]);

  return (
    <div className={className}>
      <div ref={ref} aria-label="Consilium council demo" />
      <pre
        ref={fallbackRef}
        className="text-sm text-muted-foreground bg-card rounded-md p-4 overflow-auto"
      >
        {`$ consilium debate "Should we use Postgres or Neon?"

  Consilium · multi-agent council
  Loaded 47 context files (412 KB)
  Attached git context (branch: main — no uncommitted changes)
  Loaded project memory (3 prior debates)

  Claude Sonnet 4.6  analyzing…
  GPT-5.4            analyzing…
  Gemini 3.1 Pro     analyzing…

  ✓ Round 1 complete (3 proposals)
  ✓ Cross-examination (convergence 81%)
  ✓ Synthesis

  Golden prompt:
  Use Neon for serverless scaling and zero ops overhead.
  Trade-off: vendor lock-in and a moderate per-query latency
  penalty vs self-hosted Postgres on the same VPC.

  ✓ Debate complete. $0.0431 · 5,421 tokens`}
      </pre>
    </div>
  );
}

export default AsciinemaPlayer;
