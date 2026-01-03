import { create } from "zustand";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId?: string;
  timestamp: Date;
}

interface CouncilState {
  messages: Message[];
  selectedAgents: string[];
  mode: "blind" | "visible";
  isLoading: boolean;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  clearMessages: () => void;
  setSelectedAgents: (agents: string[]) => void;
  toggleAgent: (agentId: string) => void;
  setMode: (mode: "blind" | "visible") => void;
  setLoading: (loading: boolean) => void;
}

export const useCouncilStore = create<CouncilState>((set) => ({
  messages: [],
  selectedAgents: ["gpt-4o-mini", "claude-3-5-haiku", "gemini-2.0-flash"],
  mode: "visible",
  isLoading: false,

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
}));
