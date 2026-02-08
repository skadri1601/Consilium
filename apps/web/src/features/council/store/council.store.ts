import { create } from "zustand";
import type { CouncilMessage, CouncilMode } from "../types/council.types";

interface CouncilState {
  messages: CouncilMessage[];
  selectedAgents: string[];
  mode: CouncilMode;
  isLoading: boolean;
  _defaultsLoaded: boolean;
  addMessage: (message: Omit<CouncilMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;
  setSelectedAgents: (agents: string[]) => void;
  toggleAgent: (agentId: string) => void;
  setMode: (mode: CouncilMode) => void;
  setLoading: (loading: boolean) => void;
  loadDefaults: (prefs: { defaultAgents: string[]; defaultMode: CouncilMode }) => void;
}

export const useCouncilStore = create<CouncilState>((set, get) => ({
  messages: [],
  selectedAgents: ["gpt-4o-mini", "claude-3-5-haiku-latest", "gemini-2.0-flash"],
  mode: "visible",
  isLoading: false,
  _defaultsLoaded: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),

  setSelectedAgents: (agents) => set({ selectedAgents: agents }),

  toggleAgent: (agentId) =>
    set((state) => ({
      selectedAgents: state.selectedAgents.includes(agentId)
        ? state.selectedAgents.filter((id) => id !== agentId)
        : [...state.selectedAgents, agentId],
    })),

  setMode: (mode) => set({ mode }),

  setLoading: (loading) => set({ isLoading: loading }),

  loadDefaults: (prefs) => {
    // Only load once per session so user selections during a session aren't overwritten
    if (get()._defaultsLoaded) return;
    set({
      selectedAgents: prefs.defaultAgents,
      mode: prefs.defaultMode,
      _defaultsLoaded: true,
    });
  },
}));
