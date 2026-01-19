"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { useUsers, useStores } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
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
import type { User, Role } from "@/types";

const roleVariants: Record<Role, "default" | "warning" | "success" | "info"> = {
  OWNER: "success",
  MANAGER: "warning",
  ACCOUNTANT: "info",
  STAFF: "default",
};

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canManage = usePermission("USER_MANAGE");
  const t = useTranslations("users");
  const tCommon = useTranslations("common");

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [role, setRole] = React.useState(searchParams.get("role") || "all");
  const [storeId, setStoreId] = React.useState(searchParams.get("storeId") || "all");

  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: users = [], isLoading } = useUsers({
    search: debouncedSearch || undefined,
    role: role !== "all" ? role : undefined,
    storeId: storeId !== "all" ? storeId : undefined,
  });

  const { data: stores = [] } = useStores();

  // Role options with translations
  const roleOptions = [
    { value: "all", label: tCommon("allRoles") },
    { value: "OWNER", label: t("roles.owner") },
    { value: "MANAGER", label: t("roles.manager") },
    { value: "ACCOUNTANT", label: t("roles.accountant") },
    { value: "STAFF", label: t("roles.staff") },
  ];

  // Store options
  const storeOptions = [
    { value: "all", label: t("allStores") },
    ...stores.map((store) => ({ value: store.id, label: store.name })),
  ];

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>{tCommon("name")}</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
            <UserCog className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-text-muted">{row.original.phone}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ row }) => (
        <Badge variant={roleVariants[row.original.role]}>
          {t(`roles.${row.original.role.toLowerCase()}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "storeName",
      header: t("store"),
      cell: ({ row }) => row.original.storeName || t("noStoreAssigned"),
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
          <Link href={`/users/${row.original.id}`}>{tCommon("view")}</Link>
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
          <Link href="/users/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("addUser")}
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

        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("role")} />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("store")} />
          </SelectTrigger>
          <SelectContent>
            {storeOptions.map((option) => (
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
          data={users}
          onRowClick={(row) => router.push(`/users/${row.id}`)}
          emptyState={{
            title: t("noUsers"),
            description: search || role !== "all" || storeId !== "all"
              ? tCommon("tryAdjustingFilters")
              : t("noUsersDesc"),
            actionLabel: t("addUser"),
            onAction: () => router.push("/users/new"),
          }}
        />
      )}
    </div>
  );
}
