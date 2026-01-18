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
 */
export function InventoryCard({ item, className }: InventoryCardProps) {
  const displayName = item.stoneName || item.name || "Unnamed Item";
  const hasPhoto = item.photos && item.photos.length > 0;

  return (
    <Link href={`/inventory/${item.id}`}>
      <Card
        className={cn(
          "overflow-hidden transition-all hover:shadow-md hover:border-border-strong cursor-pointer",
          className
        )}
      >
        {/* Photo or placeholder */}
        <div className="relative aspect-[4/3] bg-bg-muted">
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

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Name and type */}
          <div>
            <h3 className="font-medium text-text-primary truncate">
              {displayName}
            </h3>
            <p className="text-sm text-text-muted truncate">
              {item.materialType && `${item.materialType} • `}
              {item.form && `${item.form} • `}
              {item.lotNumber && `Lot: ${item.lotNumber}`}
            </p>
          </div>

          {/* Dimensions */}
          {(item.length || item.height || item.thickness) && (
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <Ruler className="h-3.5 w-3.5" />
              <span>{formatDimensions(item.length, item.height, item.thickness)}</span>
            </div>
          )}

          {/* Sqft and Price */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
            {item.availableSqft !== null && (
              <span className="text-sm font-medium text-text-primary">
                {formatSqft(item.availableSqft)}
              </span>
            )}
            {item.sellPrice !== null && (
              <div className="flex items-center gap-1 text-sm text-text-muted">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{formatCurrency(item.sellPrice)}/sqft</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
