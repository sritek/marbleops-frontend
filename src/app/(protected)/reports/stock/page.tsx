"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  IndianRupee,
  TrendingUp,
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
import { StockPieChart, LowStockTable } from "@/components/features";
import {
  exportStockReportToExcel,
  exportStockReportToPDF,
  exportInventoryToExcel,
  exportInventoryToPDF,
  exportLowStockToExcel,
  exportLowStockToPDF,
} from "@/lib/export-utils";
import type { StockCategoryData, LowStockItem } from "@/types";

// Mock data for stock report
const mockStockByMaterial: StockCategoryData[] = [
  { name: "Marble", value: 1850000, color: "#2563eb" },
  { name: "Granite", value: 1250000, color: "#3b82f6" },
  { name: "Tiles", value: 650000, color: "#6366f1" },
];

const mockStockByForm: StockCategoryData[] = [
  { name: "Slabs", value: 2100000, color: "#8b5cf6" },
  { name: "Blocks", value: 1200000, color: "#a855f7" },
  { name: "Tiles", value: 450000, color: "#c084fc" },
];

const mockStockByQuality: StockCategoryData[] = [
  { name: "Normal", value: 3200000, color: "#22c55e" },
  { name: "Cracked", value: 350000, color: "#f59e0b" },
  { name: "Damaged", value: 200000, color: "#ef4444" },
];

const mockLowStockItems: LowStockItem[] = [
  { id: "1", name: "Italian White Marble", materialType: "MARBLE", currentQty: 45, threshold: 100, unit: "sq ft" },
  { id: "2", name: "Black Galaxy Granite", materialType: "GRANITE", currentQty: 30, threshold: 80, unit: "sq ft" },
  { id: "3", name: "Makrana White", materialType: "MARBLE", currentQty: 25, threshold: 50, unit: "sq ft" },
  { id: "4", name: "Porcelain 60x60", materialType: "TILE", currentQty: 120, threshold: 200, unit: "pcs" },
  { id: "5", name: "Fantasy Brown", materialType: "GRANITE", currentQty: 18, threshold: 40, unit: "sq ft" },
];

const mockInventoryList = [
  { id: "1", name: "Italian White Marble", materialType: "MARBLE", form: "SLAB", quantity: 450, unit: "sq ft", buyPrice: 500, sellPrice: 750, totalBuyValue: 225000, totalSellValue: 337500 },
  { id: "2", name: "Black Galaxy Granite", materialType: "GRANITE", form: "SLAB", quantity: 320, unit: "sq ft", buyPrice: 550, sellPrice: 800, totalBuyValue: 176000, totalSellValue: 256000 },
  { id: "3", name: "Makrana White", materialType: "MARBLE", form: "BLOCK", quantity: 280, unit: "sq ft", buyPrice: 550, sellPrice: 850, totalBuyValue: 154000, totalSellValue: 238000 },
  { id: "4", name: "Porcelain 60x60", materialType: "TILE", form: "TILE", quantity: 520, unit: "pcs", buyPrice: 240, sellPrice: 380, totalBuyValue: 124800, totalSellValue: 197600 },
  { id: "5", name: "Fantasy Brown", materialType: "GRANITE", form: "SLAB", quantity: 180, unit: "sq ft", buyPrice: 600, sellPrice: 900, totalBuyValue: 108000, totalSellValue: 162000 },
  { id: "6", name: "Rajnagar White", materialType: "MARBLE", form: "SLAB", quantity: 350, unit: "sq ft", buyPrice: 420, sellPrice: 650, totalBuyValue: 147000, totalSellValue: 227500 },
  { id: "7", name: "Tan Brown Granite", materialType: "GRANITE", form: "SLAB", quantity: 200, unit: "sq ft", buyPrice: 480, sellPrice: 720, totalBuyValue: 96000, totalSellValue: 144000 },
  { id: "8", name: "Ceramic Wall Tiles", materialType: "TILE", form: "TILE", quantity: 800, unit: "pcs", buyPrice: 150, sellPrice: 250, totalBuyValue: 120000, totalSellValue: 200000 },
];

const mockSummary = {
  totalItems: 156,
  totalBuyValue: 3750000,
  totalSellValue: 5625000,
  lowStockCount: 5,
  potentialProfit: 1875000,
};

