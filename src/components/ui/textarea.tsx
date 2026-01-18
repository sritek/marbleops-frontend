import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error message to display */
  error?: string;
}

/**
 * Textarea component
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[80px] w-full rounded-lg",
          "border border-border-subtle bg-bg-surface",
          "px-3 py-2 text-sm text-text-primary",
          // Placeholder
          "placeholder:text-text-muted",
          // Focus state
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0",
          "focus-visible:border-primary-600",
          // Error state
          error &&
            "border-error focus-visible:border-error focus-visible:outline-error",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-muted",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
