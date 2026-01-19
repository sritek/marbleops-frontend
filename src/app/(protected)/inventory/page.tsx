"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
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

  // Filter states
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [status, setStatus] = React.useState(searchParams.get("status") || "all");
  const [materialType, setMaterialType] = React.useState(
    searchParams.get("materialType") || "all"
  );

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch inventory
  const { data: inventory = [], isLoading } = useInventoryList({
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
    materialType: materialType !== "all" ? materialType : undefined,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
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
        <Select value={materialType} onValueChange={setMaterialType}>
          <SelectTrigger className="w-[150px]">
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

        {/* View toggle */}
        <ViewToggle value={viewMode} onChange={setViewMode} />
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
            search || status !== "all" || materialType !== "all"
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
