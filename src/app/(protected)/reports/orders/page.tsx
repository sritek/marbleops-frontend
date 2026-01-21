"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  ShoppingCart,
  IndianRupee,
  CheckCircle,
  Clock,
  Users,
  Truck,
  TrendingUp,
  Target,
  AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { useStore } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DateRangeFilter,
  useDateRangeFilter,
  MonthlyChart,
  StockPieChart,
} from "@/components/features";
import { exportOrderReportToExcel, exportOrderReportToPDF } from "@/lib/export-utils";
import {
  mockOrders,
  getMockOrderStats,
  getMockTopCustomers,
  getMockOverdueOrders,
} from "@/lib/mock/orders";
import type { StockCategoryData, StackedChartData, OrderStatus } from "@/types";

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

// Calculate status distribution from mock orders
const calculateStatusDistribution = (): StockCategoryData[] => {
  const byStatus: Record<string, number> = {};
  
  mockOrders.forEach((order) => {
    byStatus[order.status] = (byStatus[order.status] || 0) + order.grandTotal;
  });

  const statusColors: Record<string, string> = {
    DELIVERED: "#22c55e",
    CLOSED: "#16a34a",
    CONFIRMED: "#3b82f6",
    PROCESSING: "#8b5cf6",
    PARTIALLY_DELIVERED: "#f59e0b",
    DRAFT: "#6b7280",
    CANCELLED: "#ef4444",
    ON_HOLD: "#94a3b8",
  };

  return Object.entries(byStatus)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase().replace(/_/g, " "),
      value,
      color: statusColors[name] || "#6b7280",
    }));
};

// Calculate order trend (monthly data)
const calculateOrderTrend = (): StackedChartData[] => {
  const monthlyData: Record<string, { orders: number; cancelled: number }> = {
    Aug: { orders: 850000, cancelled: 45000 },
    Sep: { orders: 1200000, cancelled: 60000 },
    Oct: { orders: 980000, cancelled: 35000 },
    Nov: { orders: 1450000, cancelled: 80000 },
    Dec: { orders: 1100000, cancelled: 55000 },
    Jan: { orders: 0, cancelled: 0 },
  };

  // Add current month from mock orders
  mockOrders
    .filter((o) => o.status !== "CANCELLED")
    .forEach((order) => {
      monthlyData["Jan"].orders += order.grandTotal;
    });
  mockOrders
    .filter((o) => o.status === "CANCELLED")
    .forEach((order) => {
      monthlyData["Jan"].cancelled += order.grandTotal;
    });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    amount: data.orders,
    returnAmount: data.cancelled,
  }));
};

// Derive report orders from mock data
const deriveReportOrders = () => {
  return mockOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.orderDate,
    customer: order.customerSnapshot.name,
    items: order.items?.length || 0,
    amount: order.grandTotal,
    status: order.status,
  }));
};

