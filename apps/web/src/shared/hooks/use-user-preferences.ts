"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

export interface UserPreferences {
  defaultAgents: string[];
  defaultMode: "blind" | "visible";
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultAgents: ["gpt-4o-mini", "claude-3-5-haiku-latest", "gemini-2.0-flash"],
  defaultMode: "visible",
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

    const meta = user.unsafeMetadata as Partial<UserPreferences>;

    return {
      defaultAgents:
        Array.isArray(meta.defaultAgents) && meta.defaultAgents.length > 0
          ? meta.defaultAgents
          : DEFAULT_PREFERENCES.defaultAgents,
      defaultMode:
        meta.defaultMode === "blind" || meta.defaultMode === "visible"
          ? meta.defaultMode
          : DEFAULT_PREFERENCES.defaultMode,
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
    [user, preferences]
  );

  return {
    preferences,
    updatePreferences,
    isLoaded,
  };
}
