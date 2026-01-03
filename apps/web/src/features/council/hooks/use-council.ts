"use client";

import { useState, useCallback } from "react";
import { useCouncilStore } from "../store/council.store";
import { councilApi } from "../api/council.api";

export function useCouncil() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedAgents, mode, addMessage, setLoading } = useCouncilStore();

  const sendQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || selectedAgents.length === 0) return;

      setIsLoading(true);
      setLoading(true);
      setError(null);

      try {
        addMessage({ role: "user", content: query });

        const response = await councilApi.query({
          query,
          agents: selectedAgents,
          mode,
        });

        // Handle responses from each agent
        if (response.responses) {
          response.responses.forEach((agentResponse) => {
            if (agentResponse.success) {
              addMessage({
                role: "assistant",
                content: agentResponse.content,
                agentId: agentResponse.agentId,
              });
            }
          });
        }

        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send query";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    },
    [selectedAgents, mode, addMessage, setLoading]
  );

  return {
    sendQuery,
    isLoading,
    error,
  };
}
