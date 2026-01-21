"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Filter, X, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInventoryList } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDimensions, formatSqft } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryCard } from "@/components/features/inventory-card";
import type { Inventory, InventoryStatus } from "@/types";
import { ColumnDef } from "@tanstack/react-table";

const statusVariants: Record<InventoryStatus, "success" | "warning" | "default"> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "default",
};

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("INVENTORY_EDIT");
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");

  // View mode state
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");

  // Pending filter states (not yet applied)
  const [pendingSearch, setPendingSearch] = React.useState(searchParams.get("search") || "");
  const [pendingStatus, setPendingStatus] = React.useState(searchParams.get("status") || "all");
  const [pendingMaterialType, setPendingMaterialType] = React.useState(
    searchParams.get("materialType") || "all"
  );
  const [pendingColor, setPendingColor] = React.useState(searchParams.get("color") || "all");

  // Applied filter states (used for API call)
  const [appliedSearch, setAppliedSearch] = React.useState(searchParams.get("search") || "");
  const [appliedStatus, setAppliedStatus] = React.useState(searchParams.get("status") || "all");
  const [appliedMaterialType, setAppliedMaterialType] = React.useState(
    searchParams.get("materialType") || "all"
  );
  const [appliedColor, setAppliedColor] = React.useState(searchParams.get("color") || "all");

  // Check if there are pending filter changes (excludes search - search has its own button)
  const hasFilterChanges = 
    pendingStatus !== appliedStatus ||
    pendingMaterialType !== appliedMaterialType ||
    pendingColor !== appliedColor;

  // Check if any filters are active
  const hasActiveFilters = 
    appliedSearch !== "" ||
    appliedStatus !== "all" ||
    appliedMaterialType !== "all" ||
    appliedColor !== "all";

  // Apply filters (only dropdown filters, not search)
  const applyFilters = () => {
    setAppliedStatus(pendingStatus);
    setAppliedMaterialType(pendingMaterialType);
    setAppliedColor(pendingColor);
  };

  // Clear all filters
  const clearFilters = () => {
    setPendingSearch("");
    setPendingStatus("all");
    setPendingMaterialType("all");
    setPendingColor("all");
    setAppliedSearch("");
    setAppliedStatus("all");
    setAppliedMaterialType("all");
    setAppliedColor("all");
  };

  // Fetch inventory with applied filters
  const { data: inventory = [], isLoading } = useInventoryList({
    search: appliedSearch || undefined,
    status: appliedStatus !== "all" ? appliedStatus : undefined,
    materialType: appliedMaterialType !== "all" ? appliedMaterialType : undefined,
    color: appliedColor !== "all" ? appliedColor : undefined,
  });

  // Status options with translations
  const statusOptions = [
    { value: "all", label: tCommon("allStatus") },
    { value: "AVAILABLE", label: t("status.available") },
    { value: "RESERVED", label: t("status.reserved") },
    { value: "SOLD", label: t("status.sold") },
  ];

  // Material options with translations
  const materialOptions = [
    { value: "all", label: t("allMaterials") },
    { value: "MARBLE", label: t("material.marble") },
    { value: "GRANITE", label: t("material.granite") },
    { value: "TILE", label: t("material.tile") },
  ];

  // Color options with translations
  const colorOptions = [
    { value: "all", label: t("allColors") },
    { value: "WHITE", label: t("color.white") },
    { value: "BLACK", label: t("color.black") },
    { value: "GREY", label: t("color.grey") },
    { value: "BEIGE", label: t("color.beige") },
    { value: "BROWN", label: t("color.brown") },
    { value: "GREEN", label: t("color.green") },
    { value: "BLUE", label: t("color.blue") },
    { value: "PINK", label: t("color.pink") },
    { value: "RED", label: t("color.red") },
    { value: "YELLOW", label: t("color.yellow") },
    { value: "MULTI", label: t("color.multi") },
  ];

  // Table columns
  const columns: ColumnDef<Inventory>[] = [
    {
      accessorKey: "stoneName",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("name")}</SortableHeader>,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.stoneName || row.original.name || "Unnamed"}
        </div>
      ),
    },
    {
      accessorKey: "materialType",
      header: t("materialType"),
      cell: ({ row }) => row.original.materialType || "—",
    },
    {
      accessorKey: "form",
      header: t("form"),
      cell: ({ row }) => row.original.form || "—",
    },
    {
      accessorKey: "color",
      header: t("color"),
      cell: ({ row }) => row.original.color || "—",
    },
    {
      accessorKey: "dimensions",
      header: t("dimensions"),
      cell: ({ row }) =>
        formatDimensions(
          row.original.length,
          row.original.height,
          row.original.thickness
        ),
    },
    {
      accessorKey: "availableSqft",
      header: ({ column }) => <SortableHeader column={column}>{t("available")}</SortableHeader>,
      cell: ({ row }) =>
        row.original.availableSqft !== null
          ? formatSqft(row.original.availableSqft)
          : "—",
    },
    {
      accessorKey: "sellPrice",
      header: ({ column }) => <SortableHeader column={column}>{t("price")}</SortableHeader>,
      cell: ({ row }) =>
        row.original.sellPrice !== null
          ? `${formatCurrency(row.original.sellPrice)}${tCommon("perSqft")}`
          : "—",
    },
    {
      accessorKey: "status",
      header: tCommon("status"),
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status]}>
          {t(`status.${row.original.status.toLowerCase()}`)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
          <p className="text-sm text-text-muted">{t("subtitle")}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("addItem")}
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Desktop: All filters in one row | Mobile: Stacked layout */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
          {/* Search bar */}
          <div className="relative flex items-center w-full lg:w-auto lg:flex-1 lg:max-w-sm">
            <Search className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(pendingSearch);
                }
              }}
              className="pl-10 pr-24"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="absolute right-1 h-7"
              onClick={() => setAppliedSearch(pendingSearch)}
            >
              {tCommon("search")}
            </Button>
          </div>

          {/* Dropdown filters - 2 columns on mobile, inline on desktop */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-row lg:items-center lg:gap-2">
            {/* Status filter */}
            <Select value={pendingStatus} onValueChange={setPendingStatus}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder={tCommon("status")} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Material filter */}
            <Select value={pendingMaterialType} onValueChange={setPendingMaterialType}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder={t("materialType")} />
              </SelectTrigger>
              <SelectContent>
                {materialOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Color filter */}
            <Select value={pendingColor} onValueChange={setPendingColor}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder={t("color")} />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Apply filter button */}
            <Button 
              onClick={applyFilters}
              disabled={!hasFilterChanges}
              size="sm"
              className="w-full lg:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("applyFilters")}
            </Button>
          </div>

          {/* Clear filters button - inline on desktop */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              size="sm"
              className="hidden lg:flex text-text-muted"
            >
              <X className="h-4 w-4 mr-1" />
              {t("clearFilters")}
            </Button>
          )}

          {/* View toggle - pushed to right on desktop */}
          <div className="hidden lg:block lg:ml-auto">
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Mobile only: Clear filters and View toggle row */}
        <div className="flex items-center justify-between lg:hidden">
          {hasActiveFilters ? (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              size="sm"
              className="text-text-muted"
            >
              <X className="h-4 w-4 mr-1" />
              {t("clearFilters")}
            </Button>
          ) : (
            <div />
          )}
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <span>{t("activeFilters")}:</span>
            {appliedSearch && (
              <Badge variant="default" className="font-normal">
                {t("searchLabel")}: {appliedSearch}
              </Badge>
            )}
            {appliedStatus !== "all" && (
              <Badge variant="default" className="font-normal">
                {t(`status.${appliedStatus.toLowerCase()}`)}
              </Badge>
            )}
            {appliedMaterialType !== "all" && (
              <Badge variant="default" className="font-normal">
                {t(`material.${appliedMaterialType.toLowerCase()}`)}
              </Badge>
            )}
            {appliedColor !== "all" && (
              <Badge variant="default" className="font-normal">
                {t(`color.${appliedColor.toLowerCase()}`)}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : inventory.length === 0 ? (
        <EmptyState
          title={t("noItems")}
          description={
            hasActiveFilters
              ? tCommon("tryAdjustingFilters")
              : t("noItemsDesc")
          }
          actionLabel={canEdit ? t("addItem") : undefined}
          onAction={canEdit ? () => router.push("/inventory/new") : undefined}
        />
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {inventory.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* Table View */
        <DataTable
          columns={columns}
          data={inventory}
          onRowClick={(row) => router.push(`/inventory/${row.id}`)}
          emptyState={{
            title: t("noItems"),
            description: tCommon("tryAdjustingFilters"),
          }}
        />
      )}
    </div>
  );
}
