import { apiClient } from "@/shared/lib/api-client";
import type { AnalyticsStats, UsageRecord } from "../types/analytics.types";

export const analyticsApi = {
  getStats: async (): Promise<AnalyticsStats> => {
    return apiClient.get<AnalyticsStats>("/api/v1/analytics/stats");
  },

  getUsageHistory: async (days: number): Promise<UsageRecord[]> => {
    return apiClient.get<UsageRecord[]>(`/api/v1/analytics/usage?days=${days}`);
  },

  getCostByModel: async (): Promise<Record<string, number>> => {
    return apiClient.get<Record<string, number>>("/api/v1/analytics/costs");
  },
};
