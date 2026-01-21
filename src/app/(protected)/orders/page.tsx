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
import {
  mockOrders,
  getMockOrderStats,
} from "@/lib/mock/orders";
import type { Order, OrderStatus } from "@/types";

// Status badge variants
const statusVariants: Record<OrderStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  CONFIRMED: "warning",
  PROCESSING: "warning",
  PARTIALLY_DELIVERED: "warning",
  DELIVERED: "success",
  CLOSED: "success",
  CANCELLED: "error",
  ON_HOLD: "default",
};

// Status tab configuration
const statusTabs: { value: string; labelKey: string; icon?: React.ElementType }[] = [
  { value: "all", labelKey: "allOrders" },
  { value: "DRAFT", labelKey: "status.draft", icon: FileText },
  { value: "CONFIRMED", labelKey: "status.confirmed", icon: CheckCircle },
  { value: "PROCESSING", labelKey: "status.processing", icon: Package },
  { value: "PARTIALLY_DELIVERED", labelKey: "status.partiallyDelivered", icon: Truck },
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
  const [priorityFilter, setPriorityFilter] = React.useState("all");

  // Get stats
  const stats = React.useMemo(() => getMockOrderStats(), []);

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    let filtered = [...mockOrders];

    // Status filter
    if (statusTab !== "all") {
      filtered = filtered.filter((order) => order.status === statusTab);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((order) => order.priority === priorityFilter);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerSnapshot.name.toLowerCase().includes(searchLower) ||
          order.customerSnapshot.phone?.includes(search)
      );
    }

    // Sort by date descending
    return filtered.sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }, [statusTab, priorityFilter, search]);

  // Count by status for tabs
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: mockOrders.length };
    mockOrders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  }, []);

  // Handle row click
  const handleRowClick = (order: Order) => {
    router.push(`/orders/${order.id}`);
  };

  // Calculate delivery progress
  const getDeliveryProgress = (order: Order) => {
    if (order.totalQuantityOrdered === 0) return 0;
    return Math.round((order.totalQuantityDelivered / order.totalQuantityOrdered) * 100);
  };

  // Calculate payment progress
  const getPaymentProgress = (order: Order) => {
    if (order.grandTotal === 0) return 100;
    return Math.round((order.amountPaid / order.grandTotal) * 100);
  };

  // Check if order is overdue
  const isOverdue = (order: Order) => {
    if (!order.expectedDeliveryDate) return false;
    return (
      new Date(order.expectedDeliveryDate) < new Date() &&
      order.deliveryStatus !== "COMPLETE" &&
      order.status !== "CANCELLED" &&
      order.status !== "CLOSED"
    );
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
          value={(stats.confirmedOrders + stats.processingOrders).toString()}
          description={t("stats.readyForDelivery")}
          icon={Truck}
        />
        <StatCard
          title={t("stats.overdue")}
          value={stats.overdueDeliveries.toString()}
          description={t("stats.pastDueDate")}
          icon={AlertTriangle}
          trend={stats.overdueDeliveries > 0 ? "down" : undefined}
        />
        <StatCard
          title={t("stats.paymentDue")}
          value={formatCurrency(stats.paymentPending)}
          description={t("stats.outstanding")}
          icon={Wallet}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-2">
        {statusTabs.map((tab) => {
          const count = statusCounts[tab.value] || 0;
          const isActive = statusTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("priority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allPriorities")}</SelectItem>
            <SelectItem value="URGENT">{t("priority.urgent")}</SelectItem>
            <SelectItem value="NORMAL">{t("priority.normal")}</SelectItem>
            <SelectItem value="LOW">{t("priority.low")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-text-muted mb-4" />
            <p className="text-lg font-medium text-text-primary mb-1">
              {t("noOrders")}
            </p>
            <p className="text-sm text-text-muted mb-4">
              {search || statusTab !== "all"
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
        <Card>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-muted hidden md:table-cell">
                      {t("items")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
                      {tCommon("amount")}
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-text-muted hidden lg:table-cell">
                      {t("delivery")}
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-text-muted hidden lg:table-cell">
                      {t("payment")}
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-text-muted">
                      {tCommon("status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const deliveryProgress = getDeliveryProgress(order);
                    const paymentProgress = getPaymentProgress(order);
                    const orderIsOverdue = isOverdue(order);

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
                                {formatDate(order.orderDate)}
                              </span>
                              {order.priority === "URGENT" && (
                                <Badge variant="error" className="text-xs py-0">
                                  {t("priority.urgent")}
                                </Badge>
                              )}
                              {orderIsOverdue && (
                                <Badge variant="error" className="text-xs py-0">
                                  {t("overdue")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-text-primary truncate max-w-[180px]">
                              {order.customerSnapshot.name}
                            </p>
                            {order.expectedDeliveryDate && (
                              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {t("dueBy")} {formatDate(order.expectedDeliveryDate)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-sm text-text-muted">
                            {order.items?.length || 0} {t("itemsCount")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-medium">
                            {formatCurrency(order.grandTotal)}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-center">
                          <Badge 
                            variant={
                              deliveryProgress === 100 ? "success" 
                              : deliveryProgress > 0 ? "warning" 
                              : "error"
                            }
                          >
                            {t(deliveryProgress === 100 ? "deliveryBadge.shipped" : deliveryProgress > 0 ? "deliveryBadge.partial" : "deliveryBadge.pending")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-center">
                          <Badge 
                            variant={
                              paymentProgress === 100 ? "success" 
                              : paymentProgress > 0 ? "warning" 
                              : "error"
                            }
                          >
                            {t(paymentProgress === 100 ? "paymentBadge.paid" : paymentProgress > 0 ? "paymentBadge.partial" : "paymentBadge.unpaid")}
                          </Badge>
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
      )}
    </div>
  );
}
