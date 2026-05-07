"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

import type { CouncilMode } from "@/features/council/types/council.types";

export interface UserPreferences {
  defaultAgents: string[];
  defaultMode: CouncilMode;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultAgents: [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "llama-3.1-8b-instant",
  ],
  defaultMode: "council",
};

/**
 * Hook that reads/writes user preferences from Clerk's `unsafeMetadata`.
 * This replaces the old localStorage-based Zustand store for cross-device sync.
 *
 * Falls back to sensible defaults when metadata is empty (e.g. pre-existing users).
 */
export function useUserPreferences() {
  const { user, isLoaded } = useUser();

  const preferences: UserPreferences = useMemo(() => {
    if (!user?.unsafeMetadata) {
      return DEFAULT_PREFERENCES;
    }

    const meta = user.unsafeMetadata as Record<string, unknown>;

    const rawMode = meta.defaultMode as string | undefined;
    const VALID_MODES = new Set([
      "quick",
      "council",
      "deep",
      "blind",
      "redteam",
      "jury",
      "market",
      "auto",
    ]);
    const resolvedMode = (
      rawMode === "visible"
        ? "council"
        : rawMode && VALID_MODES.has(rawMode)
          ? rawMode
          : DEFAULT_PREFERENCES.defaultMode
    ) as CouncilMode;

    return {
      defaultAgents:
        Array.isArray(meta.defaultAgents) && meta.defaultAgents.length > 0
          ? (meta.defaultAgents as string[])
          : DEFAULT_PREFERENCES.defaultAgents,
      defaultMode: resolvedMode,
    };
  }, [user?.unsafeMetadata]);

  const updatePreferences = useCallback(
    async (partial: Partial<UserPreferences>) => {
      if (!user) {
        throw new Error("Cannot update preferences: user not loaded");
      }

      const merged: UserPreferences = {
        ...preferences,
        ...partial,
      };

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          ...merged,
        },
      });
    },
    [user, preferences],
  );

  return {
    preferences,
    updatePreferences,
    isLoaded,
  };
}
