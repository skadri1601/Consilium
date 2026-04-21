"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export function PostHogProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!key || initialized.current) return;
    initialized.current = true;

    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
      });
    });
  }, []);

  return <>{children}</>;
}
