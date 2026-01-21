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
  TrendingDown,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Box,
  Grid3X3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDashboardStats } from "@/lib/api";
import { useStore } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { 
  DateRangeFilter, 
  useDateRangeFilter, 
  MonthlyChart,
  StockPieChart,
  StockDetailCard,
  LowStockTable,
} from "@/components/features";
import type { StackedChartData, StockCategoryData, StockMetric, StockParty, LowStockItem } from "@/components/features";

// Mock data for stacked charts (sales with returns)
const mockSalesWithReturns: StackedChartData[] = [
  { month: "Aug", amount: 125000, returnAmount: 5000 },
  { month: "Sep", amount: 180000, returnAmount: 8000 },
  { month: "Oct", amount: 145000, returnAmount: 6000 },
  { month: "Nov", amount: 220000, returnAmount: 12000 },
  { month: "Dec", amount: 195000, returnAmount: 9000 },
  { month: "Jan", amount: 165000, returnAmount: 7000 },
];

// Mock data for stacked charts (purchase with returns)
const mockPurchaseWithReturns: StackedChartData[] = [
  { month: "Aug", amount: 85000, returnAmount: 3000 },
  { month: "Sep", amount: 120000, returnAmount: 5000 },
  { month: "Oct", amount: 95000, returnAmount: 4000 },
  { month: "Nov", amount: 150000, returnAmount: 7000 },
  { month: "Dec", amount: 130000, returnAmount: 6000 },
  { month: "Jan", amount: 110000, returnAmount: 4500 },
];

// Mock data for stock by category pie chart (Material Types) - Blue/Purple palette
const mockStockByCategory: StockCategoryData[] = [
  { name: "Italian Marble", value: 18500, color: "#2563eb" },  // Blue
  { name: "Indian Marble", value: 14200, color: "#3b82f6" },   // Light Blue
  { name: "Granite", value: 12800, color: "#6366f1" },         // Indigo
  { name: "Quartzite", value: 8500, color: "#8b5cf6" },        // Purple
  { name: "Porcelain Tiles", value: 6200, color: "#a855f7" },  // Violet
  { name: "Ceramic Tiles", value: 4800, color: "#c084fc" },    // Light Violet
  { name: "Onyx", value: 2100, color: "#e879f9" },             // Pink
];

// Mock data for stock by form pie chart (Stone Forms) - Warm palette (Orange/Green)
const mockStockByForm: StockCategoryData[] = [
  { name: "Slabs", value: 28500, color: "#f97316" },           // Orange
  { name: "Blocks", value: 15200, color: "#fb923c" },          // Light Orange
  { name: "Cut-to-Size", value: 9800, color: "#22c55e" },      // Green
  { name: "Tiles (60x60)", value: 7500, color: "#4ade80" },    // Light Green
  { name: "Tiles (80x80)", value: 5200, color: "#14b8a6" },    // Teal
  { name: "Countertops", value: 3800, color: "#06b6d4" },      // Cyan
];

// Mock data for slab stock card
const mockSlabStock: { metrics: StockMetric[]; parties: StockParty[] } = {
  metrics: [
    { label: "Total Sq Ft", value: "15,420", highlight: true },
    { label: "Total Slabs", value: 245 },
    { label: "Total Pieces", value: 312 },
  ],
  parties: [
    { name: "Rajasthan Marble Co.", material: "Italian White", quantity: "3,200 sq ft" },
    { name: "Gujarat Stones Ltd.", material: "Black Galaxy", quantity: "2,850 sq ft" },
    { name: "Makrana Exports", material: "Makrana White", quantity: "2,100 sq ft" },
    { name: "South Indian Granites", material: "Tan Brown", quantity: "1,800 sq ft" },
  ],
};

// Mock data for block stock card
const mockBlockStock: { metrics: StockMetric[]; parties: StockParty[] } = {
  metrics: [
    { label: "Total Tons", value: "125.5", highlight: true },
    { label: "Total Blocks", value: 48 },
  ],
  parties: [
    { name: "Kishangarh Quarries", material: "Fantasy Brown", quantity: "32 tons" },
    { name: "Udaipur Minerals", material: "Green Marble", quantity: "28 tons" },
    { name: "Jaipur Stone Works", material: "Pink Marble", quantity: "22 tons" },
  ],
};

