"use client";

import { CouncilChat } from "@/features/council/components/council-chat";

export default function CouncilPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Council</h1>
      <CouncilChat />
    </div>
  );
}