export default function StockReportPage() {
  const router = useRouter();
  const canViewReports = usePermission("REPORTS_VIEW");
  const { currentStore } = useStore();
  const t = useTranslations("stockReport");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = React.useState(false);
  const [materialFilter, setMaterialFilter] = React.useState<string>("all");
  const [formFilter, setFormFilter] = React.useState<string>("all");

  // Filter inventory based on selections
  const filteredInventory = React.useMemo(() => {
    return mockInventoryList.filter((item) => {
      if (materialFilter !== "all" && item.materialType !== materialFilter) return false;
      if (formFilter !== "all" && item.form !== formFilter) return false;
      return true;
    });
  }, [materialFilter, formFilter]);

  // Calculate total value from filtered inventory
  const totalInventoryValue = React.useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + item.totalBuyValue, 0);
  }, [filteredInventory]);

  // Export handlers
  const handleExportExcel = () => {
    exportStockReportToExcel({
      summary: mockSummary,
      inventory: mockInventoryList,
      lowStockItems: mockLowStockItems,
    }, {
      filename: `stock-report-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  const handleExportPDF = () => {
    exportStockReportToPDF({
      summary: mockSummary,
      stockByMaterial: mockStockByMaterial,
      stockByForm: mockStockByForm,
      lowStockItems: mockLowStockItems,
    }, {
      filename: `stock-report-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  // Inventory export handlers (uses filtered data)
  const handleExportInventoryExcel = () => {
    exportInventoryToExcel({
      inventory: filteredInventory,
      filters: { materialType: materialFilter, form: formFilter },
    }, {
      filename: `inventory-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  const handleExportInventoryPDF = () => {
    exportInventoryToPDF({
      inventory: filteredInventory,
      filters: { materialType: materialFilter, form: formFilter },
    }, {
      filename: `inventory-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  // Low stock export handlers
  const handleExportLowStockExcel = () => {
    exportLowStockToExcel({
      items: mockLowStockItems,
    }, {
      filename: `low-stock-${new Date().toISOString().split("T")[0]}`,
      companyName: currentStore?.name || "MarbleOps",
    });
  };

  const handleExportLowStockPDF = () => {
    exportLowStockToPDF({
      items: mockLowStockItems,
    }, {
      filename: `low-stock-${new Date().toISOString().split("T")[0]}`,
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
          title={t("totalItems")}
          value={mockSummary.totalItems.toString()}
          description={t("itemsInStock")}
          icon={Package}
          isLoading={isLoading}
        />
        <StatCard
          title={t("stockValue")}
          value={formatCurrency(mockSummary.totalBuyValue)}
          description={t("atCostPrice")}
          icon={IndianRupee}
          isLoading={isLoading}
        />
        <StatCard
          title={t("potentialRevenue")}
          value={formatCurrency(mockSummary.totalSellValue)}
          description={t("atSellPrice")}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title={t("lowStockAlerts")}
          value={mockSummary.lowStockCount.toString()}
          description={t("itemsBelowThreshold")}
          icon={AlertTriangle}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock by Material */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("stockByMaterial")}</CardTitle>
            <p className="text-xs text-text-muted">{t("valueByMaterialType")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart
              data={mockStockByMaterial}
              unit="₹"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Stock by Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("stockByForm")}</CardTitle>
            <p className="text-xs text-text-muted">{t("valueByStoneForm")}</p>
          </CardHeader>
          <CardContent>
            <StockPieChart
              data={mockStockByForm}
              unit="₹"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Stock by Quality */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("stockByQuality")}</CardTitle>
          <p className="text-xs text-text-muted">{t("valueByQualityGrade")}</p>
        </CardHeader>
        <CardContent>
          <StockPieChart
            data={mockStockByQuality}
            unit="₹"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Inventory Valuation Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{t("inventoryValuation")}</CardTitle>
              <p className="text-xs text-text-muted">{t("detailedStockList")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("allMaterials")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allMaterials")}</SelectItem>
                  <SelectItem value="MARBLE">{t("marble")}</SelectItem>
                  <SelectItem value="GRANITE">{t("granite")}</SelectItem>
                  <SelectItem value="TILE">{t("tiles")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("allForms")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allForms")}</SelectItem>
                  <SelectItem value="SLAB">{t("slabs")}</SelectItem>
                  <SelectItem value="BLOCK">{t("blocks")}</SelectItem>
                  <SelectItem value="TILE">{t("tiles")}</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary">
                    <Download className="h-4 w-4 mr-2" />
                    {t("downloadInventory")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportInventoryExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {t("exportExcel")}
                    {(materialFilter !== "all" || formFilter !== "all") && (
                      <span className="ml-2 text-xs text-text-muted">({t("filteredItems")})</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportInventoryPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t("exportPDF")}
                    {(materialFilter !== "all" || formFilter !== "all") && (
                      <span className="ml-2 text-xs text-text-muted">({t("filteredItems")})</span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                      {t("itemName")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("type")}
                    </th>
                    <th className="text-left text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("form")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("quantity")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("buyPrice")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("sellPrice")}
                    </th>
                    <th className="text-right text-xs font-medium text-text-muted py-3 px-3 bg-bg-surface">
                      {t("totalValue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-app transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-text-primary">
                          {item.name}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="default">{item.materialType}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-text-muted">{item.form}</span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm text-text-primary">
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {formatCurrency(item.buyPrice)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm text-text-muted">
                          {formatCurrency(item.sellPrice)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(item.totalBuyValue)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-bg-surface border-t-2 border-border-subtle">
                  <tr>
                    <td colSpan={6} className="text-right py-3 px-3">
                      <span className="text-sm font-bold text-text-primary">
                        {t("total")}:
                      </span>
                    </td>
                    <td className="text-right py-3 px-3">
                      <span className="text-sm font-bold text-text-primary">
                        {formatCurrency(totalInventoryValue)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
                <CardTitle className="text-base">{t("lowStockAlerts")}</CardTitle>
              </div>
              <p className="text-xs text-text-muted mt-1">{t("itemsNeedingRestock")}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary">
                  <Download className="h-4 w-4 mr-2" />
                  {t("downloadLowStock")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportLowStockExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t("exportExcel")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportLowStockPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("exportPDF")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <LowStockTable items={mockLowStockItems} isLoading={isLoading} showViewAll={false} />
        </CardContent>
      </Card>
    </div>
  );
}
