"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  FileText,
  Truck,
  ShoppingCart,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import type { Order, OrderStatus } from "@/types";

// Status badge variants
const statusVariants: Record<OrderStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  CONFIRMED: "warning",
  DELIVERED: "success",
  CANCELLED: "error",
};

// Status tab configuration - match backend OrderStatus enum
const statusTabs: { value: string; labelKey: string; icon?: React.ElementType }[] = [
  { value: "all", labelKey: "allOrders" },
  { value: "DRAFT", labelKey: "status.draft", icon: FileText },
  { value: "CONFIRMED", labelKey: "status.confirmed", icon: CheckCircle },
  { value: "DELIVERED", labelKey: "status.delivered", icon: CheckCircle },
  { value: "CANCELLED", labelKey: "status.cancelled", icon: AlertTriangle },
];

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = usePermission("ORDER_EDIT");
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  // Filter states
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [statusTab, setStatusTab] = React.useState(searchParams.get("status") || "all");

  // Fetch orders from backend
  const { data: orders = [], isLoading, error } = useOrders({
    status: statusTab !== "all" ? statusTab : undefined,
  });

  // Calculate stats from backend data
  const stats = React.useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
    return {
      totalOrders: orders.length,
      totalValue: activeOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      draftOrders: orders.filter((o) => o.status === "DRAFT").length,
      confirmedOrders: orders.filter((o) => o.status === "CONFIRMED").length,
      deliveredOrders: orders.filter((o) => o.status === "DELIVERED").length,
      cancelledOrders: orders.filter((o) => o.status === "CANCELLED").length,
      paymentPending: activeOrders.reduce((sum, o) => sum + o.totalAmount, 0), // Simplified - backend doesn't track payments yet
      overdueDeliveries: 0, // Not tracked in backend yet
    };
  }, [orders]);

  // Filter orders (client-side for search, status is handled by API)
  const filteredOrders = React.useMemo(() => {
    let filtered = [...orders];

    // Search filter (client-side since backend doesn't support it yet)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          (order.partyName && order.partyName.toLowerCase().includes(searchLower)) ||
          (order.party?.name && order.party.name.toLowerCase().includes(searchLower))
      );
    }

    // Sort by date descending
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, search]);

  // Count by status for tabs
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Handle row click
  const handleRowClick = (order: Order) => {
    router.push(`/orders/${order.id}`);
  };

  // Get customer name from order
  const getCustomerName = (order: Order) => {
    return order.partyName || order.party?.name || "Unknown Customer";
  };

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

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("stats.draftOrders")}
          value={stats.draftOrders.toString()}
          description={t("stats.awaitingConfirmation")}
          icon={FileText}
          trend={stats.draftOrders > 0 ? "up" : undefined}
        />
        <StatCard
          title={t("stats.toShip")}
          value={stats.confirmedOrders.toString()}
          description={t("stats.readyForDelivery")}
          icon={Truck}
        />
        <StatCard
          title={t("stats.delivered")}
          value={stats.deliveredOrders.toString()}
          description={t("stats.completed")}
          icon={CheckCircle}
        />
        <StatCard
          title={t("stats.paymentDue")}
          value={formatCurrency(stats.paymentPending)}
          description={t("stats.outstanding")}
          icon={Wallet}
        />
      </div>

      {/* Status Tabs - Scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 border-b border-border-subtle pb-2 min-w-max">
          {statusTabs.map((tab) => {
            const count = statusCounts[tab.value] || 0;
            const isActive = statusTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  const newStatus = tab.value;
                  const params = new URLSearchParams(searchParams.toString());
                  if (newStatus === "all") {
                    params.delete("status");
                  } else {
                    params.set("status", newStatus);
                  }
                  router.push(`/orders?${params.toString()}`);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary-100 text-primary-700"
                    : "text-text-muted hover:bg-bg-app hover:text-text-primary"
                }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                <span>{t(tab.labelKey)}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    isActive ? "bg-primary-200" : "bg-bg-app"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
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
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-error mb-4" />
            <p className="text-lg font-medium text-text-primary mb-1">
              {tCommon("error")}
            </p>
            <p className="text-sm text-text-muted mb-4">
              {error instanceof Error ? error.message : "Failed to load orders"}
            </p>
            <Button onClick={() => window.location.reload()}>
              {tCommon("retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {!isLoading && !error && (
        <>
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-text-muted mb-4" />
                <p className="text-lg font-medium text-text-primary mb-1">
                  {t("noOrders")}
                </p>
                <p className="text-sm text-text-muted mb-4">
                  {search
                    ? tCommon("tryAdjustingFilters")
                    : t("noOrdersDesc")}
                </p>
                {canEdit && (
                  <Button asChild>
                    <Link href="/orders/new">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("newOrder")}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((order) => {
                  return (
                    <Card
                      key={order.id}
                      onClick={() => handleRowClick(order)}
                      className="cursor-pointer hover:bg-bg-app transition-colors active:scale-[0.99]"
                    >
                      <CardContent className="p-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-text-primary">
                                {order.orderNumber}
                              </span>
                            </div>
                            <p className="text-sm text-text-muted truncate mt-0.5">
                              {getCustomerName(order)}
                            </p>
                          </div>
                          <Badge variant={statusVariants[order.status]}>
                            {t(`status.${order.status.toLowerCase()}`)}
                          </Badge>
                        </div>

                        {/* Details Row */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 text-text-muted">
                            <span>{formatDate(order.createdAt)}</span>
                            <span>•</span>
                            <span>{order.items?.length || 0} {t("itemsCount")}</span>
                          </div>
                          <span className="font-semibold text-text-primary">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-subtle bg-bg-app">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                            {t("orderNumber")}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                            {t("customer")}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                            {t("items")}
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
                            {tCommon("amount")}
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-text-muted">
                            {tCommon("status")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => {
                          return (
                            <tr
                              key={order.id}
                              onClick={() => handleRowClick(order)}
                              className="border-b border-border-subtle last:border-0 hover:bg-bg-app cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div>
                                  <span className="font-medium text-text-primary">
                                    {order.orderNumber}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-text-muted">
                                      {formatDate(order.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-text-primary truncate max-w-[180px]">
                                    {getCustomerName(order)}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-text-muted">
                                  {order.items?.length || 0} {t("itemsCount")}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-medium">
                                  {formatCurrency(order.totalAmount)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant={statusVariants[order.status]}>
                                  {t(`status.${order.status.toLowerCase()}`)}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
