"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { CreateAgentInput } from "../types/agents.types";

interface AgentFormProps {
  onSubmit: (data: CreateAgentInput) => void;
  isLoading?: boolean;
}

export function AgentForm({ onSubmit, isLoading }: AgentFormProps) {
  const [formData, setFormData] = useState<CreateAgentInput>({
    name: "",
    provider: "openai",
    modelId: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Agent</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="GPT-4o-mini"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Provider</label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              className="w-full rounded-md border p-2"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="groq">Groq</option>
              <option value="xai">xAI</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Model ID</label>
            <Input
              value={formData.modelId}
              onChange={(e) =>
                setFormData({ ...formData, modelId: e.target.value })
              }
              placeholder="gpt-4o-mini"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Description (optional)
            </label>
            <Input
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Fast and cost-effective model"
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Agent"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
