"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
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
import type { Inventory, InventoryStatus, MaterialType } from "@/types";
import { ColumnDef } from "@tanstack/react-table";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
];

const materialOptions = [
  { value: "all", label: "All Materials" },
  { value: "MARBLE", label: "Marble" },
  { value: "GRANITE", label: "Granite" },
  { value: "TILE", label: "Tile" },
];

const statusVariants: Record<InventoryStatus, "success" | "warning" | "default"> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "default",
};

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("INVENTORY_EDIT");

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

  // Table columns
  const columns: ColumnDef<Inventory>[] = [
    {
      accessorKey: "stoneName",
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.stoneName || row.original.name || "Unnamed"}
        </div>
      ),
    },
    {
      accessorKey: "materialType",
      header: "Material",
      cell: ({ row }) => row.original.materialType || "—",
    },
    {
      accessorKey: "form",
      header: "Form",
      cell: ({ row }) => row.original.form || "—",
    },
    {
      accessorKey: "dimensions",
      header: "Dimensions",
      cell: ({ row }) =>
        formatDimensions(
          row.original.length,
          row.original.height,
          row.original.thickness
        ),
    },
    {
      accessorKey: "availableSqft",
      header: ({ column }) => <SortableHeader column={column}>Available</SortableHeader>,
      cell: ({ row }) =>
        row.original.availableSqft !== null
          ? formatSqft(row.original.availableSqft)
          : "—",
    },
    {
      accessorKey: "sellPrice",
      header: ({ column }) => <SortableHeader column={column}>Price</SortableHeader>,
      cell: ({ row }) =>
        row.original.sellPrice !== null
          ? `${formatCurrency(row.original.sellPrice)}/sqft`
          : "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Inventory</h1>
          <p className="text-sm text-text-muted">
            Manage your stone inventory and stock levels
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
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
            placeholder="Search by name, lot number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
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
            <SelectValue placeholder="Material" />
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
          title="No inventory items"
          description={
            search || status !== "all" || materialType !== "all"
              ? "Try adjusting your filters"
              : "Get started by adding your first item"
          }
          actionLabel={canEdit ? "Add Item" : undefined}
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
            title: "No inventory items",
            description: "Try adjusting your filters",
          }}
        />
      )}
    </div>
  );
}
