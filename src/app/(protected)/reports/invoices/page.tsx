"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Receipt,
  IndianRupee,
  CheckCircle,
  Clock,
  Users,
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
import { exportInvoiceReportToExcel, exportInvoiceReportToPDF } from "@/lib/export-utils";
import { mockInvoices as fullMockInvoices } from "@/lib/mock/invoices";
import type { StockCategoryData, StackedChartData } from "@/types";

// Transform full invoices to report format
const reportInvoices = fullMockInvoices
  .filter((inv) => inv.invoiceType === "TAX_INVOICE") // Exclude credit notes
  .map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    date: inv.invoiceDate,
    customer: inv.buyer.name,
    dueDate: inv.dueDate || inv.invoiceDate,
    amount: inv.totalAmount,
    paidAmount: inv.paidAmount,
    status: inv.status,
  }));

// Calculate summary from real data
const calculateSummary = () => {
  const taxInvoices = fullMockInvoices.filter(
    (inv) => inv.invoiceType === "TAX_INVOICE" && inv.status !== "CANCELLED"
  );
  const totalInvoiced = taxInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = taxInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const outstandingAmount = taxInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  const overdueCount = taxInvoices.filter((inv) => inv.status === "OVERDUE").length;

  return {
    totalInvoiced,
    paidAmount,
    outstandingAmount,
    averageInvoiceValue: taxInvoices.length > 0 ? Math.round(totalInvoiced / taxInvoices.length) : 0,
    invoiceCount: taxInvoices.length,
    overdueCount,
  };
};

const mockSummary = calculateSummary();

// Calculate status distribution from real data
const calculateStatusDistribution = (): StockCategoryData[] => {
  const taxInvoices = fullMockInvoices.filter((inv) => inv.invoiceType === "TAX_INVOICE");
  const byStatus: Record<string, number> = {};
  
  taxInvoices.forEach((inv) => {
    const status = inv.status === "PARTIAL" ? "ISSUED" : inv.status; // Group partial with issued
    byStatus[status] = (byStatus[status] || 0) + inv.totalAmount;
  });

  const statusColors: Record<string, string> = {
    PAID: "#22c55e",
    ISSUED: "#f59e0b",
    DRAFT: "#6b7280",
    OVERDUE: "#ef4444",
    CANCELLED: "#dc2626",
  };

  return Object.entries(byStatus).map(([name, value]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value,
    color: statusColors[name] || "#6b7280",
  }));
};

const mockStatusDistribution = calculateStatusDistribution();

// Calculate top customers from real data
const calculateTopCustomers = () => {
  const customerMap: Record<string, { name: string; amount: number; invoiceCount: number; outstanding: number }> = {};

  fullMockInvoices
    .filter((inv) => inv.invoiceType === "TAX_INVOICE" && inv.status !== "CANCELLED")
    .forEach((inv) => {
      const customerId = inv.buyer.id;
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          name: inv.buyer.name,
          amount: 0,
          invoiceCount: 0,
          outstanding: 0,
        };
      }
      customerMap[customerId].amount += inv.totalAmount;
      customerMap[customerId].invoiceCount += 1;
      customerMap[customerId].outstanding += inv.dueAmount;
    });

  return Object.entries(customerMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
};

const mockTopCustomers = calculateTopCustomers();

// Calculate overdue invoices from real data
const calculateOverdueInvoices = () => {
  const today = new Date();
  return fullMockInvoices
    .filter((inv) => inv.status === "OVERDUE" && inv.invoiceType === "TAX_INVOICE")
    .map((inv) => {
      const dueDate = new Date(inv.dueDate || inv.invoiceDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate,
        customer: inv.buyer.name,
        dueDate: inv.dueDate || inv.invoiceDate,
        amount: inv.dueAmount,
        daysOverdue: Math.max(0, daysOverdue),
      };
    });
};

const mockOverdueInvoices = calculateOverdueInvoices();

// Mock data for charts (these would come from API aggregation in real app)
const mockInvoiceTrend: StackedChartData[] = [
  { month: "Aug", amount: 185000, returnAmount: 12000 },
  { month: "Sep", amount: 245000, returnAmount: 18000 },
  { month: "Oct", amount: 198000, returnAmount: 15000 },
  { month: "Nov", amount: 320000, returnAmount: 22000 },
  { month: "Dec", amount: 275000, returnAmount: 20000 },
  { month: "Jan", amount: mockSummary.totalInvoiced > 0 ? mockSummary.totalInvoiced : 230000, returnAmount: 16000 },
];

const mockAgingData: StockCategoryData[] = [
  { name: "Current", value: 180000, color: "#22c55e" },
  { name: "1-30 Days", value: 85000, color: "#f59e0b" },
  { name: "31-60 Days", value: 45000, color: "#f97316" },
  { name: "61-90 Days", value: 25000, color: "#ef4444" },
  { name: "90+ Days", value: 15000, color: "#dc2626" },
];

