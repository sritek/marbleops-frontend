"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, User, Phone, MapPin } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useParties } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
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
import type { Party, PartyType } from "@/types";

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "CUSTOMER", label: "Customers" },
  { value: "SUPPLIER", label: "Suppliers" },
  { value: "BOTH", label: "Both" },
];

const typeVariants: Record<PartyType, "info" | "accent" | "default"> = {
  CUSTOMER: "info",
  SUPPLIER: "accent",
  BOTH: "default",
};

export default function PartiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("PARTY_EDIT");

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [type, setType] = React.useState(searchParams.get("type") || "all");

  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: parties = [], isLoading } = useParties({
    search: debouncedSearch || undefined,
    type: type !== "all" ? type : undefined,
  });

  const columns: ColumnDef<Party>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-muted">
            <User className="h-4 w-4 text-text-muted" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.phone && (
              <p className="text-xs text-text-muted">{row.original.phone}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={typeVariants[row.original.type]}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "currentBalance",
      header: ({ column }) => <SortableHeader column={column}>Balance</SortableHeader>,
      cell: ({ row }) => {
        const balance = row.original.currentBalance;
        const isPositive = balance >= 0;
        return (
          <span className={isPositive ? "text-success" : "text-error"}>
            {isPositive ? "+" : ""}
            {formatCurrency(balance)}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "default"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/parties/${row.original.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Parties</h1>
          <p className="text-sm text-text-muted">
            Manage customers and suppliers
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/parties/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search by name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px]">
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={parties}
          onRowClick={(row) => router.push(`/parties/${row.id}`)}
          emptyState={{
            title: "No parties found",
            description: "Add your first customer or supplier",
            actionLabel: canEdit ? "Add Party" : undefined,
            onAction: canEdit ? () => router.push("/parties/new") : undefined,
          }}
        />
      )}
    </div>
  );
}
