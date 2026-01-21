import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Format currency for PDF exports (uses "Rs." prefix to avoid font issues with ₹ symbol)
 */
function formatCurrencyForPDF(amount: number): string {
  return `Rs. ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

/**
 * Format currency for Excel exports (uses "INR" prefix for compatibility)
 */
function formatCurrencyForExcel(amount: number): string {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

/**
 * Format date for display in exports
 */
function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// EXCEL EXPORT
// ============================================================================

interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
}

interface SalesReportExcelData {
  summary: {
    totalSales: number;
    invoiceCount: number;
    averageInvoiceValue: number;
    returnsAmount: number;
  };
  transactions: Array<{
    invoiceNumber: string;
    date: string;
    customer: string;
    items: number;
    amount: number;
    status: string;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Export sales report data to Excel file
 */
export function exportSalesReportToExcel(
  data: SalesReportExcelData,
  options: ExcelExportOptions
): void {
  const { filename, sheetName = "Sales Report" } = options;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Summary data
  const summaryData = [
    ["Sales Report"],
    [],
    ["Date Range", `${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`],
    ["Generated On", formatDate(new Date())],
    [],
    ["Summary"],
    ["Total Sales", formatCurrencyForExcel(data.summary.totalSales)],
    ["Total Invoices", data.summary.invoiceCount],
    ["Average Invoice Value", formatCurrencyForExcel(data.summary.averageInvoiceValue)],
    ["Returns/Refunds", formatCurrencyForExcel(data.summary.returnsAmount)],
    [],
    [],
    ["Transaction Details"],
    ["Invoice #", "Date", "Customer", "Items", "Amount", "Status"],
  ];

  // Add transaction rows
  data.transactions.forEach((t) => {
    summaryData.push([
      t.invoiceNumber,
      formatDate(t.date),
      t.customer,
      t.items.toString(),
      formatCurrencyForExcel(t.amount),
      t.status,
    ]);
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Invoice #
    { wch: 15 }, // Date
    { wch: 25 }, // Customer
    { wch: 10 }, // Items
    { wch: 15 }, // Amount
    { wch: 12 }, // Status
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ============================================================================
// PDF EXPORT
// ============================================================================

interface PDFExportOptions {
  filename: string;
  title?: string;
  companyName?: string;
}

interface SalesReportPDFData {
  summary: {
    totalSales: number;
    invoiceCount: number;
    averageInvoiceValue: number;
    returnsAmount: number;
  };
  transactions: Array<{
    invoiceNumber: string;
    date: string;
    customer: string;
    items: number;
    amount: number;
    status: string;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Export sales report data to PDF file
 */
export function exportSalesReportToPDF(
  data: SalesReportPDFData,
  options: PDFExportOptions
): void {
  const { filename, title = "Sales Report", companyName = "MarbleOps" } = options;

  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  yPosition += 15;

  // Summary section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryItems = [
    ["Total Sales:", formatCurrencyForPDF(data.summary.totalSales)],
    ["Total Invoices:", data.summary.invoiceCount.toString()],
    ["Average Invoice Value:", formatCurrencyForPDF(data.summary.averageInvoiceValue)],
    ["Returns/Refunds:", formatCurrencyForPDF(data.summary.returnsAmount)],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(label, 14, yPosition);
    doc.text(value, 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Transactions table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Details", 14, yPosition);

  yPosition += 5;

  // Use autoTable for transactions
  const tableData = data.transactions.map((t) => [
    t.invoiceNumber,
    formatDate(t.date),
    t.customer,
    t.items.toString(),
    formatCurrencyForPDF(t.amount),
    t.status,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Invoice #", "Date", "Customer", "Items", "Amount", "Status"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235], // Primary blue
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 25, halign: "center" },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save PDF
  doc.save(`${filename}.pdf`);
}

// ============================================================================
// STOCK REPORT EXPORT
// ============================================================================

interface StockReportExcelData {
  summary: {
    totalItems: number;
    totalBuyValue: number;
    totalSellValue: number;
    lowStockCount: number;
  };
  inventory: Array<{
    name: string;
    materialType: string;
    form: string;
    quantity: number;
    unit: string;
    buyPrice: number;
    sellPrice: number;
    totalBuyValue: number;
  }>;
  lowStockItems: Array<{
    name: string;
    materialType: string;
    currentQty: number;
    threshold: number;
  }>;
}

interface StockReportPDFData {
  summary: {
    totalItems: number;
    totalBuyValue: number;
    totalSellValue: number;
    lowStockCount: number;
  };
  stockByMaterial: Array<{ name: string; value: number }>;
  stockByForm: Array<{ name: string; value: number }>;
  lowStockItems: Array<{
    name: string;
    materialType: string;
    currentQty: number;
    threshold: number;
  }>;
}

interface StockExportOptions {
  filename: string;
  companyName?: string;
}

export function exportStockReportToExcel(
  data: StockReportExcelData,
  options: StockExportOptions
): void {
  const { filename } = options;
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ["Stock Report"],
    [],
    ["Generated On", formatDate(new Date())],
    [],
    ["Summary"],
    ["Total Items", data.summary.totalItems],
    ["Total Stock Value (Cost)", formatCurrencyForExcel(data.summary.totalBuyValue)],
    ["Potential Revenue (Sell)", formatCurrencyForExcel(data.summary.totalSellValue)],
    ["Low Stock Alerts", data.summary.lowStockCount],
    [],
    [],
    ["Inventory Details"],
    ["Item Name", "Material Type", "Form", "Quantity", "Unit", "Buy Price", "Sell Price", "Total Value"],
  ];

  data.inventory.forEach((item) => {
    summaryData.push([
      item.name,
      item.materialType,
      item.form,
      item.quantity.toString(),
      item.unit,
      formatCurrencyForExcel(item.buyPrice),
      formatCurrencyForExcel(item.sellPrice),
      formatCurrencyForExcel(item.totalBuyValue),
    ]);
  });

  summaryData.push([], [], ["Low Stock Items"], ["Item Name", "Material Type", "Current Qty", "Threshold"]);

  data.lowStockItems.forEach((item) => {
    summaryData.push([item.name, item.materialType, item.currentQty.toString(), item.threshold.toString()]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportStockReportToPDF(
  data: StockReportPDFData,
  options: StockExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text("Stock Report", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryItems = [
    ["Total Items:", data.summary.totalItems.toString()],
    ["Stock Value (Cost):", formatCurrencyForPDF(data.summary.totalBuyValue)],
    ["Potential Revenue:", formatCurrencyForPDF(data.summary.totalSellValue)],
    ["Low Stock Alerts:", data.summary.lowStockCount.toString()],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(label, 14, yPosition);
    doc.text(value, 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Low Stock Items", 14, yPosition);
  yPosition += 5;

  const tableData = data.lowStockItems.map((item) => [
    item.name,
    item.materialType,
    item.currentQty.toString(),
    item.threshold.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Item Name", "Material", "Current Qty", "Threshold"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// INVENTORY ONLY EXPORT (with filters)
// ============================================================================

interface InventoryExportData {
  inventory: Array<{
    name: string;
    materialType: string;
    form: string;
    quantity: number;
    unit: string;
    buyPrice: number;
    sellPrice: number;
    totalBuyValue: number;
    totalSellValue?: number;
  }>;
  filters?: {
    materialType?: string;
    form?: string;
  };
}

interface InventoryExportOptions {
  filename: string;
  companyName?: string;
}

export function exportInventoryToExcel(
  data: InventoryExportData,
  options: InventoryExportOptions
): void {
  const { filename } = options;
  const workbook = XLSX.utils.book_new();

  const filterInfo = [];
  if (data.filters?.materialType && data.filters.materialType !== "all") {
    filterInfo.push(`Material: ${data.filters.materialType}`);
  }
  if (data.filters?.form && data.filters.form !== "all") {
    filterInfo.push(`Form: ${data.filters.form}`);
  }

  const summaryData: (string | number)[][] = [
    ["Inventory Report"],
    [],
    ["Generated On", formatDate(new Date())],
    filterInfo.length > 0 ? ["Filters Applied", filterInfo.join(", ")] : [],
    ["Total Items", data.inventory.length],
    [],
    ["Item Name", "Material Type", "Form", "Quantity", "Unit", "Buy Price", "Sell Price", "Total Buy Value", "Total Sell Value"],
  ];

  let totalBuyValue = 0;
  let totalSellValue = 0;

  data.inventory.forEach((item) => {
    totalBuyValue += item.totalBuyValue;
    totalSellValue += item.totalSellValue || 0;
    summaryData.push([
      item.name,
      item.materialType,
      item.form,
      item.quantity,
      item.unit,
      formatCurrencyForExcel(item.buyPrice),
      formatCurrencyForExcel(item.sellPrice),
      formatCurrencyForExcel(item.totalBuyValue),
      formatCurrencyForExcel(item.totalSellValue || 0),
    ]);
  });

  summaryData.push([]);
  summaryData.push(["", "", "", "", "", "", "Total:", formatCurrencyForExcel(totalBuyValue), formatCurrencyForExcel(totalSellValue)]);

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportInventoryToPDF(
  data: InventoryExportData,
  options: InventoryExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const doc = new jsPDF("landscape");
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text("Inventory Report", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: "center" });

  // Show filters if applied
  const filterInfo = [];
  if (data.filters?.materialType && data.filters.materialType !== "all") {
    filterInfo.push(`Material: ${data.filters.materialType}`);
  }
  if (data.filters?.form && data.filters.form !== "all") {
    filterInfo.push(`Form: ${data.filters.form}`);
  }
  if (filterInfo.length > 0) {
    yPosition += 6;
    doc.text(`Filters: ${filterInfo.join(", ")}`, pageWidth / 2, yPosition, { align: "center" });
  }

  yPosition += 6;
  doc.text(`Total Items: ${data.inventory.length}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;

  const tableData = data.inventory.map((item) => [
    item.name,
    item.materialType,
    item.form,
    `${item.quantity} ${item.unit}`,
    formatCurrencyForPDF(item.buyPrice),
    formatCurrencyForPDF(item.sellPrice),
    formatCurrencyForPDF(item.totalBuyValue),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Item Name", "Material", "Form", "Quantity", "Buy Price", "Sell Price", "Total Value"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// LOW STOCK ONLY EXPORT
// ============================================================================

interface LowStockExportData {
  items: Array<{
    name: string;
    materialType: string;
    currentQty: number;
    threshold: number;
    unit?: string;
  }>;
}

interface LowStockExportOptions {
  filename: string;
  companyName?: string;
}

export function exportLowStockToExcel(
  data: LowStockExportData,
  options: LowStockExportOptions
): void {
  const { filename } = options;
  const workbook = XLSX.utils.book_new();

  const summaryData: (string | number)[][] = [
    ["Low Stock Report"],
    [],
    ["Generated On", formatDate(new Date())],
    ["Total Low Stock Items", data.items.length],
    [],
    ["Item Name", "Material Type", "Current Qty", "Threshold", "Shortage"],
  ];

  data.items.forEach((item) => {
    const shortage = item.threshold - item.currentQty;
    summaryData.push([
      item.name,
      item.materialType,
      `${item.currentQty}${item.unit ? ` ${item.unit}` : ""}`,
      `${item.threshold}${item.unit ? ` ${item.unit}` : ""}`,
      `${shortage}${item.unit ? ` ${item.unit}` : ""}`,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Low Stock");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportLowStockToPDF(
  data: LowStockExportData,
  options: LowStockExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text("Low Stock Report", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Items: ${data.items.length}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  const tableData = data.items.map((item) => {
    const shortage = item.threshold - item.currentQty;
    return [
      item.name,
      item.materialType,
      `${item.currentQty}${item.unit ? ` ${item.unit}` : ""}`,
      `${item.threshold}${item.unit ? ` ${item.unit}` : ""}`,
      `${shortage}${item.unit ? ` ${item.unit}` : ""}`,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [["Item Name", "Material", "Current Qty", "Threshold", "Shortage"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center", textColor: [239, 68, 68] },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// PARTY LEDGER EXPORT
// ============================================================================

interface PartyLedgerExcelData {
  party: { id: string; name: string; type: string };
  summary: {
    openingBalance: number;
    totalDebits: number;
    totalCredits: number;
    closingBalance: number;
  };
  transactions: Array<{
    date: string;
    type: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  dateRange: { startDate: string; endDate: string };
}

interface PartyLedgerPDFData {
  party: { id: string; name: string; type: string };
  summary: {
    openingBalance: number;
    totalDebits: number;
    totalCredits: number;
    closingBalance: number;
  };
  transactions: Array<{
    date: string;
    type: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  dateRange: { startDate: string; endDate: string };
}

interface PartyLedgerExportOptions {
  filename: string;
  companyName?: string;
}

export function exportPartyLedgerToExcel(
  data: PartyLedgerExcelData,
  options: PartyLedgerExportOptions
): void {
  const { filename } = options;
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ["Party Ledger"],
    [],
    ["Party Name", data.party.name],
    ["Party Type", data.party.type],
    ["Date Range", `${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`],
    ["Generated On", formatDate(new Date())],
    [],
    ["Account Summary"],
    ["Opening Balance", formatCurrencyForExcel(data.summary.openingBalance)],
    ["Total Debits", formatCurrencyForExcel(data.summary.totalDebits)],
    ["Total Credits", formatCurrencyForExcel(data.summary.totalCredits)],
    ["Closing Balance", formatCurrencyForExcel(data.summary.closingBalance)],
    [],
    [],
    ["Transaction History"],
    ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"],
  ];

  data.transactions.forEach((txn) => {
    summaryData.push([
      formatDate(txn.date),
      txn.type,
      txn.reference,
      txn.description,
      txn.debit > 0 ? formatCurrencyForExcel(txn.debit) : "-",
      txn.credit > 0 ? formatCurrencyForExcel(txn.credit) : "-",
      formatCurrencyForExcel(txn.balance),
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  worksheet["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Party Ledger");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportPartyLedgerToPDF(
  data: PartyLedgerPDFData,
  options: PartyLedgerExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text("Party Ledger", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(data.party.name, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 6;
  doc.setFontSize(10);
  doc.text(`${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Account Summary", 14, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryItems = [
    ["Opening Balance:", formatCurrencyForPDF(data.summary.openingBalance)],
    ["Total Debits:", formatCurrencyForPDF(data.summary.totalDebits)],
    ["Total Credits:", formatCurrencyForPDF(data.summary.totalCredits)],
    ["Closing Balance:", formatCurrencyForPDF(data.summary.closingBalance)],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(label, 14, yPosition);
    doc.text(value, 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction History", 14, yPosition);
  yPosition += 5;

  const tableData = data.transactions.map((txn) => [
    formatDate(txn.date),
    txn.type,
    txn.reference,
    txn.debit > 0 ? formatCurrencyForPDF(txn.debit) : "-",
    txn.credit > 0 ? formatCurrencyForPDF(txn.credit) : "-",
    formatCurrencyForPDF(txn.balance),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Date", "Type", "Reference", "Debit", "Credit", "Balance"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// INVOICE REPORT EXPORT
// ============================================================================

interface InvoiceReportExcelData {
  summary: {
    totalInvoiced: number;
    paidAmount: number;
    outstandingAmount: number;
    averageInvoiceValue: number;
    invoiceCount: number;
  };
  invoices: Array<{
    invoiceNumber: string;
    date: string;
    customer: string;
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: string;
  }>;
  overdueInvoices: Array<{
    invoiceNumber: string;
    customer: string;
    dueDate: string;
    amount: number;
    daysOverdue: number;
  }>;
  dateRange: { startDate: string; endDate: string };
}

interface InvoiceReportPDFData {
  summary: {
    totalInvoiced: number;
    paidAmount: number;
    outstandingAmount: number;
    averageInvoiceValue: number;
    invoiceCount: number;
  };
  statusDistribution: Array<{ name: string; value: number }>;
  agingData: Array<{ name: string; value: number }>;
  topCustomers: Array<{ name: string; amount: number; invoiceCount: number }>;
  dateRange: { startDate: string; endDate: string };
}

interface InvoiceReportExportOptions {
  filename: string;
  companyName?: string;
}

export function exportInvoiceReportToExcel(
  data: InvoiceReportExcelData,
  options: InvoiceReportExportOptions
): void {
  const { filename } = options;
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ["Invoice Report"],
    [],
    ["Date Range", `${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`],
    ["Generated On", formatDate(new Date())],
    [],
    ["Summary"],
    ["Total Invoiced", formatCurrencyForExcel(data.summary.totalInvoiced)],
    ["Paid Amount", formatCurrencyForExcel(data.summary.paidAmount)],
    ["Outstanding", formatCurrencyForExcel(data.summary.outstandingAmount)],
    ["Average Invoice Value", formatCurrencyForExcel(data.summary.averageInvoiceValue)],
    ["Total Invoices", data.summary.invoiceCount],
    [],
    [],
    ["Invoice List"],
    ["Invoice #", "Date", "Customer", "Due Date", "Amount", "Paid", "Status"],
  ];

  data.invoices.forEach((inv) => {
    summaryData.push([
      inv.invoiceNumber,
      formatDate(inv.date),
      inv.customer,
      formatDate(inv.dueDate),
      formatCurrencyForExcel(inv.amount),
      formatCurrencyForExcel(inv.paidAmount),
      inv.status,
    ]);
  });

  if (data.overdueInvoices.length > 0) {
    summaryData.push([], [], ["Overdue Invoices"], ["Invoice #", "Customer", "Due Date", "Amount", "Days Overdue"]);
    data.overdueInvoices.forEach((inv) => {
      summaryData.push([inv.invoiceNumber, inv.customer, formatDate(inv.dueDate), formatCurrencyForExcel(inv.amount), inv.daysOverdue.toString()]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  worksheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportInvoiceReportToPDF(
  data: InvoiceReportPDFData,
  options: InvoiceReportExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text("Invoice Report", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryItems = [
    ["Total Invoiced:", formatCurrencyForPDF(data.summary.totalInvoiced)],
    ["Paid Amount:", formatCurrencyForPDF(data.summary.paidAmount)],
    ["Outstanding:", formatCurrencyForPDF(data.summary.outstandingAmount)],
    ["Average Invoice:", formatCurrencyForPDF(data.summary.averageInvoiceValue)],
    ["Total Invoices:", data.summary.invoiceCount.toString()],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(label, 14, yPosition);
    doc.text(value, 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Aging Analysis", 14, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  data.agingData.forEach((item) => {
    doc.text(`${item.name}:`, 14, yPosition);
    doc.text(formatCurrencyForPDF(item.value), 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Top Customers", 14, yPosition);
  yPosition += 5;

  const tableData = data.topCustomers.map((c) => [c.name, c.invoiceCount.toString(), formatCurrencyForPDF(c.amount)]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Customer", "Invoices", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// PAYMENT REPORT EXPORT
// ============================================================================

interface PaymentReportExcelData {
  summary: {
    totalIn: number;
    totalOut: number;
    netFlow: number;
    transactionCount: number;
  };
  payments: Array<{
    date: string;
    party: string;
    type: string;
    method: string;
    amount: number;
    reference: string;
  }>;
  dateRange: { startDate: string; endDate: string };
}

interface PaymentReportPDFData {
  summary: {
    totalIn: number;
    totalOut: number;
    netFlow: number;
    transactionCount: number;
  };
  paymentByMethod: Array<{ name: string; value: number }>;
  topPayers: Array<{ name: string; amount: number; count: number }>;
  topPayees: Array<{ name: string; amount: number; count: number }>;
  dateRange: { startDate: string; endDate: string };
}

interface PaymentReportExportOptions {
  filename: string;
  companyName?: string;
}

export function exportPaymentReportToExcel(
  data: PaymentReportExcelData,
  options: PaymentReportExportOptions
): void {
  const { filename } = options;
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ["Payment Report"],
    [],
    ["Date Range", `${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`],
    ["Generated On", formatDate(new Date())],
    [],
    ["Summary"],
    ["Total Payment In", formatCurrencyForExcel(data.summary.totalIn)],
    ["Total Payment Out", formatCurrencyForExcel(data.summary.totalOut)],
    ["Net Cash Flow", formatCurrencyForExcel(data.summary.netFlow)],
    ["Total Transactions", data.summary.transactionCount],
    [],
    [],
    ["Payment List"],
    ["Date", "Party", "Type", "Method", "Reference", "Amount"],
  ];

  data.payments.forEach((p) => {
    summaryData.push([
      formatDate(p.date),
      p.party,
      p.type,
      p.method,
      p.reference,
      `${p.type === "IN" ? "+" : "-"}${formatCurrencyForExcel(p.amount)}`,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  worksheet["!cols"] = [{ wch: 12 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportPaymentReportToPDF(
  data: PaymentReportPDFData,
  options: PaymentReportExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text("Payment Report", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryItems = [
    ["Total Payment In:", formatCurrencyForPDF(data.summary.totalIn)],
    ["Total Payment Out:", formatCurrencyForPDF(data.summary.totalOut)],
    ["Net Cash Flow:", formatCurrencyForPDF(data.summary.netFlow)],
    ["Total Transactions:", data.summary.transactionCount.toString()],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(label, 14, yPosition);
    doc.text(value, 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Payment by Method", 14, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  data.paymentByMethod.forEach((item) => {
    doc.text(`${item.name}:`, 14, yPosition);
    doc.text(formatCurrencyForPDF(item.value), 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Top Payers (Customers)", 14, yPosition);
  yPosition += 5;

  const payersData = data.topPayers.slice(0, 5).map((p) => [p.name, p.count.toString(), formatCurrencyForPDF(p.amount)]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Customer", "Count", "Amount"]],
    body: payersData,
    theme: "striped",
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// GENERIC TABLE EXPORT
// ============================================================================

/**
 * Export any table data to Excel
 */
export function exportTableToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string; format?: (value: unknown) => string }>,
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  // Create header row
  const headers = columns.map((col) => col.header);

  // Create data rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      return col.format ? col.format(value) : String(value ?? "");
    })
  );

  // Combine headers and rows
  const sheetData = [headers, ...rows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths based on content
  worksheet["!cols"] = columns.map(() => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ============================================================================
// SINGLE INVOICE EXPORT
// ============================================================================

import type { Invoice } from "@/types";

interface SingleInvoiceExportOptions {
  filename?: string;
  companyName?: string;
}

/**
 * Export a single invoice to Excel
 */
export function exportSingleInvoiceToExcel(
  invoice: Invoice,
  options: SingleInvoiceExportOptions = {}
): void {
  const filename = options.filename || `Invoice-${invoice.invoiceNumber.replace(/\//g, "-")}`;
  const workbook = XLSX.utils.book_new();

  const isInterState = invoice.supplyType === "INTER_STATE";

  // Invoice header data
  const headerData: (string | number)[][] = [
    ["TAX INVOICE"],
    [],
    ["Invoice Number", invoice.invoiceNumber],
    ["Invoice Date", formatDate(invoice.invoiceDate)],
    invoice.dueDate ? ["Due Date", formatDate(invoice.dueDate)] : [],
    ["Invoice Type", invoice.invoiceType.replace("_", " ")],
    ["Supply Type", isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"],
    [],
    ["SELLER DETAILS"],
    ["Name", invoice.seller.legalName],
    ["GSTIN", invoice.seller.gstin],
    ["Address", `${invoice.seller.address.line1}, ${invoice.seller.address.city}, ${invoice.seller.address.state} - ${invoice.seller.address.pincode}`],
    ["State Code", invoice.seller.address.stateCode],
    [],
    ["BUYER DETAILS"],
    ["Name", invoice.buyer.name],
    ["GSTIN", invoice.buyer.gstin || "N/A (Unregistered)"],
    ["Customer Type", invoice.buyer.customerType.replace("_", " ")],
    ["Address", `${invoice.buyer.billingAddress.line1}, ${invoice.buyer.billingAddress.city}, ${invoice.buyer.billingAddress.state} - ${invoice.buyer.billingAddress.pincode}`],
    ["Place of Supply", `${invoice.buyer.placeOfSupply}`],
    [],
    [],
    ["LINE ITEMS"],
  ];

  // Add items header
  if (isInterState) {
    headerData.push(["#", "Item", "HSN", "Qty", "Unit", "Rate", "Taxable", "IGST Rate", "IGST Amt", "Total"]);
  } else {
    headerData.push(["#", "Item", "HSN", "Qty", "Unit", "Rate", "Taxable", "CGST Rate", "CGST Amt", "SGST Amt", "Total"]);
  }

  // Add items
  invoice.items.forEach((item, index) => {
    if (isInterState) {
      headerData.push([
        index + 1,
        item.name,
        item.hsnCode,
        item.quantity,
        item.unit,
        formatCurrencyForExcel(item.unitPrice),
        formatCurrencyForExcel(item.taxableValue),
        `${item.gstRate || 18}%`,
        formatCurrencyForExcel(item.igstAmount || 0),
        formatCurrencyForExcel(item.totalAmount),
      ]);
    } else {
      headerData.push([
        index + 1,
        item.name,
        item.hsnCode,
        item.quantity,
        item.unit,
        formatCurrencyForExcel(item.unitPrice),
        formatCurrencyForExcel(item.taxableValue),
        `${(item.gstRate || 18) / 2}%`,
        formatCurrencyForExcel(item.cgstAmount || 0),
        formatCurrencyForExcel(item.sgstAmount || 0),
        formatCurrencyForExcel(item.totalAmount),
      ]);
    }
  });

  // Add totals
  headerData.push([]);
  headerData.push([]);
  headerData.push(["TOTALS"]);
  headerData.push(["Subtotal", "", "", "", "", "", formatCurrencyForExcel(invoice.totals.subtotal)]);
  
  if (invoice.totals.totalDiscount > 0) {
    headerData.push(["Discount", "", "", "", "", "", `-${formatCurrencyForExcel(invoice.totals.totalDiscount)}`]);
  }
  
  if (isInterState) {
    headerData.push(["IGST", "", "", "", "", "", formatCurrencyForExcel(invoice.totals.totalIgst)]);
  } else {
    headerData.push(["CGST", "", "", "", "", "", formatCurrencyForExcel(invoice.totals.totalCgst)]);
    headerData.push(["SGST", "", "", "", "", "", formatCurrencyForExcel(invoice.totals.totalSgst)]);
  }
  
  if (invoice.totals.roundOff !== 0) {
    headerData.push(["Round Off", "", "", "", "", "", formatCurrencyForExcel(invoice.totals.roundOff)]);
  }
  
  headerData.push(["Grand Total", "", "", "", "", "", formatCurrencyForExcel(invoice.totals.grandTotal)]);
  headerData.push([]);
  headerData.push(["Amount in Words", invoice.totals.amountInWords]);
  headerData.push([]);
  headerData.push(["Payment Status", invoice.paymentStatus]);
  headerData.push(["Amount Paid", formatCurrencyForExcel(invoice.paidAmount)]);
  headerData.push(["Balance Due", formatCurrencyForExcel(invoice.dueAmount)]);

  const worksheet = XLSX.utils.aoa_to_sheet(headerData);
  worksheet["!cols"] = [
    { wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export multiple invoices to Excel (for bulk export)
 */
export function exportInvoicesToExcel(
  invoices: Invoice[],
  options: SingleInvoiceExportOptions = {}
): void {
  const filename = options.filename || `Invoices-Export-${new Date().toISOString().split("T")[0]}`;
  const workbook = XLSX.utils.book_new();

  const headerRow = [
    "Invoice #",
    "Date",
    "Due Date",
    "Type",
    "Customer",
    "GSTIN",
    "Place of Supply",
    "Subtotal",
    "CGST",
    "SGST",
    "IGST",
    "Total",
    "Paid",
    "Balance",
    "Status",
  ];

  const dataRows = invoices.map((inv) => [
    inv.invoiceNumber,
    formatDate(inv.invoiceDate),
    inv.dueDate ? formatDate(inv.dueDate) : "",
    inv.invoiceType.replace("_", " "),
    inv.buyer.name,
    inv.buyer.gstin || "N/A",
    inv.buyer.placeOfSupply,
    formatCurrencyForExcel(inv.totals.subtotal),
    formatCurrencyForExcel(inv.totals.totalCgst),
    formatCurrencyForExcel(inv.totals.totalSgst),
    formatCurrencyForExcel(inv.totals.totalIgst),
    formatCurrencyForExcel(inv.totals.grandTotal),
    formatCurrencyForExcel(inv.paidAmount),
    formatCurrencyForExcel(inv.dueAmount),
    inv.status,
  ]);

  const sheetData = [headerRow, ...dataRows];
  
  // Add summary at bottom
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totals.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  
  sheetData.push([]);
  sheetData.push(["Summary"]);
  sheetData.push(["Total Invoices", invoices.length.toString()]);
  sheetData.push(["Total Amount", "", "", "", "", "", "", "", "", "", "", formatCurrencyForExcel(totalAmount)]);
  sheetData.push(["Total Paid", "", "", "", "", "", "", "", "", "", "", "", formatCurrencyForExcel(totalPaid)]);
  sheetData.push(["Total Outstanding", "", "", "", "", "", "", "", "", "", "", "", "", formatCurrencyForExcel(totalDue)]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!cols"] = [
    { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 30 },
    { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ============================================================================
// ORDER REPORT EXPORTS
// ============================================================================

interface OrderReportSummary {
  totalOrders: number;
  totalValue: number;
  confirmedOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

interface OrderReportOrder {
  id: string;
  orderNumber: string;
  date: string;
  customer: string;
  items: number;
  amount: number;
  status: string;
}

interface OrderReportTopCustomer {
  name: string;
  orderCount: number;
  totalAmount: number;
}

interface OrderReportExcelData {
  summary: OrderReportSummary;
  orders: OrderReportOrder[];
  topCustomers: OrderReportTopCustomer[];
  dateRange: { startDate: string; endDate: string };
}

interface OrderReportPDFData {
  summary: OrderReportSummary;
  statusDistribution: Array<{ name: string; value: number }>;
  topCustomers: OrderReportTopCustomer[];
  dateRange: { startDate: string; endDate: string };
}

interface OrderReportExportOptions {
  filename: string;
  companyName?: string;
}

/**
 * Export Order Report to Excel
 */
export function exportOrderReportToExcel(
  data: OrderReportExcelData,
  options: OrderReportExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const workbook = XLSX.utils.book_new();

  // Summary data
  const summaryData: (string | number)[][] = [
    [companyName],
    ["Order Report"],
    [`Period: ${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`],
    [],
    ["Summary"],
    ["Total Orders", data.summary.totalOrders.toString()],
    ["Total Order Value", formatCurrencyForExcel(data.summary.totalValue)],
    ["Confirmed Orders", data.summary.confirmedOrders.toString()],
    ["Delivered Orders", data.summary.deliveredOrders.toString()],
    ["Pending/Draft Orders", data.summary.pendingOrders.toString()],
    ["Cancelled Orders", data.summary.cancelledOrders.toString()],
    [],
    [],
    ["Order Details"],
    ["Order #", "Date", "Customer", "Items", "Amount", "Status"],
  ];

  data.orders.forEach((order) => {
    summaryData.push([
      order.orderNumber,
      formatDate(order.date),
      order.customer,
      order.items.toString(),
      formatCurrencyForExcel(order.amount),
      order.status,
    ]);
  });

  // Top Customers section
  if (data.topCustomers.length > 0) {
    summaryData.push([], [], ["Top Customers"], ["Customer Name", "Order Count", "Total Amount"]);
    data.topCustomers.forEach((customer) => {
      summaryData.push([customer.name, customer.orderCount.toString(), formatCurrencyForExcel(customer.totalAmount)]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Order Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export Order Report to PDF
 */
export function exportOrderReportToPDF(
  data: OrderReportPDFData,
  options: OrderReportExportOptions
): void {
  const { filename, companyName = "MarbleOps" } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text("Order Report", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${formatDate(data.dateRange.startDate)} to ${formatDate(data.dateRange.endDate)}`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  // Summary section
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryItems = [
    ["Total Orders:", data.summary.totalOrders.toString()],
    ["Total Order Value:", formatCurrencyForPDF(data.summary.totalValue)],
    ["Confirmed Orders:", data.summary.confirmedOrders.toString()],
    ["Delivered Orders:", data.summary.deliveredOrders.toString()],
    ["Pending/Draft Orders:", data.summary.pendingOrders.toString()],
    ["Cancelled Orders:", data.summary.cancelledOrders.toString()],
  ];

  summaryItems.forEach((item) => {
    doc.text(item[0], 14, yPosition);
    doc.text(item[1], 80, yPosition);
    yPosition += 6;
  });

  // Status Distribution
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Status Distribution", 14, yPosition);

  yPosition += 5;
  autoTable(doc, {
    startY: yPosition,
    head: [["Status", "Order Value"]],
    body: data.statusDistribution.map((item) => [item.name, formatCurrencyForPDF(item.value)]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Top Customers
  if (data.topCustomers.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Top Customers", 14, yPosition);

    yPosition += 5;
    autoTable(doc, {
      startY: yPosition,
      head: [["Customer", "Orders", "Total Amount"]],
      body: data.topCustomers.map((customer) => [
        customer.name,
        customer.orderCount.toString(),
        formatCurrencyForPDF(customer.totalAmount),
      ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString("en-IN")}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${filename}.pdf`);
}
