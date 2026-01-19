"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, User } from "lucide-react";
import { useTranslations } from "next-intl";
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

const typeVariants: Record<PartyType, "info" | "accent" | "default"> = {
  CUSTOMER: "info",
  SUPPLIER: "accent",
  BOTH: "default",
};

export default function PartiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("PARTY_EDIT");
  const t = useTranslations("parties");
  const tCommon = useTranslations("common");

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

  // Type options with translations
  const typeOptions = [
    { value: "all", label: tCommon("allTypes") },
    { value: "CUSTOMER", label: t("type.customers") },
    { value: "SUPPLIER", label: t("type.suppliers") },
    { value: "BOTH", label: t("type.both") },
  ];

  const columns: ColumnDef<Party>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>{t("name")}</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-app">
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
      header: tCommon("type"),
      cell: ({ row }) => (
        <Badge variant={typeVariants[row.original.type]}>
          {t(`type.${row.original.type.toLowerCase()}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "currentBalance",
      header: ({ column }) => <SortableHeader column={column}>{t("balance")}</SortableHeader>,
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
      header: tCommon("status"),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "default"}>
          {row.original.isActive ? tCommon("active") : tCommon("inactive")}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/parties/${row.original.id}`}>{tCommon("view")}</Link>
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
            <Link href="/parties/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("addParty")}
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
          <SelectTrigger className="w-[150px]">
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
            title: t("noParties"),
            description: search || type !== "all"
              ? tCommon("tryAdjustingFilters")
              : t("noPartiesDesc"),
            actionLabel: canEdit ? t("addParty") : undefined,
            onAction: canEdit ? () => router.push("/parties/new") : undefined,
          }}
        />
      )}
    </div>
  );
}
