"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useCouncilStore } from "../store/council.store";
import { AgentSelector } from "./agent-selector";
import { cn } from "@/shared/lib/utils";

export function CouncilChat() {
  const [input, setInput] = useState("");
  const { messages, selectedAgents, addMessage, isLoading } = useCouncilStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    addMessage({ role: "user", content: input });
    setInput("");

    // TODO: Implement actual API call to backend
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Agent Selection */}
      <AgentSelector />

      {/* Chat Interface */}
      <Card className="flex flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col p-4">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Start a conversation with the AI Council
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the council..."
              disabled={isLoading || selectedAgents.length === 0}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim() || selectedAgents.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