// Mock data for tiles stock card
const mockTilesStock: { metrics: StockMetric[]; parties: StockParty[] } = {
  metrics: [
    { label: "Total Sq Ft", value: "8,750", highlight: true },
    { label: "Total Batches", value: 85 },
    { label: "Total Pieces", value: 4200 },
  ],
  parties: [
    { name: "Morbi Ceramics", material: "Porcelain 60x60", quantity: "2,500 sq ft" },
    { name: "Kajaria Tiles", material: "Vitrified 80x80", quantity: "2,100 sq ft" },
    { name: "Somany Ceramics", material: "Floor Tiles", quantity: "1,800 sq ft" },
  ],
};

// Mock data for low stock table
const mockLowStockItems: LowStockItem[] = [
  { id: "1", name: "Italian White Marble", materialType: "Marble", currentQty: 5, threshold: 20, unit: "slabs" },
  { id: "2", name: "Black Galaxy Granite", materialType: "Granite", currentQty: 3, threshold: 15, unit: "slabs" },
  { id: "3", name: "Porcelain 60x60 White", materialType: "Tile", currentQty: 45, threshold: 100, unit: "pcs" },
  { id: "4", name: "Fantasy Brown Block", materialType: "Marble", currentQty: 2, threshold: 10, unit: "blocks" },
  { id: "5", name: "Tan Brown Granite", materialType: "Granite", currentQty: 8, threshold: 25, unit: "slabs" },
];

