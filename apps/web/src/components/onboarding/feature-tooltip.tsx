"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

interface FeatureTooltipProps {
  content: string;
  children?: React.ReactNode;
}

export function FeatureTooltip({ content, children }: FeatureTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        )}
      </PopoverTrigger>
      <PopoverContent className="max-w-xs">
        <p className="text-sm">{content}</p>
      </PopoverContent>
    </Popover>
  );
}

// Also export as default for compatibility
export default FeatureTooltip;

