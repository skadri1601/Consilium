import { apiClient } from "@/shared/lib/api-client";
import type { Agent, CreateAgentInput } from "../types/agents.types";

export const agentsApi = {
  getAll: async (): Promise<Agent[]> => {
    return apiClient.get<Agent[]>("/api/v1/agents");
  },

  getById: async (id: string): Promise<Agent> => {
    return apiClient.get<Agent>(`/api/v1/agents/${id}`);
  },

  create: async (data: CreateAgentInput): Promise<Agent> => {
    return apiClient.post<Agent>("/api/v1/agents", data);
  },

  update: async (
    id: string,
    data: Partial<CreateAgentInput>,
  ): Promise<Agent> => {
    return apiClient.put<Agent>(`/api/v1/agents/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/v1/agents/${id}`);
  },
};