// Mock data for dashboard stats (for preview/testing)
const mockDashboardStats = {
  // Main stat cards
  sales: { amount: 485000, count: 24 },
  purchase: { amount: 320000, count: 18 },
  paymentIn: { amount: 275000, count: 32 },
  paymentOut: { amount: 180000, count: 15 },
  // Action items
  pendingPayments: { amount: 125000, count: 8, overdueCount: 3 },
  lowStockAlerts: { count: 5, items: [] },
  activeOrders: { count: 12, draftCount: 4, confirmedCount: 8 },
  pendingDeliveries: { count: 6 },
  paymentReminders: { count: 8 },
  expiringQuotations: { count: 3 },
  pendingPurchaseOrders: { count: 5 },
  pendingReturns: { count: 2 },
  incompleteProfiles: { count: 7 },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentStore } = useStore();
  const { dateRange, setDateRange, startDateISO, endDateISO } = useDateRangeFilter("today");
  const { data: stats, isLoading } = useDashboardStats({
    startDate: startDateISO,
    endDate: endDateISO,
  });
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" asChild className="flex-1 sm:flex-none">
              <Link href="/orders/new">
                <ShoppingCart className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">{t("newOrder")}</span>
                <span className="xs:hidden">Order</span>
              </Link>
            </Button>
            <Button asChild className="flex-1 sm:flex-none">
              <Link href="/invoices/new">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">{t("newInvoice")}</span>
                <span className="xs:hidden">Invoice</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-muted">Overview</p>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Stats Grid - New cards: Sales, Purchase, Payment In, Payment Out */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("sales")}
          value={formatCurrency(stats?.sales?.amount ?? stats?.todaySales?.amount ?? mockDashboardStats.sales.amount)}
          description={`${stats?.sales?.count ?? stats?.todaySales?.count ?? mockDashboardStats.sales.count} ${t("invoices")}`}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title={t("purchase")}
          value={formatCurrency(stats?.purchase?.amount ?? mockDashboardStats.purchase.amount)}
          description={`${stats?.purchase?.count ?? mockDashboardStats.purchase.count} ${t("invoices")}`}
          icon={TrendingDown}
          isLoading={isLoading}
        />
        <StatCard
          title={t("paymentIn")}
          value={formatCurrency(stats?.paymentIn?.amount ?? mockDashboardStats.paymentIn.amount)}
          description={`${stats?.paymentIn?.count ?? mockDashboardStats.paymentIn.count} ${t("transactions")}`}
          icon={ArrowDownLeft}
          isLoading={isLoading}
        />
        <StatCard
          title={t("paymentOut")}
          value={formatCurrency(stats?.paymentOut?.amount ?? mockDashboardStats.paymentOut.amount)}
          description={`${stats?.paymentOut?.count ?? mockDashboardStats.paymentOut.count} ${t("transactions")}`}
          icon={ArrowUpRight}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Grid - Sales and Purchase Overview with Stacked Returns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart with Returns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">{t("salesOverview")}</CardTitle>
              <p className="text-xs text-text-muted mt-1">{t("monthlyTrend")}</p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href="/reports?type=sales">
                {t("viewReports")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <MonthlyChart 
              data={mockSalesWithReturns}
              stacked
              primaryColor="var(--chart-sales)"
              secondaryColor="var(--chart-sales-return)"
              primaryLabel={t("sales")}
              secondaryLabel={t("salesReturn")}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Purchase Chart with Returns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">{t("purchaseOverview")}</CardTitle>
              <p className="text-xs text-text-muted mt-1">{t("monthlyTrend")}</p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href="/reports?type=purchase">
                {t("viewReports")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <MonthlyChart 
              data={mockPurchaseWithReturns}
              stacked
              primaryColor="var(--chart-purchase)"
              secondaryColor="var(--chart-purchase-return)"
              primaryLabel={t("purchase")}
              secondaryLabel={t("purchaseReturn")}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Stock Pie Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("stockByCategory")}</CardTitle>
            <p className="text-xs text-text-muted mt-1">{t("materialDistribution")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart 
              data={mockStockByCategory}
              unit="sq ft"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Stock by Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("stockByForm")}</CardTitle>
            <p className="text-xs text-text-muted mt-1">{t("formDistribution")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart 
              data={mockStockByForm}
              unit="sq ft"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Stock Detail Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Slab Stock Card */}
        <StockDetailCard
          title={t("slabStock")}
          icon={Layers}
          metrics={mockSlabStock.metrics}
          parties={mockSlabStock.parties}
          isLoading={isLoading}
        />

        {/* Block Stock Card */}
        <StockDetailCard
          title={t("blockStock")}
          icon={Box}
          metrics={mockBlockStock.metrics}
          parties={mockBlockStock.parties}
          isLoading={isLoading}
        />

        {/* Tiles Stock Card */}
        <StockDetailCard
          title={t("tilesStock")}
          icon={Grid3X3}
          metrics={mockTilesStock.metrics}
          parties={mockTilesStock.parties}
          isLoading={isLoading}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{t("actionItems")}</CardTitle>
            <Badge variant="warning">{getActionCount({ ...mockDashboardStats, ...stats })}</Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <ActionItemsList stats={{ ...mockDashboardStats, ...stats }} />
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">{t("lowStockAlerts")}</CardTitle>
              <p className="text-xs text-text-muted mt-1">{t("itemsBelowThreshold")}</p>
            </div>
            <Badge variant="warning">
              {stats?.lowStockAlerts?.count ?? mockLowStockItems.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <LowStockTable
              items={stats?.lowStockAlerts?.items?.map(item => ({
                id: item.id,
                name: item.name,
                materialType: "Stone",
                currentQty: item.currentQty,
                threshold: item.threshold,
              })) ?? mockLowStockItems}
              isLoading={isLoading}
              maxItems={5}
              showViewAll={true}
            />
          </CardContent>
        </Card>

        {/* Quick Links */}
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
                description={t("viewManageStock")}
              />
              <QuickLinkCard
                href="/orders"
                icon={ShoppingCart}
                label={tNav("orders")}
                description={t("trackOrders")}
              />
              <QuickLinkCard
                href="/invoices"
                icon={FileText}
                label={tNav("invoices")}
                description={t("billingPayments")}
              />
              <QuickLinkCard
                href="/payments"
                icon={Wallet}
                label={tNav("payments")}
                description={t("recordTransactions")}
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
    (stats.pendingPayments?.overdueCount ?? 0) +
    (stats.lowStockAlerts?.count ?? 0) +
    (stats.activeOrders?.draftCount ?? 0) +
    (stats.pendingDeliveries?.count ?? 0) +
    (stats.paymentReminders?.count ?? 0) +
    (stats.expiringQuotations?.count ?? 0) +
    (stats.pendingPurchaseOrders?.count ?? 0) +
    (stats.pendingReturns?.count ?? 0) +
    (stats.incompleteProfiles?.count ?? 0)
  );
}

