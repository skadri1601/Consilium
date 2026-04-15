"use client";

import type { ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PostHogClientProvider } from "posthog-js/react";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

const g = globalThis as typeof globalThis & { __consiliumPosthogInit?: boolean };

if (typeof globalThis.window !== "undefined" && key && !g.__consiliumPosthogInit) {
  g.__consiliumPosthogInit = true;
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export function PostHogProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  if (!key) {
    return <>{children}</>;
  }

  return (
    <PostHogClientProvider client={posthog}>{children}</PostHogClientProvider>
  );
}
