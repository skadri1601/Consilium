"use client";

import { useState, useEffect } from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Trash2, Edit } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  isDefault: boolean;
}

export function PersonaManager() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
  });

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await fetch("/api/personas");
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error("Failed to fetch personas: ", error);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/personas/${editingId}` : "/api/personas";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPersonas();
        setEditingId(null);
        setFormData({ name: "", description: "", systemPrompt: "" });
      }
    } catch (error) {
      console.error("Failed to save persona: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this persona?")) return;

    try {
      const response = await fetch(`/api/personas/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPersonas();
      }
    } catch (error) {
      console.error("Failed to delete persona: ", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="eyebrow mb-2">Voice</div>
        <h1 className="font-display text-[40px] tracking-[-0.02em] text-ink-primary font-light">
          Custom <em className="text-warm italic">personas</em>
        </h1>
        <p className="text-[14px] text-ink-secondary mt-2">
          Craft distinct perspectives for council members — security, legal,
          product, skeptic.
        </p>
      </div>

      <div className="surface-card p-5 mb-6">
        <div className="mb-4">
          <div className="eyebrow">Editor</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-ink-primary mt-1">
            {editingId ? "Edit persona" : "New persona"}
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="name"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary"
            >
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Security Expert"
              className="mt-1.5 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
            />
          </div>
          <div>
            <Label
              htmlFor="description"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary"
            >
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this persona"
              className="mt-1.5 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
            />
          </div>
          <div>
            <Label
              htmlFor="systemPrompt"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary"
            >
              System prompt
            </Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData({ ...formData, systemPrompt: e.target.value })
              }
              placeholder="Define the persona's perspective and expertise..."
              rows={6}
              className="mt-1.5 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn-consilium btn-consilium-primary"
            >
              {editingId ? "Update persona" : "Create persona"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", description: "", systemPrompt: "" });
                }}
                className="btn-consilium btn-consilium-ghost"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {personas.map((persona) => (
          <div key={persona.id} className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-[18px] tracking-[-0.01em] text-ink-primary">
                  {persona.name}
                  {persona.isDefault && (
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.08em] text-warm bg-warm/12 border border-warm/30 rounded-full px-2 py-0.5 align-middle">
                      Default
                    </span>
                  )}
                </h3>
                {persona.description && (
                  <p className="text-[13px] text-ink-tertiary mt-1">
                    {persona.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(persona.id);
                    setFormData({
                      name: persona.name,
                      description: persona.description || "",
                      systemPrompt: persona.systemPrompt,
                    });
                  }}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-ink-tertiary hover:text-warm hover:bg-warm/10 transition-colors"
                  aria-label="Edit persona"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(persona.id)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-ink-tertiary hover:text-dissent hover:bg-dissent/10 transition-colors"
                  aria-label="Delete persona"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-[10px] border border-white/[0.06] bg-bg-1 p-3">
              <p className="text-[13px] text-ink-secondary whitespace-pre-wrap leading-[1.65]">
                {persona.systemPrompt}
              </p>
            </div>
          </div>
        ))}

        {personas.length === 0 && (
          <div className="surface-card p-10 text-center">
            <p className="text-[14px] text-ink-tertiary">
              No personas yet. Create your first custom voice above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
