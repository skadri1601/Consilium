"use client";

import { useState } from "react";
import { Input } from "@/shared/components/ui/input";
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
    <div className="surface-card p-5">
      <div className="mb-4">
        <div className="eyebrow">Custom</div>
        <h2 className="font-display text-[22px] tracking-[-0.01em] text-ink-primary mt-1">
          Add new agent
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Name
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="GPT-4o-mini"
            required
            className="mt-1.5 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
          />
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Provider
          </label>
          <select
            value={formData.provider}
            onChange={(e) =>
              setFormData({ ...formData, provider: e.target.value })
            }
            className="mt-1.5 w-full rounded-[10px] border border-white/[0.08] bg-bg-1 px-3 py-2 text-[13px] text-ink-primary focus-visible:outline-none focus-visible:border-warm/40"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
            <option value="groq">Groq</option>
            <option value="xai">xAI</option>
          </select>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Model ID
          </label>
          <Input
            value={formData.modelId}
            onChange={(e) =>
              setFormData({ ...formData, modelId: e.target.value })
            }
            placeholder="gpt-4o-mini"
            required
            className="mt-1.5 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
          />
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Description (optional)
          </label>
          <Input
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Fast and cost-effective model"
            className="mt-1.5 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-consilium btn-consilium-primary"
        >
          {isLoading ? "Adding…" : "Add agent"}
        </button>
      </form>
    </div>
  );
}
