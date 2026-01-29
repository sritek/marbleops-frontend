"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { useExpenses } from "@/lib/stores/expense-store";
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
import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types";

const statusVariants: Record<ExpenseStatus, "default" | "success" | "error"> = {
  PENDING: "default",
  PAID: "success",
  CANCELLED: "error",
};

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("EXPENSE_EDIT");
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [category, setCategory] = React.useState(searchParams.get("category") || "all");
  const [status, setStatus] = React.useState(searchParams.get("status") || "all");

  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const expenses = useExpenses({
    search: debouncedSearch || undefined,
    category: category !== "all" ? (category as ExpenseCategory) : undefined,
    status: status !== "all" ? (status as ExpenseStatus) : undefined,
  });

  // Category options
  const categoryOptions = [
    { value: "all", label: tCommon("allCategories") },
    { value: "MATERIAL_PURCHASE", label: t("category.materialpurchase") },
    { value: "FREIGHT", label: t("category.freight") },
    { value: "LABOR", label: t("category.labor") },
    { value: "RENT", label: t("category.rent") },
    { value: "UTILITIES", label: t("category.utilities") },
    { value: "EQUIPMENT", label: t("category.equipment") },
    { value: "OTHER", label: t("category.other") },
  ];

  // Status options
  const statusOptions = [
    { value: "all", label: tCommon("allStatuses") },
    { value: "PENDING", label: t("status.pending") },
    { value: "PAID", label: t("status.paid") },
    { value: "CANCELLED", label: t("status.cancelled") },
  ];

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "expenseNumber",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("number")}</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-app">
            <Receipt className="h-4 w-4 text-text-muted" />
          </div>
          <div>
            <p className="font-medium">{row.original.expenseNumber}</p>
            <p className="text-xs text-text-muted">{formatDate(row.original.date)}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("description")}</SortableHeader>,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.description}</p>
          {row.original.vendorName && (
            <p className="text-xs text-text-muted">{row.original.vendorName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: tCommon("category"),
      cell: ({ row }) => {
        const categoryKey = row.original.category.toLowerCase().replace(/_/g, "");
        return (
          <Badge variant="default">
            {t(`category.${categoryKey}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("amount")}</SortableHeader>,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{formatCurrency(row.original.totalAmount)}</p>
          {row.original.gstAmount && row.original.gstAmount > 0 && (
            <p className="text-xs text-text-muted">
              {formatCurrency(row.original.amount)} + GST
            </p>
          )}
        </div>
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
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/expenses/${row.original.id}`}>{tCommon("view")}</Link>
        </Button>
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
            <Link href="/expenses/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newExpense")}
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

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={tCommon("category")} />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
        data={expenses}
        onRowClick={(row) => router.push(`/expenses/${row.id}`)}
        emptyState={{
          title: t("noExpenses"),
          description: search || category !== "all" || status !== "all"
            ? tCommon("tryAdjustingFilters")
            : t("noExpensesDesc"),
          actionLabel: canEdit ? t("newExpense") : undefined,
          onAction: canEdit ? () => router.push("/expenses/new") : undefined,
        }}
      />
    </div>
  );
}
