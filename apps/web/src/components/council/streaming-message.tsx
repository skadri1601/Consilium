"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
  agentName?: string;
  className?: string;
}

export function StreamingMessage({
  content,
  isStreaming = false,
  agentName,
  className,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState("");

  useEffect(() => {
    if (isStreaming) {
      setDisplayedContent(content);
    } else {
      // When not streaming, show full content immediately
      setDisplayedContent(content);
    }
  }, [content, isStreaming]);

  return (
    <div className={cn("rounded-lg bg-muted p-4", className)}>
      {agentName && (
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {agentName}
        </p>
      )}
      <p className="whitespace-pre-wrap">
        {displayedContent}
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-primary" />
        )}
      </p>
    </div>
  );
}
