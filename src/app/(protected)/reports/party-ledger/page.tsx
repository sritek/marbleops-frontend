"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Search,
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
import { Input } from "@/components/ui/input";
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
import { exportPartyLedgerToExcel, exportPartyLedgerToPDF } from "@/lib/export-utils";
import type { StockCategoryData, StackedChartData } from "@/types";

// Mock parties list
const mockParties = [
  { id: "1", name: "ABC Constructions Pvt Ltd", type: "CUSTOMER", balance: 125000 },
  { id: "2", name: "XYZ Builders", type: "CUSTOMER", balance: 85000 },
  { id: "3", name: "Sharma Interiors", type: "CUSTOMER", balance: -15000 },
  { id: "4", name: "Stone Suppliers India", type: "SUPPLIER", balance: -250000 },
  { id: "5", name: "Granite World", type: "SUPPLIER", balance: -180000 },
  { id: "6", name: "Modern Homes", type: "CUSTOMER", balance: 45000 },
  { id: "7", name: "Elite Designs", type: "BOTH", balance: 32000 },
];

// Mock transaction data for selected party
const mockTransactions = [
  { id: "1", date: "2024-01-18", type: "INVOICE", reference: "INV-2024-0156", debit: 45000, credit: 0, balance: 125000, description: "Invoice for Italian Marble" },
  { id: "2", date: "2024-01-15", type: "PAYMENT", reference: "PAY-2024-0089", debit: 0, credit: 30000, balance: 80000, description: "Payment received via UPI" },
  { id: "3", date: "2024-01-12", type: "INVOICE", reference: "INV-2024-0148", debit: 68000, credit: 0, balance: 110000, description: "Invoice for Granite slabs" },
  { id: "4", date: "2024-01-08", type: "PAYMENT", reference: "PAY-2024-0082", debit: 0, credit: 50000, balance: 42000, description: "Payment received via Bank Transfer" },
  { id: "5", date: "2024-01-05", type: "INVOICE", reference: "INV-2024-0135", debit: 52000, credit: 0, balance: 92000, description: "Invoice for Porcelain tiles" },
  { id: "6", date: "2024-01-02", type: "PAYMENT", reference: "PAY-2024-0075", debit: 0, credit: 25000, balance: 40000, description: "Payment received via Cash" },
  { id: "7", date: "2023-12-28", type: "INVOICE", reference: "INV-2024-0122", debit: 35000, credit: 0, balance: 65000, description: "Invoice for Wall tiles" },
  { id: "8", date: "2023-12-20", type: "PAYMENT", reference: "PAY-2024-0068", debit: 0, credit: 40000, balance: 30000, description: "Payment received via Cheque" },
];

const mockMonthlyTrend: StackedChartData[] = [
  { month: "Aug", amount: 85000, returnAmount: 45000 },
  { month: "Sep", amount: 120000, returnAmount: 65000 },
  { month: "Oct", amount: 95000, returnAmount: 70000 },
  { month: "Nov", amount: 150000, returnAmount: 80000 },
  { month: "Dec", amount: 110000, returnAmount: 95000 },
  { month: "Jan", amount: 165000, returnAmount: 105000 },
];

const mockAgingData: StockCategoryData[] = [
  { name: "Current (0-30)", value: 45000, color: "#22c55e" },
  { name: "31-60 Days", value: 35000, color: "#f59e0b" },
  { name: "61-90 Days", value: 25000, color: "#f97316" },
  { name: "90+ Days", value: 20000, color: "#ef4444" },
];

const mockLedgerSummary = {
  openingBalance: 30000,
  totalDebits: 200000,
  totalCredits: 145000,
  closingBalance: 125000,
};

