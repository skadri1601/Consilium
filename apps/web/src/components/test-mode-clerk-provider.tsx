"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

/**
 * Wrapper for ClerkProvider that handles test mode
 * In test mode, we still render ClerkProvider but rely on middleware bypass
 * to prevent authentication requirements
 */
export function TestModeClerkProvider({ children }: { children: ReactNode }) {
  // Always render ClerkProvider - the middleware bypass handles test mode
  // ClerkProvider needs to be present for Clerk hooks to work
  // The middleware bypass prevents server-side redirects,
  // and we rely on components handling missing auth gracefully
  return <ClerkProvider>{children}</ClerkProvider>;
}
