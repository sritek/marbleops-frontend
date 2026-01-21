"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, AlertTriangle, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export interface LowStockItem {
  id: string;
  name: string;
  materialType: string;
  currentQty: number;
  threshold: number;
  unit?: string;
}

interface LowStockTableProps {
  items: LowStockItem[];
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
  showViewAll?: boolean;
  viewAllHref?: string;
}

type SortField = "name" | "materialType" | "currentQty" | "threshold" | "status";
type SortDirection = "asc" | "desc";

/**
 * Get status based on current quantity vs threshold
 */
function getStatus(currentQty: number, threshold: number): "critical" | "warning" {
  const ratio = currentQty / threshold;
  return ratio <= 0.5 ? "critical" : "warning";
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: "critical" | "warning" }) {
  return (
    <Badge
      variant={status === "critical" ? "error" : "warning"}
      className="gap-1"
    >
      {status === "critical" ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {status === "critical" ? "Critical" : "Warning"}
    </Badge>
  );
}

/**
 * Loading skeleton for the table
 */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 border border-border-subtle rounded-lg">
          <div className="flex-1 space-y-2">
            <div className="w-32 h-4 skeleton rounded" />
            <div className="w-20 h-3 skeleton rounded" />
          </div>
          <div className="w-16 h-4 skeleton rounded" />
          <div className="w-16 h-4 skeleton rounded" />
          <div className="w-20 h-6 skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Mobile card view for a single item
 */
function MobileItemCard({ item }: { item: LowStockItem }) {
  const status = getStatus(item.currentQty, item.threshold);
  
  return (
    <div className="p-3 border border-border-subtle rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate">
            {item.name}
          </p>
          <p className="text-xs text-text-muted">{item.materialType}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="text-text-muted">
            Qty: <span className="font-medium text-text-primary">{item.currentQty}</span>
            {item.unit && ` ${item.unit}`}
          </span>
          <span className="text-text-muted">
            Min: <span className="font-medium text-text-primary">{item.threshold}</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/inventory/${item.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Sort header button component
 */
function SortHeader({
  label,
  field,
  currentField,
  currentDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-text-primary transition-colors"
    >
      {label}
      <ArrowUpDown
        className={cn(
          "h-3.5 w-3.5",
          isActive ? "text-primary-600" : "text-text-muted"
        )}
      />
    </button>
  );
}

/**
 * Low stock alerts table component
 * Shows items below threshold with sortable columns
 */
export function LowStockTable({
  items,
  isLoading = false,
  className,
  maxItems,
  showViewAll = true,
  viewAllHref = "/inventory?status=low",
}: LowStockTableProps) {
  const [sortField, setSortField] = React.useState<SortField>("status");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedItems = React.useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "materialType":
          comparison = a.materialType.localeCompare(b.materialType);
          break;
        case "currentQty":
          comparison = a.currentQty - b.currentQty;
          break;
        case "threshold":
          comparison = a.threshold - b.threshold;
          break;
        case "status": {
          const statusA = getStatus(a.currentQty, a.threshold);
          const statusB = getStatus(b.currentQty, b.threshold);
          comparison = statusA === statusB ? 0 : statusA === "critical" ? -1 : 1;
          break;
        }
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return maxItems ? sorted.slice(0, maxItems) : sorted;
  }, [items, sortField, sortDirection, maxItems]);

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <TableSkeleton />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className={cn("w-full py-8 text-center", className)}>
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
            <AlertTriangle className="h-5 w-5 text-success" />
          </div>
          <p className="text-sm text-text-muted">All items are well-stocked</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto max-h-[320px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-bg-surface z-10">
            <tr className="border-b border-border-subtle">
              <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                <SortHeader
                  label="Item Name"
                  field="name"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                <SortHeader
                  label="Material"
                  field="materialType"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                <SortHeader
                  label="Current Qty"
                  field="currentQty"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                <SortHeader
                  label="Threshold"
                  field="threshold"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-center text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                <SortHeader
                  label="Status"
                  field="status"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="text-center text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => {
              const status = getStatus(item.currentQty, item.threshold);
              return (
                <tr
                  key={item.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-bg-app transition-colors"
                >
                  <td className="py-3 px-3">
                    <span className="text-sm font-medium text-text-primary">
                      {item.name}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-text-muted">
                      {item.materialType}
                    </span>
                  </td>
                  <td className="text-right py-3 px-3">
                    <span className="text-sm font-medium text-text-primary">
                      {item.currentQty}
                      {item.unit && (
                        <span className="text-text-muted ml-1">{item.unit}</span>
                      )}
                    </span>
                  </td>
                  <td className="text-right py-3 px-3">
                    <span className="text-sm text-text-muted">{item.threshold}</span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="text-center py-3 px-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inventory/${item.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {sortedItems.map((item) => (
          <MobileItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* View All link */}
      {showViewAll && items.length > (maxItems || 0) && (
        <div className="mt-4 text-center">
          <Button variant="link" asChild>
            <Link href={viewAllHref}>
              View all {items.length} items
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
