"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockInvoices } from "@/lib/mock/invoices";
import type { Invoice, InvoiceStatus } from "@/types";

const statusVariants: Record<InvoiceStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  ISSUED: "warning",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "error",
  CANCELLED: "error",
};

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("INVOICE_EDIT");
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [status, setStatus] = React.useState(searchParams.get("status") || "all");

  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Use mock data with filtering
  const invoices = React.useMemo(() => {
    let filtered = [...mockInvoices];

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((inv) => inv.status === status);
    }

    // Filter by search
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.buyer.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date descending
    return filtered.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  }, [status, debouncedSearch]);

  // Status options with translations
  const statusOptions = [
    { value: "all", label: tCommon("allStatus") },
    { value: "DRAFT", label: t("status.draft") },
    { value: "ISSUED", label: t("status.issued") },
    { value: "PARTIAL", label: t("status.partial") },
    { value: "PAID", label: t("status.paid") },
    { value: "OVERDUE", label: t("status.overdue") },
    { value: "CANCELLED", label: t("status.cancelled") },
  ];

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => <SortableHeader column={column}>{t("invoiceNumber")}</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: "buyer",
      header: tCommon("name"),
      cell: ({ row }) => row.original.buyer?.name || row.original.party?.name || "—",
    },
    {
      accessorKey: "invoiceDate",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("date")}</SortableHeader>,
      cell: ({ row }) => formatDate(row.original.invoiceDate || row.original.createdAt),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("amount")}</SortableHeader>,
      cell: ({ row }) => formatCurrency(row.original.totalAmount),
    },
    {
      accessorKey: "dueAmount",
      header: t("due"),
      cell: ({ row }) => (
        <span className={row.original.dueAmount > 0 ? "text-error" : "text-success"}>
          {formatCurrency(row.original.dueAmount)}
        </span>
      ),
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/invoices/${row.original.id}`}>{tCommon("view")}</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
          <p className="text-sm text-text-muted">{t("subtitle")}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newInvoice")}
            </Link>
          </Button>
        )}
      </div>

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

      <DataTable
        columns={columns}
        data={invoices}
        onRowClick={(row) => router.push(`/invoices/${row.id}`)}
        emptyState={{
          title: t("noInvoices"),
          description: search || status !== "all"
            ? tCommon("tryAdjustingFilters")
            : t("noInvoicesDesc"),
          actionLabel: canEdit ? t("newInvoice") : undefined,
          onAction: canEdit ? () => router.push("/invoices/new") : undefined,
        }}
      />
    </div>
  );
}
