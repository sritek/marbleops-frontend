"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { usePayments } from "@/lib/api";
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
import type { Payment } from "@/types";

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canRecord = usePermission("PAYMENT_RECORD");
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [type, setType] = React.useState(searchParams.get("type") || "all");
  const [method, setMethod] = React.useState(searchParams.get("method") || "all");

  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: payments = [], isLoading } = usePayments({
    search: debouncedSearch || undefined,
    type: type !== "all" ? type : undefined,
    method: method !== "all" ? method : undefined,
  });

  // Type options with translations
  const typeOptions = [
    { value: "all", label: tCommon("allTypes") },
    { value: "IN", label: t("received") },
    { value: "OUT", label: t("paid") },
  ];

  // Method options with translations
  const methodOptions = [
    { value: "all", label: t("allMethods") },
    { value: "CASH", label: t("methods.cash") },
    { value: "BANK_TRANSFER", label: t("methods.bank") },
    { value: "UPI", label: t("methods.upi") },
    { value: "CHEQUE", label: t("methods.cheque") },
  ];

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "type",
      header: tCommon("type"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.type === "IN" ? (
            <ArrowDownLeft className="h-4 w-4 text-success" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-error" />
          )}
          <span>{row.original.type === "IN" ? t("received") : t("paid")}</span>
        </div>
      ),
    },
    {
      accessorKey: "party",
      header: t("party"),
      cell: ({ row }) => row.original.partyName ?? row.original.party?.name ?? "—",
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("date")}</SortableHeader>,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <SortableHeader column={column}>{t("amount")}</SortableHeader>,
      cell: ({ row }) => (
        <span className={row.original.type === "IN" ? "text-success" : "text-error"}>
          {row.original.type === "IN" ? "+" : "-"}
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "method",
      header: t("method"),
      cell: ({ row }) => {
        const methodKey = row.original.method.toLowerCase().replace("_", "");
        const methodTranslations: Record<string, string> = {
          cash: t("methods.cash"),
          banktransfer: t("methods.bank"),
          upi: t("methods.upi"),
          cheque: t("methods.cheque"),
          other: t("methods.other"),
        };
        return (
          <Badge variant="default">
            {methodTranslations[methodKey] || row.original.method}
          </Badge>
        );
      },
    },
    {
      accessorKey: "invoice",
      header: t("invoice"),
      cell: ({ row }) =>
        row.original.invoice ? (
          <Link
            href={`/invoices/${row.original.invoiceId}`}
            className="text-primary-600 hover:underline"
          >
            {row.original.invoice.invoiceNumber}
          </Link>
        ) : (
          "—"
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
        {canRecord && (
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("recordPayment")}
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

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={tCommon("type")} />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("method")} />
          </SelectTrigger>
          <SelectContent>
            {methodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={payments}
          emptyState={{
            title: t("noPayments"),
            description: search || type !== "all" || method !== "all"
              ? tCommon("tryAdjustingFilters")
              : t("noPaymentsDesc"),
            actionLabel: canRecord ? t("recordPayment") : undefined,
            onAction: canRecord ? () => router.push("/payments/new") : undefined,
          }}
        />
      )}
    </div>
  );
}
