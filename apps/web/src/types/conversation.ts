import type { Agent, AgentResponse } from "./agent";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentId?: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agents: Agent[];
  mode: "blind" | "visible";
  createdAt: Date;
  updatedAt: Date;
}

export interface CouncilSession {
  id: string;
  query: string;
  responses: AgentResponse[];
  consensusScore?: number;
  selectedResponseId?: string;
  mode: "blind" | "visible";
  createdAt: Date;
}
