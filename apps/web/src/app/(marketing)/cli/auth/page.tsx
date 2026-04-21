"use client";

import { useEffect, useState } from "react";
import { useUser, SignIn } from "@clerk/nextjs";
import { Terminal, Copy, Loader2, CheckCircle2 } from "lucide-react";

export default function CliAuthPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const generateToken = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/api-keys/cli-token", {
          method: "POST",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to generate token");
        }
        setToken(data.token);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate token"
        );
      } finally {
        setLoading(false);
      }
    };

    generateToken();
  }, [isLoaded, isSignedIn]);

  const copyToClipboard = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-ink-tertiary" />
      </div>
    );
  }

  return (
    <div>
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5 inline-flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5" /> CLI · Authentication
          </div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Pair your <em>terminal</em>
            <br />
            with the council.
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-secondary">
            {isSignedIn
              ? "Generate a long-lived CLI token. Paste it back into your terminal to finish setup."
              : "Sign in to generate a CLI authentication token for the Consilium command-line tool."}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-narrow max-w-[620px]">
          {!isSignedIn ? (
            <div className="rounded-2xl border border-white/[0.08] bg-bg-1 p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
              <SignIn
                appearance={{
                  variables: {
                    colorPrimary: "#d4a574",
                    colorBackground: "#141310",
                    colorText: "#f5efe5",
                    colorTextSecondary: "#a9a29a",
                    colorInputBackground: "#1c1a17",
                    colorInputText: "#f5efe5",
                    borderRadius: "8px",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none p-0 border-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    formButtonPrimary:
                      "bg-warm hover:bg-warm-bright text-bg-0 font-medium",
                    footer: "hidden",
                  },
                }}
                fallbackRedirectUrl="/cli/auth"
              />
            </div>
          ) : (
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">
                  CLI token
                </div>
                {token && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full bg-agree/14 text-agree">
                    Ready
                  </span>
                )}
              </div>
              <div className="text-[13px] text-ink-secondary mb-5">
                Signed in as{" "}
                <span className="text-ink-primary">
                  {user?.primaryEmailAddress?.emailAddress ?? user?.fullName}
                </span>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-ink-tertiary" />
                </div>
              )}

              {error && (
                <div className="rounded-md border border-dissent/30 bg-dissent/14 p-3 text-[13px] text-dissent">
                  {error}
                </div>
              )}

              {token && (
                <>
                  <pre className="rounded-md bg-bg-2 border border-white/[0.08] p-4 font-mono text-[12px] text-ink-primary break-all select-all leading-relaxed whitespace-pre-wrap">
                    {token}
                  </pre>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="btn-consilium btn-consilium-primary btn-consilium-lg mt-4 w-full justify-center"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-bg-0" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to clipboard
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-center text-[13px] text-ink-secondary">
                    Paste this token in your terminal to complete setup.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
