import { apiClient } from "@/shared/lib/api-client";
import type { CouncilQueryRequest, CouncilQueryResponse } from "../types/council.types";

export const councilApi = {
  query: async (request: CouncilQueryRequest): Promise<CouncilQueryResponse> => {
    return apiClient.post<CouncilQueryResponse>("/api/v1/council/query", request);
  },

  getSession: async (sessionId: string) => {
    return apiClient.get(`/api/v1/council/session/${sessionId}`);
  },

  streamUrl: (sessionId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return `${baseUrl}/api/v1/council/stream/${sessionId}`;
  },
};
