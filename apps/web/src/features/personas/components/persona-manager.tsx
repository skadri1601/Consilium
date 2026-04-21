"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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
    if (!confirm("Are you sure you want to delete this persona? ")) return;

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Custom Agent Personas</h1>
        <p className="text-muted-foreground">
          Create custom personas to give agents unique perspectives
        </p>
      </div>

      {/* Create/Edit Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingId ? "Edit Persona" : "Create New Persona"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Security Expert"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this persona"
            />
          </div>
          <div>
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Define the persona's perspective and expertise..."
              rows={6}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Create"} Persona
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => {
                setEditingId(null);
                setFormData({ name: "", description: "", systemPrompt: "" });
              }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personas List */}
      <div className="space-y-4">
        {personas.map((persona) => (
          <Card key={persona.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{persona.name}</CardTitle>
                  {persona.description && (
                    <CardDescription>{persona.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(persona.id);
                      setFormData({
                        name: persona.name,
                        description: persona.description || "",
                        systemPrompt: persona.systemPrompt,
                      });
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(persona.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {persona.systemPrompt}
              </p>
            </CardContent>
          </Card>
        ))}

        {personas.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No personas yet. Create your first custom persona!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

