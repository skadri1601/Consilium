/**
 * @deprecated For agent/mode preferences, use `useUserPreferences` from
 * `@/shared/hooks/use-user-preferences` instead. Those are now stored in
 * Clerk's unsafeMetadata for cross-device sync.
 *
 * This store is retained only for the `theme` preference (a local UI concern).
 */
import { create } from "zustand";

interface UserState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: UserState["theme"]) => void;
}

export const useUserStore = create<UserState>((set) => ({
  theme: "dark",

  setTheme: (theme) => set({ theme }),
}));
