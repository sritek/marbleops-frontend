"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Receipt,
  RotateCcw,
  Users,
  Package,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { useStore } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DateRangeFilter,
  useDateRangeFilter,
  MonthlyChart,
  StockPieChart,
} from "@/components/features";
import { exportSalesReportToExcel, exportSalesReportToPDF } from "@/lib/export-utils";
import type { StackedChartData, StockCategoryData } from "@/components/features";

// Mock data for sales report
const mockSalesTrend: StackedChartData[] = [
  { month: "Aug", amount: 125000, returnAmount: 5000 },
  { month: "Sep", amount: 180000, returnAmount: 8000 },
  { month: "Oct", amount: 145000, returnAmount: 6000 },
  { month: "Nov", amount: 220000, returnAmount: 12000 },
  { month: "Dec", amount: 195000, returnAmount: 9000 },
  { month: "Jan", amount: 165000, returnAmount: 7000 },
];

const mockSalesByCategory: StockCategoryData[] = [
  { name: "Italian Marble", value: 285000, color: "#2563eb" },
  { name: "Indian Marble", value: 195000, color: "#3b82f6" },
  { name: "Granite", value: 165000, color: "#6366f1" },
  { name: "Porcelain Tiles", value: 125000, color: "#8b5cf6" },
  { name: "Ceramic Tiles", value: 85000, color: "#a855f7" },
  { name: "Others", value: 45000, color: "#c084fc" },
];

const mockTopCustomers = [
  { id: "1", name: "ABC Constructions Pvt Ltd", amount: 285000, invoiceCount: 12 },
  { id: "2", name: "XYZ Builders", amount: 195000, invoiceCount: 8 },
  { id: "3", name: "Sharma Interiors", amount: 165000, invoiceCount: 15 },
  { id: "4", name: "Modern Homes", amount: 125000, invoiceCount: 6 },
  { id: "5", name: "Elite Designs", amount: 98000, invoiceCount: 9 },
];

const mockTopProducts = [
  { id: "1", name: "Italian White Marble", quantity: 450, unit: "sq ft", amount: 225000 },
  { id: "2", name: "Black Galaxy Granite", quantity: 320, unit: "sq ft", amount: 176000 },
  { id: "3", name: "Makrana White", quantity: 280, unit: "sq ft", amount: 154000 },
  { id: "4", name: "Porcelain 60x60", quantity: 520, unit: "pcs", amount: 125000 },
  { id: "5", name: "Fantasy Brown", quantity: 180, unit: "sq ft", amount: 108000 },
];

const mockTransactions = [
  { id: "1", invoiceNumber: "INV-2024-0156", date: "2024-01-18", customer: "ABC Constructions Pvt Ltd", items: 5, amount: 45000, status: "PAID" },
  { id: "2", invoiceNumber: "INV-2024-0155", date: "2024-01-17", customer: "XYZ Builders", items: 3, amount: 32000, status: "PAID" },
  { id: "3", invoiceNumber: "INV-2024-0154", date: "2024-01-16", customer: "Sharma Interiors", items: 8, amount: 68000, status: "ISSUED" },
  { id: "4", invoiceNumber: "INV-2024-0153", date: "2024-01-15", customer: "Modern Homes", items: 2, amount: 25000, status: "PAID" },
  { id: "5", invoiceNumber: "INV-2024-0152", date: "2024-01-14", customer: "Elite Designs", items: 4, amount: 38000, status: "ISSUED" },
  { id: "6", invoiceNumber: "INV-2024-0151", date: "2024-01-13", customer: "Royal Marble House", items: 6, amount: 52000, status: "PAID" },
  { id: "7", invoiceNumber: "INV-2024-0150", date: "2024-01-12", customer: "Stone World", items: 3, amount: 28000, status: "PAID" },
  { id: "8", invoiceNumber: "INV-2024-0149", date: "2024-01-11", customer: "Granite Gallery", items: 7, amount: 75000, status: "DRAFT" },
];

const mockSummary = {
  totalSales: 1030000,
  invoiceCount: 48,
  averageInvoiceValue: 21458,
  returnsAmount: 47000,
  previousPeriodSales: 920000,
};