// Status badge variants
const statusVariants: Record<string, "success" | "warning" | "default" | "error"> = {
  PAID: "success",
  ISSUED: "warning",
  PARTIAL: "warning",
  DRAFT: "default",
  OVERDUE: "error",
  CANCELLED: "error",
};

export default function InvoiceReportPage() {
  const router = useRouter();
  const canViewReports = usePermission("REPORTS_VIEW");
  const { currentStore } = useStore();
  const t = useTranslations("invoiceReport");
  const tCommon = useTranslations("common");
  const { dateRange, setDateRange, startDateISO, endDateISO } = useDateRangeFilter("month");
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Filter invoices
  const filteredInvoices = React.useMemo(() => {
    if (statusFilter === "all") return reportInvoices;
    return reportInvoices.filter((inv) => inv.status === statusFilter);
  }, [statusFilter]);

  // Export handlers
  const handleExportExcel = () => {
    exportInvoiceReportToExcel({
      summary: mockSummary,
      invoices: reportInvoices,
      overdueInvoices: mockOverdueInvoices,
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `invoice-report-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  const handleExportPDF = () => {
    exportInvoiceReportToPDF({
      summary: mockSummary,
      statusDistribution: mockStatusDistribution,
      agingData: mockAgingData,
      topCustomers: mockTopCustomers,
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `invoice-report-${new Date().toISOString().split("T")[0]}`,
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
          title={t("totalInvoiced")}
          value={formatCurrency(mockSummary.totalInvoiced)}
          description={`${mockSummary.invoiceCount} ${t("invoices")}`}
          icon={Receipt}
          isLoading={isLoading}
        />
        <StatCard
          title={t("paidAmount")}
          value={formatCurrency(mockSummary.paidAmount)}
          description={t("collected")}
          icon={CheckCircle}
          isLoading={isLoading}
        />
        <StatCard
          title={t("outstanding")}
          value={formatCurrency(mockSummary.outstandingAmount)}
          description={`${mockSummary.overdueCount} ${t("overdue")}`}
          icon={Clock}
          isLoading={isLoading}
        />
        <StatCard
          title={t("averageValue")}
          value={formatCurrency(mockSummary.averageInvoiceValue)}
          description={t("perInvoice")}
          icon={IndianRupee}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoice Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("invoiceTrend")}</CardTitle>
            <p className="text-xs text-text-muted">{t("monthlyInvoicing")}</p>
          </CardHeader>
          <CardContent>
            <MonthlyChart
              data={mockInvoiceTrend}
              stacked
              primaryColor="var(--chart-sales)"
              secondaryColor="var(--chart-sales-return)"
              primaryLabel={t("invoiced")}
              secondaryLabel={t("cancelled")}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("statusDistribution")}</CardTitle>
            <p className="text-xs text-text-muted">{t("invoicesByStatus")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart
              data={mockStatusDistribution}
              unit="₹"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Aging and Top Customers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aging Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("agingAnalysis")}</CardTitle>
            <p className="text-xs text-text-muted">{t("outstandingByAge")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart
              data={mockAgingData}
              unit="₹"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

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
                        {customer.invoiceCount} {t("invoices")} • {formatCurrency(customer.outstanding)} {t("due")}
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
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{t("recentInvoices")}</CardTitle>
              <p className="text-xs text-text-muted">{t("latestInvoices")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="PAID">{t("paid")}</SelectItem>
                  <SelectItem value="ISSUED">{t("issued")}</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="link" size="sm" asChild>
                <Link href="/invoices">{tCommon("viewAll")}</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
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
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("dueDate")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("amount")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("paidAmount")}
                    </th>
                    <th className="text-center text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {tCommon("status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-app transition-colors cursor-pointer"
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                    >
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-primary-600">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {new Date(invoice.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-primary">
                          {invoice.customer}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm text-success-600">
                          {formatCurrency(invoice.paidAmount)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Badge variant={statusVariants[invoice.status] || "default"}>
                          {invoice.status}
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

      {/* Overdue Invoices */}
      {mockOverdueInvoices.length > 0 && (
        <Card className="border-error-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-error-500" />
              <CardTitle className="text-base text-error-700">{t("overdueInvoices")}</CardTitle>
            </div>
            <p className="text-xs text-text-muted">{t("requiresAttention")}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3">
                      {t("invoiceNumber")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3">
                      {t("customer")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3">
                      {t("dueDate")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3">
                      {t("amount")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3">
                      {t("daysOverdue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockOverdueInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-error-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-primary-600">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-primary">
                          {invoice.customer}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-error-600">
                          {new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <Badge variant="error">{invoice.daysOverdue} {t("days")}</Badge>
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
