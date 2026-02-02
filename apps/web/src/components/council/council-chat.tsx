"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCouncilStore } from "@/stores/council-store";
import { AGENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CouncilChat() {
  const [input, setInput] = useState("");
  const { messages, selectedAgents, toggleAgent, addMessage, isLoading } =
    useCouncilStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    addMessage({ role: "user", content: input });
    setInput("");

    // TODO: Implement actual API call to backend
    // This is a placeholder for the council chat functionality
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Agent Selection */}
      <Card className="w-64 shrink-0">
        <CardHeader>
          <CardTitle className="text-lg">Select Agents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                selectedAgents.includes(agent.id)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              )}
            >
              <p className="font-medium">{agent.name}</p>
              <p className="text-xs text-muted-foreground">{agent.provider}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="flex flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col p-4">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Start a conversation with the council
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
