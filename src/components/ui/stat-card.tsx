import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { Card } from "./card";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main label */
  title: string;
  /** Primary value to display */
  value: string | number;
  /** Optional sub-value or description */
  description?: string;
  /** Trend direction (up = positive, down = negative) */
  trend?: "up" | "down" | "neutral";
  /** Trend percentage change */
  trendValue?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Stat Card for dashboard metrics
 *
 * @example
 * <StatCard
 *   title="Today's Sales"
 *   value="₹1,23,456"
 *   description="12 orders"
 *   trend="up"
 *   trendValue="+12%"
 *   icon={DollarSign}
 * />
 */
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      description,
      trend,
      trendValue,
      icon: Icon,
      isLoading,
      ...props
    },
    ref
  ) => {
    if (isLoading) {
      return (
        <Card ref={ref} className={cn("p-4 md:p-6", className)} {...props}>
          <div className="space-y-2">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-8 w-32 skeleton rounded" />
            <div className="h-4 w-20 skeleton rounded" />
          </div>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn("p-3 sm:p-4 md:p-6", className)} {...props}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-text-muted truncate">{title}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary truncate">{value}</p>
            {(description || trendValue) && (
              <div className="flex items-center gap-2 flex-wrap">
                {trend && trendValue && (
                  <span
                    className={cn(
                      "flex items-center text-xs font-medium",
                      trend === "up" && "text-success",
                      trend === "down" && "text-error",
                      trend === "neutral" && "text-text-muted"
                    )}
                  >
                    {trend === "up" && <ArrowUp className="h-3 w-3 mr-0.5" />}
                    {trend === "down" && <ArrowDown className="h-3 w-3 mr-0.5" />}
                    {trendValue}
                  </span>
                )}
                {description && (
                  <span className="text-xs sm:text-sm text-text-muted truncate">{description}</span>
                )}
              </div>
            )}
          </div>

          {Icon && (
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-bg-app shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-text-muted" />
            </div>
          )}
        </div>
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
