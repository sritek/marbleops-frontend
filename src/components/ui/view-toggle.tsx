"use client";

import * as React from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "table";

interface ViewToggleProps {
  /** Current view mode */
  value: ViewMode;
  /** Change handler */
  onChange: (value: ViewMode) => void;
  /** Optional class name */
  className?: string;
}

/**
 * Toggle between grid and table views
 */
export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1",
        "rounded-lg border border-border-subtle bg-bg-app",
        className
      )}
      role="radiogroup"
      aria-label="View mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "grid"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          value === "grid"
            ? "bg-bg-surface text-text-primary shadow-sm"
            : "text-text-muted hover:text-text-primary"
        )}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "table"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          value === "table"
            ? "bg-bg-surface text-text-primary shadow-sm"
            : "text-text-muted hover:text-text-primary"
        )}
        onClick={() => onChange("table")}
      >
        <List className="h-4 w-4" />
        <span className="sr-only">Table view</span>
      </button>
    </div>
  );
}
