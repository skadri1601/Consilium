"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDate } from "@/shared/lib/utils";
import type { Conversation } from "../types/history.types";

interface ConversationCardProps {
  conversation: Conversation;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  return (
    <Link href={`/history/${conversation.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-accent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{conversation.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{conversation.messageCount} messages</span>
            <span>{formatDate(conversation.updatedAt)}</span>
          </div>
          {conversation.lastMessage && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {conversation.lastMessage}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
