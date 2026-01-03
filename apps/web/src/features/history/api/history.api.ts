import { apiClient } from "@/shared/lib/api-client";
import type { Conversation, ConversationDetail } from "../types/history.types";

export const historyApi = {
  getAll: async (): Promise<Conversation[]> => {
    return apiClient.get<Conversation[]>("/api/v1/conversations");
  },

  getById: async (id: string): Promise<ConversationDetail> => {
    return apiClient.get<ConversationDetail>(`/api/v1/conversations/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/v1/conversations/${id}`);
  },
};
