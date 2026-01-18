"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
import type { Payment, PaymentType, PaymentMethod } from "@/types";

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "IN", label: "Received" },
  { value: "OUT", label: "Paid" },
];

const methodOptions = [
  { value: "all", label: "All Methods" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
];

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canRecord = usePermission("PAYMENT_RECORD");

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

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.type === "IN" ? (
            <ArrowDownLeft className="h-4 w-4 text-success" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-error" />
          )}
          <span>{row.original.type === "IN" ? "Received" : "Paid"}</span>
        </div>
      ),
    },
    {
      accessorKey: "party",
      header: "Party",
      cell: ({ row }) => row.original.party?.name || "—",
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
      cell: ({ row }) => (
        <span className={row.original.type === "IN" ? "text-success" : "text-error"}>
          {row.original.type === "IN" ? "+" : "-"}
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <Badge variant="default">
          {row.original.method.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "invoice",
      header: "Invoice",
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
          <h1 className="text-2xl font-semibold text-text-primary">Payments</h1>
          <p className="text-sm text-text-muted">Track payments and transactions</p>
        </div>
        {canRecord && (
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
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
            <SelectValue placeholder="Method" />
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
            title: "No payments found",
            description: "Record your first payment to get started",
            actionLabel: canRecord ? "Record Payment" : undefined,
            onAction: canRecord ? () => router.push("/payments/new") : undefined,
          }}
        />
      )}
    </div>
  );
}
