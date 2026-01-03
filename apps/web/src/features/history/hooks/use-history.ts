"use client";

import { useQuery } from "@tanstack/react-query";
import { historyApi } from "../api/history.api";

export function useHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => historyApi.getAll(),
  });

  return {
    conversations: data,
    isLoading,
    error: error?.message,
  };
}

export function useConversation(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations", id],
    queryFn: () => historyApi.getById(id),
    enabled: !!id,
  });

  return {
    conversation: data,
    isLoading,
    error: error?.message,
  };
}
