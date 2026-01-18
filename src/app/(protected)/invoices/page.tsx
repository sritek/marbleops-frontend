"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Printer, Download } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useInvoices } from "@/lib/api";
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
import type { Invoice, InvoiceStatus } from "@/types";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusVariants: Record<InvoiceStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  ISSUED: "warning",
  PAID: "success",
  CANCELLED: "error",
};

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("INVOICE_EDIT");

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [status, setStatus] = React.useState(searchParams.get("status") || "all");

  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: invoices = [], isLoading } = useInvoices({
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => <SortableHeader column={column}>Invoice #</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: "party",
      header: "Customer",
      cell: ({ row }) => row.original.party?.name || "—",
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
      cell: ({ row }) => formatCurrency(row.original.totalAmount),
    },
    {
      accessorKey: "dueAmount",
      header: "Due",
      cell: ({ row }) => (
        <span className={row.original.dueAmount > 0 ? "text-error" : "text-success"}>
          {formatCurrency(row.original.dueAmount)}
        </span>
      ),
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
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/invoices/${row.original.id}`}>View</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Invoices</h1>
          <p className="text-sm text-text-muted">Manage billing and invoices</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          onRowClick={(row) => router.push(`/invoices/${row.id}`)}
          emptyState={{
            title: "No invoices found",
            description: "Create your first invoice to get started",
            actionLabel: canEdit ? "New Invoice" : undefined,
            onAction: canEdit ? () => router.push("/invoices/new") : undefined,
          }}
        />
      )}
    </div>
  );
}
