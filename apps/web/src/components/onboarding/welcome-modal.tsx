"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle>Welcome to Consilium!</DialogTitle>
          </div>
          <DialogDescription>
            Get better prompts for your AI coding assistant through multi-agent debate
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <h3 className="font-semibold">How it works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Describe what you want to build</li>
              <li>Multiple AI models debate and refine the approach</li>
              <li>Get a synthesized "Golden Prompt" ready to use</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Try these sample prompts:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• "Build a REST API with authentication using Node.js and PostgreSQL"</li>
              <li>• "Create a React dashboard with real-time data updates"</li>
              <li>• "Design a database schema for an e-commerce platform"</li>
            </ul>
          </div>
          <div className="flex gap-2 pt-4">
            <Button asChild className="flex-1">
              <Link href="/council" onClick={onClose}>
                Start Your First Debate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Explore First
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

