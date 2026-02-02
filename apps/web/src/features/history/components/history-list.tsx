"use client";

import { ConversationCard } from "./conversation-card";
import { useHistory } from "../hooks/use-history";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function HistoryList() {
  const { conversations, isLoading, error } = useHistory();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        Failed to load history: {error}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No conversations yet. Start a debate from the Council.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <ConversationCard key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}
