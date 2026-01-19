"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { useOrders } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, OrderStatus } from "@/types";

const statusVariants: Record<OrderStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  CONFIRMED: "warning",
  DELIVERED: "success",
  CANCELLED: "error",
};

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("ORDER_EDIT");
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  // Filter states
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [status, setStatus] = React.useState(searchParams.get("status") || "all");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch orders
  const { data: orders = [], isLoading } = useOrders({
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
  });

  // Status options with translations
  const statusOptions = [
    { value: "all", label: tCommon("allStatus") },
    { value: "DRAFT", label: t("status.draft") },
    { value: "CONFIRMED", label: t("status.confirmed") },
    { value: "DELIVERED", label: t("status.delivered") },
    { value: "CANCELLED", label: t("status.cancelled") },
  ];

  // Table columns
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => <SortableHeader column={column}>{t("orderNumber")}</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "party",
      header: t("customer"),
      cell: ({ row }) => row.original.party?.name || "—",
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("date")}</SortableHeader>,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("amount")}</SortableHeader>,
      cell: ({ row }) => formatCurrency(row.original.totalAmount),
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
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/orders/${row.original.id}`}>{tCommon("view")}</Link>
          </Button>
          {row.original.status === "CONFIRMED" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/invoices/new?orderId=${row.original.id}`}>
                <FileText className="h-4 w-4 mr-1" />
                {tNav("invoices")}
              </Link>
            </Button>
          )}
        </div>
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
            <Link href="/orders/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newOrder")}
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          onRowClick={(row) => router.push(`/orders/${row.id}`)}
          emptyState={{
            title: t("noOrders"),
            description:
              search || status !== "all"
                ? tCommon("tryAdjustingFilters")
                : t("noOrdersDesc"),
            actionLabel: canEdit ? t("newOrder") : undefined,
            onAction: canEdit ? () => router.push("/orders/new") : undefined,
          }}
        />
      )}
    </div>
  );
}
