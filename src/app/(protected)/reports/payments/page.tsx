"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
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
import { exportPaymentReportToExcel, exportPaymentReportToPDF } from "@/lib/export-utils";
import type { StockCategoryData, StackedChartData } from "@/types";

// Mock data for payment report
const mockPaymentTrend: StackedChartData[] = [
  { month: "Aug", amount: 145000, returnAmount: 85000 },
  { month: "Sep", amount: 185000, returnAmount: 110000 },
  { month: "Oct", amount: 165000, returnAmount: 95000 },
  { month: "Nov", amount: 225000, returnAmount: 125000 },
  { month: "Dec", amount: 195000, returnAmount: 140000 },
  { month: "Jan", amount: 175000, returnAmount: 105000 },
];

const mockPaymentByMethod: StockCategoryData[] = [
  { name: "Bank Transfer", value: 450000, color: "#2563eb" },
  { name: "UPI", value: 320000, color: "#3b82f6" },
  { name: "Cash", value: 185000, color: "#22c55e" },
  { name: "Cheque", value: 135000, color: "#f59e0b" },
  { name: "Other", value: 45000, color: "#6b7280" },
];

const mockPaymentInByMethod: StockCategoryData[] = [
  { name: "Bank Transfer", value: 280000, color: "#2563eb" },
  { name: "UPI", value: 220000, color: "#3b82f6" },
  { name: "Cash", value: 125000, color: "#22c55e" },
  { name: "Cheque", value: 85000, color: "#f59e0b" },
];

const mockPaymentOutByMethod: StockCategoryData[] = [
  { name: "Bank Transfer", value: 170000, color: "#2563eb" },
  { name: "UPI", value: 100000, color: "#3b82f6" },
  { name: "Cash", value: 60000, color: "#22c55e" },
  { name: "Cheque", value: 50000, color: "#f59e0b" },
];

const mockTopPayers = [
  { id: "1", name: "ABC Constructions Pvt Ltd", amount: 185000, count: 8, type: "CUSTOMER" },
  { id: "2", name: "XYZ Builders", amount: 145000, count: 6, type: "CUSTOMER" },
  { id: "3", name: "Sharma Interiors", amount: 125000, count: 10, type: "CUSTOMER" },
  { id: "4", name: "Modern Homes", amount: 95000, count: 4, type: "CUSTOMER" },
  { id: "5", name: "Elite Designs", amount: 78000, count: 7, type: "CUSTOMER" },
];

const mockTopPayees = [
  { id: "1", name: "Stone Suppliers India", amount: 165000, count: 5, type: "SUPPLIER" },
  { id: "2", name: "Granite World", amount: 125000, count: 4, type: "SUPPLIER" },
  { id: "3", name: "Marble Imports Ltd", amount: 95000, count: 3, type: "SUPPLIER" },
  { id: "4", name: "Transport Services", amount: 45000, count: 8, type: "SUPPLIER" },
  { id: "5", name: "Utilities & Rent", amount: 35000, count: 2, type: "SUPPLIER" },
];

const mockPayments = [
  { id: "1", date: "2024-01-18", party: "ABC Constructions", type: "IN", method: "UPI", amount: 45000, reference: "UPI-123456", invoice: "INV-2024-0148" },
  { id: "2", date: "2024-01-17", party: "Stone Suppliers India", type: "OUT", method: "BANK_TRANSFER", amount: 85000, reference: "NEFT-789012", invoice: "PO-2024-0052" },
  { id: "3", date: "2024-01-16", party: "XYZ Builders", type: "IN", method: "CHEQUE", amount: 32000, reference: "CHQ-456789", invoice: "INV-2024-0145" },
  { id: "4", date: "2024-01-15", party: "Granite World", type: "OUT", method: "UPI", amount: 42000, reference: "UPI-345678", invoice: "PO-2024-0048" },
  { id: "5", date: "2024-01-14", party: "Sharma Interiors", type: "IN", method: "CASH", amount: 28000, reference: "CASH-001", invoice: "INV-2024-0142" },
  { id: "6", date: "2024-01-13", party: "Modern Homes", type: "IN", method: "BANK_TRANSFER", amount: 55000, reference: "NEFT-234567", invoice: "INV-2024-0138" },
  { id: "7", date: "2024-01-12", party: "Marble Imports Ltd", type: "OUT", method: "BANK_TRANSFER", amount: 125000, reference: "NEFT-567890", invoice: "PO-2024-0045" },
  { id: "8", date: "2024-01-11", party: "Elite Designs", type: "IN", method: "UPI", amount: 38000, reference: "UPI-678901", invoice: "INV-2024-0135" },
];

const mockSummary = {
  totalIn: 710000,
  totalOut: 380000,
  netFlow: 330000,
  transactionCount: 156,
  avgTransactionValue: 6987,
};

// Method badge colors
const methodVariants: Record<string, "default" | "success" | "warning" | "error"> = {
  CASH: "success",
  BANK_TRANSFER: "default",
  UPI: "warning",
  CHEQUE: "error",
  OTHER: "default",
};

