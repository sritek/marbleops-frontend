"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Store as StoreIcon, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { useStores } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import type { Store } from "@/types";

export default function StoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canManage = usePermission("STORE_MANAGE");
  const t = useTranslations("stores");
  const tCommon = useTranslations("common");

  const [search, setSearch] = React.useState(searchParams.get("search") || "");

  const { data: stores = [], isLoading } = useStores();

  // Filter stores by search
  const filteredStores = React.useMemo(() => {
    if (!search) return stores;
    const searchLower = search.toLowerCase();
    return stores.filter(
      (store) =>
        store.name.toLowerCase().includes(searchLower) ||
        (store.address && store.address.toLowerCase().includes(searchLower)) ||
        (store.phone && store.phone.includes(search))
    );
  }, [stores, search]);

  const columns: ColumnDef<Store>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>{t("storeName")}</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
            <StoreIcon className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: t("storeAddress"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-text-muted">
          {row.original.address ? (
            <>
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[200px]">{row.original.address}</span>
            </>
          ) : (
            "—"
          )}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("storePhone"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-text-muted">
          {row.original.phone ? (
            <>
              <Phone className="h-4 w-4 shrink-0" />
              <span>{row.original.phone}</span>
            </>
          ) : (
            "—"
          )}
        </div>
      ),
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
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("createdAt")}</SortableHeader>,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/stores/${row.original.id}`}>{tCommon("view")}</Link>
        </Button>
      ),
    },
  ];

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
          <p className="text-sm text-text-muted">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/stores/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("addStore")}
          </Link>
        </Button>
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredStores}
          onRowClick={(row) => router.push(`/stores/${row.id}`)}
          emptyState={{
            title: t("noStores"),
            description: search
              ? tCommon("tryAdjustingFilters")
              : t("noStoresDesc"),
            actionLabel: t("addStore"),
            onAction: () => router.push("/stores/new"),
          }}
        />
      )}
    </div>
  );
}