// Status badge variants
const statusVariants: Record<string, "success" | "warning" | "default" | "error"> = {
  PAID: "success",
  ISSUED: "warning",
  DRAFT: "default",
  CANCELLED: "error",
};

export default function SalesReportPage() {
  const router = useRouter();
  const canViewReports = usePermission("REPORTS_VIEW");
  const { currentStore } = useStore();
  const t = useTranslations("salesReport");
  const tCommon = useTranslations("common");
  const { dateRange, setDateRange, startDateISO, endDateISO } = useDateRangeFilter("month");
  const [isLoading, setIsLoading] = React.useState(false);

  // Calculate percentage change
  const percentChange = mockSummary.previousPeriodSales > 0
    ? ((mockSummary.totalSales - mockSummary.previousPeriodSales) / mockSummary.previousPeriodSales) * 100
    : 0;

  // Export handlers
  const handleExportExcel = () => {
    const exportData = {
      summary: mockSummary,
      transactions: mockTransactions,
      dateRange: {
        startDate: startDateISO,
        endDate: endDateISO,
      },
    };
    exportSalesReportToExcel(exportData, {
      filename: `sales-report-${new Date().toISOString().split("T")[0]}`,
    });
  };

  const handleExportPDF = () => {
    const exportData = {
      summary: mockSummary,
      transactions: mockTransactions,
      dateRange: {
        startDate: startDateISO,
        endDate: endDateISO,
      },
    };
    exportSalesReportToPDF(exportData, {
      filename: `sales-report-${new Date().toISOString().split("T")[0]}`,
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

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalSales")}
          value={formatCurrency(mockSummary.totalSales)}
          description={percentChange >= 0 ? `+${percentChange.toFixed(1)}% vs last period` : `${percentChange.toFixed(1)}% vs last period`}
          icon={TrendingUp}
          trend={percentChange >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(percentChange).toFixed(1)}%`}
          isLoading={isLoading}
        />
        <StatCard
          title={t("totalInvoices")}
          value={mockSummary.invoiceCount.toString()}
          description={t("invoicesGenerated")}
          icon={Receipt}
          isLoading={isLoading}
        />
        <StatCard
          title={t("averageValue")}
          value={formatCurrency(mockSummary.averageInvoiceValue)}
          description={t("perInvoice")}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title={t("returns")}
          value={formatCurrency(mockSummary.returnsAmount)}
          description={t("refundsProcessed")}
          icon={RotateCcw}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("salesTrend")}</CardTitle>
            <p className="text-xs text-text-muted">{t("monthlyBreakdown")}</p>
          </CardHeader>
          <CardContent>
            <MonthlyChart
              data={mockSalesTrend}
              stacked
              primaryColor="var(--chart-sales)"
              secondaryColor="var(--chart-sales-return)"
              primaryLabel={t("sales")}
              secondaryLabel={t("returns")}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("salesByCategory")}</CardTitle>
            <p className="text-xs text-text-muted">{t("materialBreakdown")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart
              data={mockSalesByCategory}
              unit="₹"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Customers */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              <CardTitle className="text-base">{t("topCustomers")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {mockTopCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border-subtle hover:bg-bg-app transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {customer.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {customer.invoiceCount} {t("invoices")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCurrency(customer.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              <CardTitle className="text-base">{t("topProducts")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {mockTopProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border-subtle hover:bg-bg-app transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {product.quantity} {product.unit}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCurrency(product.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("recentTransactions")}</CardTitle>
              <p className="text-xs text-text-muted">{t("latestInvoices")}</p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href="/invoices">{tCommon("viewAll")}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-bg-surface z-10">
                  <tr className="border-b border-border-subtle">
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("invoiceNumber")}
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
                <tbody className="max-h-[320px] overflow-y-auto">
                  {mockTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-app transition-colors cursor-pointer"
                      onClick={() => router.push(`/invoices/${transaction.id}`)}
                    >
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-primary-600">
                          {transaction.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {new Date(transaction.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-primary">
                          {transaction.customer}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {transaction.items}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Badge variant={statusVariants[transaction.status] || "default"}>
                          {transaction.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
