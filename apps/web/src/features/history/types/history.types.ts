export interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessage?: string;
  mode: "blind" | "visible";
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentId?: string;
  createdAt: Date;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}
