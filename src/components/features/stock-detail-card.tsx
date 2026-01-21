"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StockMetric {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface StockParty {
  name: string;
  material: string;
  quantity: string;
}

interface StockDetailCardProps {
  title: string;
  icon: LucideIcon;
  metrics: StockMetric[];
  parties: StockParty[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Loading skeleton for the stock detail card
 */
function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 skeleton rounded" />
          <div className="w-24 h-5 skeleton rounded" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Primary metric skeleton */}
        <div className="w-32 h-10 skeleton rounded mb-3" />
        
        {/* Secondary metrics skeleton */}
        <div className="flex gap-4 mb-4">
          <div className="w-20 h-4 skeleton rounded" />
          <div className="w-20 h-4 skeleton rounded" />
        </div>
        
        {/* Parties list skeleton */}
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="w-24 h-4 skeleton rounded" />
              <div className="w-16 h-4 skeleton rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Format metric value for display
 */
function formatMetricValue(value: string | number): string {
  if (typeof value === "number") {
    return value.toLocaleString("en-IN");
  }
  return value;
}

/**
 * Stock detail card component
 * Shows stock metrics and parties for Slab/Block/Tiles
 */
export function StockDetailCard({
  title,
  icon: Icon,
  metrics,
  parties,
  isLoading = false,
  className,
}: StockDetailCardProps) {
  if (isLoading) {
    return <CardSkeleton />;
  }

  const primaryMetric = metrics.find((m) => m.highlight);
  const secondaryMetrics = metrics.filter((m) => !m.highlight);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Primary metric - displayed large */}
        {primaryMetric && (
          <div className="mb-3">
            <p className="text-3xl font-bold text-text-primary">
              {formatMetricValue(primaryMetric.value)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{primaryMetric.label}</p>
          </div>
        )}

        {/* Secondary metrics - displayed smaller */}
        {secondaryMetrics.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 pb-3 border-b border-border-subtle">
            {secondaryMetrics.map((metric, index) => (
              <div key={index} className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-text-primary">
                  {formatMetricValue(metric.value)}
                </span>
                <span className="text-xs text-text-muted">{metric.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Parties list - scrollable */}
        {parties.length > 0 ? (
          <div className="space-y-0">
            <p className="text-xs font-medium text-text-muted mb-2">
              Top Suppliers / Parties
            </p>
            <div className="max-h-[120px] overflow-y-auto pr-1 space-y-2">
              {parties.map((party, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {party.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {party.material}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-text-primary ml-2 shrink-0">
                    {party.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-text-muted">No parties available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
