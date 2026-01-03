export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateConversationRequest {
  title?: string;
  agents: string[];
  mode: "blind" | "visible";
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface CouncilQueryRequest {
  query: string;
  agents: string[];
  mode: "blind" | "visible";
}
