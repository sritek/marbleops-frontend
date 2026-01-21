"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Ruler, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDimensions, formatSqft } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Inventory, InventoryStatus } from "@/types";

interface InventoryCardProps {
  item: Inventory;
  className?: string;
}

const statusVariants: Record<InventoryStatus, "success" | "warning" | "default"> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "default",
};

const statusLabels: Record<InventoryStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
};

/**
 * Inventory card for grid view display
 * Fixed height (320px) for consistent card sizing across the grid
 */
export function InventoryCard({ item, className }: InventoryCardProps) {
  const displayName = item.stoneName || item.name || "Unnamed Item";
  const hasPhoto = item.photos && item.photos.length > 0;

  // Build description string with fallback
  const description = [
    item.materialType,
    item.form,
    item.color,
    item.lotNumber ? `Lot: ${item.lotNumber}` : null,
  ]
    .filter(Boolean)
    .join(" • ") || "—";

  return (
    <Link href={`/inventory/${item.id}`}>
      <Card
        className={cn(
          "overflow-hidden h-[320px] flex flex-col transition-all hover:shadow-md hover:border-border-strong cursor-pointer",
          className
        )}
      >
        {/* Photo or placeholder - fixed height */}
        <div className="relative h-[160px] bg-bg-app shrink-0">
          {hasPhoto ? (
            <img
              src={item.photos![0]}
              alt={displayName}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-12 w-12 text-text-muted" />
            </div>
          )}
          {/* Status badge */}
          <Badge
            variant={statusVariants[item.status]}
            className="absolute top-2 right-2"
          >
            {statusLabels[item.status]}
          </Badge>
        </div>

        {/* Content - flex to fill remaining space */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Name and type */}
          <div className="mb-2">
            <h3 className="font-medium text-text-primary line-clamp-1">
              {displayName}
            </h3>
            <p className="text-sm text-text-muted line-clamp-1">
              {description}
            </p>
          </div>

          {/* Dimensions - always show with placeholder */}
          <div className="flex items-center gap-1 text-sm text-text-muted mb-2">
            <Ruler className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {item.length || item.height || item.thickness
                ? formatDimensions(item.length, item.height, item.thickness)
                : "—"}
            </span>
          </div>

          {/* Sqft and Price - pushed to bottom */}
          <div className="flex items-center justify-between pt-2 mt-auto border-t border-border-subtle">
            <span className="text-sm font-medium text-text-primary">
              {item.availableSqft !== null ? formatSqft(item.availableSqft) : "—"}
            </span>
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              <span>
                {item.sellPrice !== null
                  ? `${formatCurrency(item.sellPrice)}/sqft`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
