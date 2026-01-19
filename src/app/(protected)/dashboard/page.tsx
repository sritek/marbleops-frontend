"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wallet,
  Package,
  FileText,
  ShoppingCart,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDashboardStats } from "@/lib/api";
import { useStore } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentStore } = useStore();
  const { data: stats, isLoading } = useDashboardStats();
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("welcome", { name: user?.name?.split(" ")[0] || "" })}
          </h1>
          <p className="text-sm text-text-muted">
            {currentStore?.name || "All Stores"} • {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <Link href="/orders/new">
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Order
            </Link>
          </Button>
          <Button asChild>
            <Link href="/invoices/new">
              <FileText className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("todaysSales")}
          value={stats ? formatCurrency(stats.todaySales.amount) : "—"}
          description={stats ? `${stats.todaySales.count} orders` : undefined}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title={t("pendingPayments")}
          value={stats ? formatCurrency(stats.pendingPayments.amount) : "—"}
          description={
            stats
              ? `${stats.pendingPayments.count} invoices • ${stats.pendingPayments.overdueCount} overdue`
              : undefined
          }
          icon={Wallet}
          isLoading={isLoading}
        />
        <StatCard
          title={t("lowStockAlerts")}
          value={stats?.lowStockAlerts.count ?? "—"}
          description="items need attention"
          icon={AlertTriangle}
          isLoading={isLoading}
        />
        <StatCard
          title={t("activeOrders")}
          value={stats?.activeOrders.count ?? "—"}
          description={
            stats
              ? `${stats.activeOrders.confirmedCount} confirmed`
              : undefined
          }
          icon={ShoppingCart}
          isLoading={isLoading}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{t("actionItems")}</CardTitle>
            <Badge variant="warning">{getActionCount(stats)}</Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <ActionItemsList stats={stats} />
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{t("lowStockAlerts")}</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/inventory?status=low">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : stats?.lowStockAlerts.items.length ? (
              <div className="space-y-3">
                {stats.lowStockAlerts.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-bg">
                        <Package className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {item.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.currentQty} remaining (threshold: {item.threshold})
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inventory/${item.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyActionState
                icon={Package}
                message="All items are well-stocked"
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("quickLinks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <QuickLinkCard
                href="/inventory"
                icon={Package}
                label={tNav("inventory")}
                description="View & manage stock"
              />
              <QuickLinkCard
                href="/orders"
                icon={ShoppingCart}
                label={tNav("orders")}
                description="Track orders"
              />
              <QuickLinkCard
                href="/invoices"
                icon={FileText}
                label={tNav("invoices")}
                description="Billing & payments"
              />
              <QuickLinkCard
                href="/payments"
                icon={Wallet}
                label={tNav("payments")}
                description="Record transactions"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{t("recentActivity")}</CardTitle>
            <Clock className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                type="payment"
                title="Payment received"
                description="₹25,000 from ABC Traders"
                time="2 hours ago"
              />
              <ActivityItem
                type="invoice"
                title="Invoice created"
                description="INV-2024-0123 for XYZ Corp"
                time="4 hours ago"
              />
              <ActivityItem
                type="order"
                title="Order confirmed"
                description="ORD-2024-0089 ready for delivery"
                time="5 hours ago"
              />
              <ActivityItem
                type="inventory"
                title="Stock updated"
                description="5 slabs added to inventory"
                time="Yesterday"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper components

function getActionCount(stats: DashboardStats | undefined): number {
  if (!stats) return 0;
  return (
    stats.pendingPayments.overdueCount +
    stats.lowStockAlerts.count +
    stats.activeOrders.draftCount
  );
}

function ActionItemsList({ stats }: { stats: DashboardStats | undefined }) {
  if (!stats) return null;

  const items: Array<{
    type: string;
    title: string;
    description: string;
    href: string;
    priority: "high" | "medium" | "low";
  }> = [];

  // Add overdue invoices
  if (stats.pendingPayments.overdueCount > 0) {
    items.push({
      type: "overdue",
      title: "Overdue Invoices",
      description: `${stats.pendingPayments.overdueCount} invoices need follow-up`,
      href: "/invoices?status=overdue",
      priority: "high",
    });
  }

  // Add low stock
  if (stats.lowStockAlerts.count > 0) {
    items.push({
      type: "low_stock",
      title: "Low Stock Alert",
      description: `${stats.lowStockAlerts.count} items below threshold`,
      href: "/inventory?status=low",
      priority: "medium",
    });
  }

  // Add draft orders
  if (stats.activeOrders.draftCount > 0) {
    items.push({
      type: "draft",
      title: "Draft Orders",
      description: `${stats.activeOrders.draftCount} orders pending confirmation`,
      href: "/orders?status=draft",
      priority: "low",
    });
  }

  if (items.length === 0) {
    return (
      <EmptyActionState
        icon={TrendingUp}
        message="All caught up! No pending actions."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          className="flex items-center justify-between py-2 px-3 rounded-lg border border-border-subtle hover:bg-bg-app transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                item.priority === "high"
                  ? "bg-error-bg"
                  : item.priority === "medium"
                  ? "bg-warning-bg"
                  : "bg-info-bg"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  item.priority === "high"
                    ? "text-error"
                    : item.priority === "medium"
                    ? "text-warning"
                    : "text-info"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {item.title}
              </p>
              <p className="text-xs text-text-muted">{item.description}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted" />
        </Link>
      ))}
    </div>
  );
}

function EmptyActionState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-app mb-3">
        <Icon className="h-5 w-5 text-text-muted" />
      </div>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function QuickLinkCard({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-subtle hover:bg-bg-app hover:border-border-strong transition-colors text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
    </Link>
  );
}

function ActivityItem({
  type,
  title,
  description,
  time,
}: {
  type: string;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-app shrink-0 mt-0.5">
        {type === "payment" && <Wallet className="h-4 w-4 text-success" />}
        {type === "invoice" && <FileText className="h-4 w-4 text-info" />}
        {type === "order" && <ShoppingCart className="h-4 w-4 text-primary-600" />}
        {type === "inventory" && <Package className="h-4 w-4 text-primary-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted truncate">{description}</p>
      </div>
      <span className="text-xs text-text-muted whitespace-nowrap">{time}</span>
    </div>
  );
}

// Type for DashboardStats (simplified for component use)
interface DashboardStats {
  todaySales: { amount: number; count: number };
  pendingPayments: { amount: number; count: number; overdueCount: number };
  lowStockAlerts: {
    count: number;
    items: Array<{ id: string; name: string; currentQty: number; threshold: number }>;
  };
  activeOrders: { count: number; draftCount: number; confirmedCount: number };
}
