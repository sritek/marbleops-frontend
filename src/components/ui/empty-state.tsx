import * as React from "react";
import { cn } from "@/lib/utils";
import { Package, type LucideIcon } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main message */
  title: string;
  /** Helper text */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
}

/**
 * Empty state component for lists and tables
 *
 * @example
 * <EmptyState
 *   title="No inventory items"
 *   description="Get started by adding your first item"
 *   actionLabel="Add Item"
 *   onAction={() => router.push('/inventory/new')}
 * />
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon = Package,
      title,
      description,
      actionLabel,
      onAction,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center",
          "py-12 px-6 text-center",
          className
        )}
        {...props}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-muted mb-4">
          <Icon className="h-8 w-8 text-text-muted" aria-hidden="true" />
        </div>

        <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>

        {description && (
          <p className="text-sm text-text-muted max-w-sm">{description}</p>
        )}

        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-4">
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