function ActionItemsList({ stats }: { stats: DashboardStats | undefined }) {
  const t = useTranslations("dashboard");
  
  if (!stats) return null;

  const items: Array<{
    type: string;
    title: string;
    description: string;
    href: string;
    priority: "high" | "medium" | "low";
  }> = [];

  // Add overdue invoices
  if (stats.pendingPayments?.overdueCount && stats.pendingPayments.overdueCount > 0) {
    items.push({
      type: "overdue",
      title: t("overdueTitle"),
      description: t("overdueInvoices", { count: stats.pendingPayments.overdueCount }),
      href: "/invoices?status=overdue",
      priority: "high",
    });
  }

  // Add low stock
  if (stats.lowStockAlerts?.count && stats.lowStockAlerts.count > 0) {
    items.push({
      type: "low_stock",
      title: t("lowStockTitle"),
      description: t("lowStockItems", { count: stats.lowStockAlerts.count }),
      href: "/inventory?status=low",
      priority: "medium",
    });
  }

  // Add draft orders
  if (stats.activeOrders?.draftCount && stats.activeOrders.draftCount > 0) {
    items.push({
      type: "draft",
      title: t("draftTitle"),
      description: t("draftOrders", { count: stats.activeOrders.draftCount }),
      href: "/orders?status=draft",
      priority: "low",
    });
  }

  // Add pending deliveries (high priority)
  if (stats.pendingDeliveries?.count && stats.pendingDeliveries.count > 0) {
    items.push({
      type: "delivery",
      title: t("pendingDeliveriesTitle"),
      description: t("pendingDeliveries", { count: stats.pendingDeliveries.count }),
      href: "/orders?status=confirmed&delivery=today",
      priority: "high",
    });
  }

  // Add payment reminders (high priority)
  if (stats.paymentReminders?.count && stats.paymentReminders.count > 0) {
    items.push({
      type: "reminder",
      title: t("paymentRemindersTitle"),
      description: t("paymentReminders", { count: stats.paymentReminders.count }),
      href: "/invoices?status=due",
      priority: "high",
    });
  }

  // Add expiring quotations (medium priority)
  if (stats.expiringQuotations?.count && stats.expiringQuotations.count > 0) {
    items.push({
      type: "quotation",
      title: t("expiringQuotationsTitle"),
      description: t("expiringQuotations", { count: stats.expiringQuotations.count }),
      href: "/quotations?status=expiring",
      priority: "medium",
    });
  }

  // Add pending purchase orders (medium priority)
  if (stats.pendingPurchaseOrders?.count && stats.pendingPurchaseOrders.count > 0) {
    items.push({
      type: "purchase",
      title: t("pendingPurchaseTitle"),
      description: t("pendingPurchase", { count: stats.pendingPurchaseOrders.count }),
      href: "/purchases?status=pending",
      priority: "medium",
    });
  }

  // Add pending returns (medium priority)
  if (stats.pendingReturns?.count && stats.pendingReturns.count > 0) {
    items.push({
      type: "return",
      title: t("pendingReturnsTitle"),
      description: t("pendingReturns", { count: stats.pendingReturns.count }),
      href: "/returns?status=pending",
      priority: "medium",
    });
  }

  // Add incomplete profiles (low priority)
  if (stats.incompleteProfiles?.count && stats.incompleteProfiles.count > 0) {
    items.push({
      type: "profile",
      title: t("incompleteProfilesTitle"),
      description: t("incompleteProfiles", { count: stats.incompleteProfiles.count }),
      href: "/parties?complete=false",
      priority: "low",
    });
  }

  if (items.length === 0) {
    return (
      <EmptyActionState
        icon={TrendingUp}
        message={t("allCaughtUp")}
      />
    );
  }

  return (
    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
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
                  ? "bg-error/10"
                  : item.priority === "medium"
                  ? "bg-warning/10"
                  : "bg-info/10"
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
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {item.title}
              </p>
              <p className="text-xs text-text-muted truncate">{item.description}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
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
      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-subtle hover:bg-bg-app hover:border-border-subtle transition-colors text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted line-clamp-1">{description}</p>
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
      <span className="text-xs text-text-muted whitespace-nowrap shrink-0">{time}</span>
    </div>
  );
}

// Type for DashboardStats (simplified for component use)
interface DashboardStats {
  // New fields
  sales?: { amount: number; count: number };
  purchase?: { amount: number; count: number };
  paymentIn?: { amount: number; count: number };
  paymentOut?: { amount: number; count: number };
  // Legacy fields
  todaySales?: { amount: number; count: number };
  pendingPayments?: { amount: number; count: number; overdueCount: number };
  lowStockAlerts?: {
    count: number;
    items: Array<{ id: string; name: string; currentQty: number; threshold: number }>;
  };
  activeOrders?: { count: number; draftCount: number; confirmedCount: number };
  // Action items fields
  pendingDeliveries?: { count: number };
  paymentReminders?: { count: number };
  expiringQuotations?: { count: number };
  pendingPurchaseOrders?: { count: number };
  pendingReturns?: { count: number };
  incompleteProfiles?: { count: number };
}
