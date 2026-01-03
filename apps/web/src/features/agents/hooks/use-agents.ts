"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentsApi } from "../api/agents.api";
import type { CreateAgentInput } from "../types/agents.types";

export function useAgents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.getAll(),
  });

  return {
    agents: data,
    isLoading,
    error: error?.message,
  };
}

export function useAgent(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents", id],
    queryFn: () => agentsApi.getById(id),
    enabled: !!id,
  });

  return {
    agent: data,
    isLoading,
    error: error?.message,
  };
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgentInput) => agentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
