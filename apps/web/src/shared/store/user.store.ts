import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserPreferences {
  theme: "light" | "dark" | "system";
  defaultAgents: string[];
  defaultMode: "blind" | "visible";
}

interface UserState {
  preferences: UserPreferences;
  setTheme: (theme: UserPreferences["theme"]) => void;
  setDefaultAgents: (agents: string[]) => void;
  setDefaultMode: (mode: UserPreferences["defaultMode"]) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: {
        theme: "system",
        defaultAgents: ["gpt-4o-mini", "claude-3-5-haiku", "gemini-2.0-flash"],
        defaultMode: "visible",
      },

      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),

      setDefaultAgents: (agents) =>
        set((state) => ({
          preferences: { ...state.preferences, defaultAgents: agents },
        })),

      setDefaultMode: (mode) =>
        set((state) => ({
          preferences: { ...state.preferences, defaultMode: mode },
        })),
    }),
    {
      name: "consilium-user-preferences",
    }
  )
);
