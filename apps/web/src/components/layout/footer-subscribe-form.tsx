"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type SubscribeStatus = "idle" | "loading" | "success" | "error";

export function FooterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}) as { error?: string });
        throw new Error(data.error ?? "Failed to subscribe");
      }
      setStatus("success");
      setMessage("Thanks - you're on the list.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center rounded-full border border-neutral-800 bg-neutral-900/60 p-1 transition-colors focus-within:border-indigo-500/60"
      >
        <label htmlFor="footer-subscribe-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-subscribe-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="youremail@domain.com"
          className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-md transition-all hover:from-indigo-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="sr-only">Subscribing</span>
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </form>
      <p className="mt-3 text-xs leading-relaxed text-neutral-400">
        By signing up you agree to our{" "}
        <Link
          href="/terms"
          className="text-indigo-400 underline-offset-2 hover:underline"
        >
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-indigo-400 underline-offset-2 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
      {message ? (
        <p
          role="status"
          className={`mt-2 text-xs ${
            status === "success"
              ? "text-emerald-400"
              : status === "error"
                ? "text-red-400"
                : "text-neutral-400"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
