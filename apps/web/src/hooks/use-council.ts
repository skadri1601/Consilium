"use client";

import { useState, useCallback } from "react";
import { useChat } from "ai/react";

interface Agent {
  id: string;
  name: string;
  provider: string;
}

interface CouncilOptions {
  agents: Agent[];
  mode?: "blind" | "visible";
}

export function useCouncil({ agents, mode = "visible" }: CouncilOptions) {
  const [selectedAgents, setSelectedAgents] = useState<string[]>(
    agents.map((a) => a.id)
  );
  const [isLoading, setIsLoading] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      api: "/api/council/chat",
      body: {
        agents: selectedAgents,
        mode,
      },
    });

  const toggleAgent = useCallback((agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    selectedAgents,
    toggleAgent,
    clearMessages,
  };
}