export default function PartyLedgerPage() {
  const router = useRouter();
  const canViewReports = usePermission("REPORTS_VIEW");
  const { currentStore } = useStore();
  const t = useTranslations("partyLedger");
  const tCommon = useTranslations("common");
  const { dateRange, setDateRange, startDateISO, endDateISO } = useDateRangeFilter("month");
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPartyId, setSelectedPartyId] = React.useState<string>("1");
  const [partyTypeFilter, setPartyTypeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get selected party
  const selectedParty = mockParties.find((p) => p.id === selectedPartyId);

  // Filter parties
  const filteredParties = React.useMemo(() => {
    return mockParties.filter((party) => {
      if (partyTypeFilter !== "all" && party.type !== partyTypeFilter) return false;
      if (searchQuery && !party.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [partyTypeFilter, searchQuery]);

  // Export handlers
  const handleExportExcel = () => {
    if (!selectedParty) return;
    exportPartyLedgerToExcel({
      party: selectedParty,
      summary: mockLedgerSummary,
      transactions: mockTransactions,
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `party-ledger-${selectedParty.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  const handleExportPDF = () => {
    if (!selectedParty) return;
    exportPartyLedgerToPDF({
      party: selectedParty,
      summary: mockLedgerSummary,
      transactions: mockTransactions,
      dateRange: { startDate: startDateISO, endDate: endDateISO },
    }, {
      filename: `party-ledger-${selectedParty.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`,
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
                <Button variant="secondary" disabled={!selectedParty}>
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

      {/* Party Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("selectParty")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder={t("searchParty")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={partyTypeFilter} onValueChange={setPartyTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                <SelectItem value="CUSTOMER">{t("customers")}</SelectItem>
                <SelectItem value="SUPPLIER">{t("suppliers")}</SelectItem>
                <SelectItem value="BOTH">{t("both")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[200px] overflow-y-auto">
            {filteredParties.map((party) => (
              <button
                key={party.id}
                onClick={() => setSelectedPartyId(party.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                  selectedPartyId === party.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-border-subtle hover:bg-bg-app"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{party.name}</p>
                  <Badge variant={party.type === "CUSTOMER" ? "success" : party.type === "SUPPLIER" ? "warning" : "default"} className="mt-1">
                    {party.type}
                  </Badge>
                </div>
                <span className={`text-sm font-semibold ${party.balance >= 0 ? "text-success-600" : "text-error-600"}`}>
                  {formatCurrency(Math.abs(party.balance))}
                  {party.balance < 0 && " CR"}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedParty && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("openingBalance")}
              value={formatCurrency(mockLedgerSummary.openingBalance)}
              description={t("periodStart")}
              icon={Wallet}
              isLoading={isLoading}
            />
            <StatCard
              title={t("totalDebits")}
              value={formatCurrency(mockLedgerSummary.totalDebits)}
              description={t("invoicesSales")}
              icon={ArrowUpRight}
              isLoading={isLoading}
            />
            <StatCard
              title={t("totalCredits")}
              value={formatCurrency(mockLedgerSummary.totalCredits)}
              description={t("paymentsReceived")}
              icon={ArrowDownRight}
              isLoading={isLoading}
            />
            <StatCard
              title={t("closingBalance")}
              value={formatCurrency(mockLedgerSummary.closingBalance)}
              description={t("currentOutstanding")}
              icon={Wallet}
              trend={mockLedgerSummary.closingBalance > mockLedgerSummary.openingBalance ? "up" : "down"}
              isLoading={isLoading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("monthlyTrend")}</CardTitle>
                <p className="text-xs text-text-muted">{t("debitsVsCredits")}</p>
              </CardHeader>
              <CardContent>
                <MonthlyChart
                  data={mockMonthlyTrend}
                  stacked
                  primaryColor="var(--chart-sales)"
                  secondaryColor="var(--chart-purchase)"
                  primaryLabel={t("debits")}
                  secondaryLabel={t("credits")}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

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
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{t("transactionHistory")}</CardTitle>
                  <p className="text-xs text-text-muted">{t("allTransactions")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-bg-surface z-10">
                      <tr className="border-b border-border-subtle">
                        <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                          {t("date")}
                        </th>
                        <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                          {t("type")}
                        </th>
                        <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                          {t("reference")}
                        </th>
                        <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                          {t("description")}
                        </th>
                        <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                          {t("debit")}
                        </th>
                        <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                          {t("credit")}
                        </th>
                        <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                          {t("balance")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTransactions.map((txn) => (
                        <tr
                          key={txn.id}
                          className="border-b border-border-subtle last:border-0 hover:bg-bg-app transition-colors"
                        >
                          <td className="py-3 px-3">
                            <span className="text-sm text-text-muted">
                              {new Date(txn.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={txn.type === "INVOICE" ? "warning" : "success"}>
                              {txn.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm font-medium text-primary-600">
                              {txn.reference}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-text-primary">
                              {txn.description}
                            </span>
                          </td>
                          <td className="text-right py-3 px-3">
                            <span className="text-sm text-error-600">
                              {txn.debit > 0 ? formatCurrency(txn.debit) : "-"}
                            </span>
                          </td>
                          <td className="text-right py-3 px-3">
                            <span className="text-sm text-success-600">
                              {txn.credit > 0 ? formatCurrency(txn.credit) : "-"}
                            </span>
                          </td>
                          <td className="text-right py-3 px-3">
                            <span className="text-sm font-medium text-text-primary">
                              {formatCurrency(txn.balance)}
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
        </>
      )}
    </div>
  );
}
