export type DebateStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "deleted"
  | "cancelled"
  | "archived";

export const DEBATE_STATUSES: readonly DebateStatus[] = [
  "pending",
  "processing",
  "completed",
  "failed",
  "deleted",
  "cancelled",
  "archived",
] as const;
