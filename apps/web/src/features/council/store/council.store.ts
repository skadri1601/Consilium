import { create } from "zustand";
import type { CouncilMessage, CouncilMode } from "../types/council.types";
import { AGENTS } from "@/shared/lib/constants";

const DEPRECATED_MODEL_MAP: Record<string, string> = {
  "llama-3.1-70b-versatile": "llama-3.3-70b-versatile",
};

const VALID_AGENT_IDS = new Set<string>(AGENTS.map((a) => a.id));

function sanitizeAgentIds(ids: string[]): string[] {
  return ids
    .map((id) => DEPRECATED_MODEL_MAP[id] || id)
    .filter((id) => VALID_AGENT_IDS.has(id));
}

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
  loadDefaults: (prefs: {
    defaultAgents: string[];
    defaultMode: CouncilMode;
  }) => void;
}

export const useCouncilStore = create<CouncilState>((set, get) => ({
  messages: [],
  selectedAgents: [],
  mode: "council",
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
    if (get()._defaultsLoaded) return;
    const mode =
      prefs.defaultMode === ("visible" as string)
        ? "council"
        : prefs.defaultMode;
    set({
      selectedAgents: sanitizeAgentIds(prefs.defaultAgents),
      mode: mode as CouncilMode,
      _defaultsLoaded: true,
    });
  },
}));