export default function OrderReportPage() {
  const router = useRouter();
  const canViewReports = usePermission("REPORTS_VIEW");
  const { currentStore } = useStore();
  const t = useTranslations("orderReport");
  const tCommon = useTranslations("common");
  const { dateRange, setDateRange, startDateISO, endDateISO } = useDateRangeFilter("month");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Get stats from mock data
  const stats = React.useMemo(() => getMockOrderStats(), []);
  const topCustomers = React.useMemo(() => getMockTopCustomers(5), []);
  const overdueOrders = React.useMemo(() => getMockOverdueOrders(), []);
  const statusDistribution = React.useMemo(() => calculateStatusDistribution(), []);
  const orderTrend = React.useMemo(() => calculateOrderTrend(), []);
  const reportOrders = React.useMemo(() => deriveReportOrders(), []);

  // Filter orders for table
  const filteredOrders = React.useMemo(() => {
    if (statusFilter === "all") return reportOrders;
    return reportOrders.filter((order) => order.status === statusFilter);
  }, [reportOrders, statusFilter]);

  // Calculate fulfillment metrics
  const fulfillmentMetrics = React.useMemo(() => {
    const deliveredOrders = mockOrders.filter(
      (o) => o.status === "DELIVERED" || o.status === "CLOSED"
    );
    const totalWithDelivery = mockOrders.filter(
      (o) => o.expectedDeliveryDate && o.status !== "CANCELLED"
    );
    
    const onTimeDeliveries = totalWithDelivery.filter((o) => {
      if (!o.expectedDeliveryDate) return false;
      if (o.deliveryStatus !== "COMPLETE") return false;
      // Assume delivered on time for mock data
      return true;
    });

    const fullDeliveries = deliveredOrders.filter(
      (o) => o.totalQuantityDelivered === o.totalQuantityOrdered
    );

    return {
      onTimeRate: totalWithDelivery.length > 0 
        ? Math.round((onTimeDeliveries.length / totalWithDelivery.length) * 100) 
        : 0,
      firstTimeFillRate: deliveredOrders.length > 0 
        ? Math.round((fullDeliveries.length / deliveredOrders.length) * 100) 
        : 0,
      avgCycleTime: 4.2, // Mock average
    };
  }, []);

  // Export summary for functions
  const exportSummary = {
    totalOrders: stats.totalOrders,
    totalValue: stats.totalValue,
    confirmedOrders: stats.confirmedOrders,
    deliveredOrders: stats.deliveredOrders,
    pendingOrders: stats.draftOrders,
    cancelledOrders: stats.cancelledOrders,
  };

  // Export handlers
  const handleExportExcel = () => {
    exportOrderReportToExcel({
      summary: exportSummary,
      orders: reportOrders,
      topCustomers: topCustomers.map((c) => ({
        name: c.customerName,
        orderCount: c.orderCount,
        totalAmount: c.totalValue,
      })),
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `order-report-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  const handleExportPDF = () => {
    exportOrderReportToPDF({
      summary: exportSummary,
      statusDistribution,
      topCustomers: topCustomers.map((c) => ({
        name: c.customerName,
        orderCount: c.orderCount,
        totalAmount: c.totalValue,
      })),
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `order-report-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  if (!canViewReports) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
              <p className="text-sm text-text-muted">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  {t("export")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t("exportExcel")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("exportPDF")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Summary Stats - Row 1 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalOrders")}
          value={stats.totalOrders.toString()}
          description={t("ordersInPeriod")}
          icon={ShoppingCart}
        />
        <StatCard
          title={t("orderValue")}
          value={formatCurrency(stats.totalValue)}
          description={t("totalValue")}
          icon={IndianRupee}
        />
        <StatCard
          title={t("confirmedOrders")}
          value={stats.confirmedOrders.toString()}
          description={t("readyToProcess")}
          icon={CheckCircle}
        />
        <StatCard
          title={t("deliveredOrders")}
          value={stats.deliveredOrders.toString()}
          description={t("completed")}
          icon={Truck}
        />
      </div>

      {/* Summary Stats - Row 2 (Fulfillment) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("pendingOrders")}
          value={stats.draftOrders.toString()}
          description={t("awaitingConfirmation")}
          icon={Clock}
        />
        <StatCard
          title="On-Time Delivery"
          value={`${fulfillmentMetrics.onTimeRate}%`}
          description="Target: 95%"
          icon={Target}
          trend={fulfillmentMetrics.onTimeRate >= 95 ? "up" : "down"}
        />
        <StatCard
          title="First-Time Fill Rate"
          value={`${fulfillmentMetrics.firstTimeFillRate}%`}
          description="Complete in first delivery"
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Cycle Time"
          value={`${fulfillmentMetrics.avgCycleTime} days`}
          description="Order to delivery"
          icon={Clock}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("orderTrend")}</CardTitle>
            <p className="text-xs text-text-muted">{t("monthlyOrders")}</p>
          </CardHeader>
          <CardContent>
            <MonthlyChart
              data={orderTrend}
              stacked
              primaryColor="var(--chart-sales)"
              secondaryColor="var(--chart-sales-return)"
              primaryLabel={t("orders")}
              secondaryLabel={t("cancelled")}
            />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("statusDistribution")}</CardTitle>
            <p className="text-xs text-text-muted">{t("ordersByStatus")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart
              data={statusDistribution}
              unit="₹"
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Customers, Overdue, and Orders Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Customers */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              <CardTitle className="text-base">{t("topCustomers")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border-subtle hover:bg-bg-app transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate max-w-[150px]">
                        {customer.customerName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {customer.orderCount} {t("orders")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCurrency(customer.totalValue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent/Filtered Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{t("recentOrders")}</CardTitle>
                <p className="text-xs text-text-muted">{t("latestOrders")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t("allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="DELIVERED">{t("delivered")}</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="CONFIRMED">{t("confirmed")}</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="PARTIALLY_DELIVERED">Partial</SelectItem>
                    <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                    <SelectItem value="CANCELLED">{tCommon("cancelled")}</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="link" size="sm" asChild>
                  <Link href="/orders">{tCommon("viewAll")}</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-bg-surface z-10">
                  <tr className="border-b border-border-subtle">
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("orderNumber")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("date")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("customer")}
                    </th>
                    <th className="text-center text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("items")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("amount")}
                    </th>
                    <th className="text-center text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {tCommon("status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-app transition-colors cursor-pointer"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-primary-600">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {new Date(order.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-primary truncate max-w-[150px] block">
                          {order.customer}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {order.items}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(order.amount)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Badge variant={statusVariants[order.status as OrderStatus] || "default"}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Orders Alert */}
      {overdueOrders.length > 0 && (
        <Card className="border-warning-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-500" />
              <CardTitle className="text-base text-warning-700">
                Overdue Deliveries ({overdueOrders.length})
              </CardTitle>
            </div>
            <p className="text-xs text-text-muted">Orders past expected delivery date</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3">
                      Order #
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3">
                      Customer
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3">
                      Expected Date
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3">
                      Amount
                    </th>
                    <th className="text-center text-xs font-medium text-text-muted py-3 px-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overdueOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-warning-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-primary-600">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-primary">
                          {order.customerSnapshot.name}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-error font-medium">
                          {order.expectedDeliveryDate
                            ? new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(order.grandTotal)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Badge variant={statusVariants[order.status]}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
