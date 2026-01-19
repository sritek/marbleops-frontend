import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-bg-app text-text-primary border-border-subtle",
  success: "bg-success-bg text-success border-green-200",
  warning: "bg-warning-bg text-warning border-amber-200",
  error: "bg-error-bg text-error border-red-200",
  info: "bg-info-bg text-info border-sky-200",
  accent: "bg-primary-100 text-primary-700 border-blue-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant */
  variant?: keyof typeof badgeVariants;
}

/**
 * Badge component for status indicators
 *
 * @example
 * <Badge variant="success">Paid</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Overdue</Badge>
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full",
          "border px-2.5 py-0.5",
          "text-xs font-medium",
          "capitalize",
          badgeVariants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