export default function PaymentReportPage() {
  const router = useRouter();
  const canViewReports = usePermission("REPORTS_VIEW");
  const { currentStore } = useStore();
  const t = useTranslations("paymentReport");
  const tCommon = useTranslations("common");
  const { dateRange, setDateRange, startDateISO, endDateISO } = useDateRangeFilter("month");
  const [isLoading, setIsLoading] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [methodFilter, setMethodFilter] = React.useState<string>("all");

  // Filter payments
  const filteredPayments = React.useMemo(() => {
    return mockPayments.filter((payment) => {
      if (typeFilter !== "all" && payment.type !== typeFilter) return false;
      if (methodFilter !== "all" && payment.method !== methodFilter) return false;
      return true;
    });
  }, [typeFilter, methodFilter]);

  // Export handlers
  const handleExportExcel = () => {
    exportPaymentReportToExcel({
      summary: mockSummary,
      payments: mockPayments,
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `payment-report-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  const handleExportPDF = () => {
    exportPaymentReportToPDF({
      summary: mockSummary,
      paymentByMethod: mockPaymentByMethod,
      topPayers: mockTopPayers,
      topPayees: mockTopPayees,
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `payment-report-${new Date().toISOString().split("T")[0]}`,
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
          title={t("totalIn")}
          value={formatCurrency(mockSummary.totalIn)}
          description={t("received")}
          icon={ArrowDownRight}
          isLoading={isLoading}
        />
        <StatCard
          title={t("totalOut")}
          value={formatCurrency(mockSummary.totalOut)}
          description={t("paid")}
          icon={ArrowUpRight}
          isLoading={isLoading}
        />
        <StatCard
          title={t("netCashFlow")}
          value={formatCurrency(mockSummary.netFlow)}
          description={mockSummary.netFlow >= 0 ? t("positive") : t("negative")}
          icon={TrendingUp}
          trend={mockSummary.netFlow >= 0 ? "up" : "down"}
          isLoading={isLoading}
        />
        <StatCard
          title={t("transactions")}
          value={mockSummary.transactionCount.toString()}
          description={`${t("avg")} ${formatCurrency(mockSummary.avgTransactionValue)}`}
          icon={Wallet}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("paymentTrend")}</CardTitle>
            <p className="text-xs text-text-muted">{t("inVsOut")}</p>
          </CardHeader>
          <CardContent>
            <MonthlyChart
              data={mockPaymentTrend}
              stacked
              primaryColor="var(--chart-sales)"
              secondaryColor="var(--chart-purchase)"
              primaryLabel={t("paymentIn")}
              secondaryLabel={t("paymentOut")}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Payment by Method */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("byMethod")}</CardTitle>
            <p className="text-xs text-text-muted">{t("paymentMethodBreakdown")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart
              data={mockPaymentByMethod}
              unit="₹"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Payers and Payees */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Payers (Customers) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-success-600" />
              <CardTitle className="text-base">{t("topPayers")}</CardTitle>
            </div>
            <p className="text-xs text-text-muted">{t("customerPayments")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {mockTopPayers.map((payer, index) => (
                <div
                  key={payer.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border-subtle hover:bg-bg-app transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-sm font-medium text-success-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {payer.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {payer.count} {t("payments")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success-600">
                    {formatCurrency(payer.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Payees (Suppliers) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-error-600" />
              <CardTitle className="text-base">{t("topPayees")}</CardTitle>
            </div>
            <p className="text-xs text-text-muted">{t("supplierPayments")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {mockTopPayees.map((payee, index) => (
                <div
                  key={payee.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border-subtle hover:bg-bg-app transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-error-100 text-sm font-medium text-error-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {payee.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {payee.count} {t("payments")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-error-600">
                    {formatCurrency(payee.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{t("recentPayments")}</CardTitle>
              <p className="text-xs text-text-muted">{t("latestTransactions")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t("allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTypes")}</SelectItem>
                  <SelectItem value="IN">{t("paymentIn")}</SelectItem>
                  <SelectItem value="OUT">{t("paymentOut")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("allMethods")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allMethods")}</SelectItem>
                  <SelectItem value="CASH">{t("cash")}</SelectItem>
                  <SelectItem value="BANK_TRANSFER">{t("bankTransfer")}</SelectItem>
                  <SelectItem value="UPI">{t("upi")}</SelectItem>
                  <SelectItem value="CHEQUE">{t("cheque")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="link" size="sm" asChild>
                <Link href="/payments">{tCommon("viewAll")}</Link>
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
                      {t("date")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("party")}
                    </th>
                    <th className="text-center text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("type")}
                    </th>
                    <th className="text-center text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("method")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("reference")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("amount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-app transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {new Date(payment.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-primary">
                          {payment.party}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Badge variant={payment.type === "IN" ? "success" : "error"}>
                          {payment.type === "IN" ? t("in") : t("out")}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Badge variant={methodVariants[payment.method] || "default"}>
                          {payment.method.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {payment.reference}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className={`text-sm font-medium ${payment.type === "IN" ? "text-success-600" : "text-error-600"}`}>
                          {payment.type === "IN" ? "+" : "-"}{formatCurrency(payment.amount)}
                        </span>
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
