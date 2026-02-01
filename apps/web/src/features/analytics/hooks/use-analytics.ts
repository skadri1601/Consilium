"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";

export function useAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => analyticsApi.getStats(),
  });

  return {
    stats: data,
    isLoading,
    error: error?.message,
  };
}

export function useUsageHistory(days: number = 30) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "usage", days],
    queryFn: () => analyticsApi.getUsageHistory(days),
  });

  return {
    usageHistory: data,
    isLoading,
    error: error?.message,
  };
}

export function useCostByModel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "costs"],
    queryFn: () => analyticsApi.getCostByModel(),
  });

  return {
    costByModel: data,
    isLoading,
    error: error?.message,
  };
}
