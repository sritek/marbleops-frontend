/**
 * GST-Compliant Invoice PDF Generation
 * Uses jspdf and jspdf-autotable for PDF creation
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "@/types";
import { formatAmountInWords } from "./mock/invoices";
import { INDIAN_STATES } from "@/types";

// Currency formatter for PDF (avoid Unicode rupee symbol)
function formatCurrencyPDF(amount: number): string {
  return `Rs. ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

// Date formatter
function formatDatePDF(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Get state name from code
function getStateName(code: string): string {
  return INDIAN_STATES.find((s) => s.code === code)?.name || code;
}

interface InvoicePDFOptions {
  showWatermark?: boolean;
  showBankDetails?: boolean;
  showTerms?: boolean;
}

/**
 * Generate a GST-compliant invoice PDF
 */
export function generateInvoicePDF(
  invoice: Invoice,
  options: InvoicePDFOptions = {}
): jsPDF {
  const {
    showWatermark = invoice.status === "DRAFT",
    showBankDetails = true,
    showTerms = true,
  } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  const isInterState = invoice.supplyType === "INTER_STATE";
  const isCreditNote = invoice.invoiceType === "CREDIT_NOTE";

  // Watermark for drafts
  if (showWatermark) {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.text("DRAFT", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
    doc.setTextColor(0, 0, 0);
  }

  // Header - Invoice Type
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235); // Primary blue
  
  const invoiceTitle = isCreditNote ? "CREDIT NOTE" : "TAX INVOICE";
  doc.text(invoiceTitle, margin, yPos + 5);

  // Invoice Number & Date (right side)
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth - margin, yPos, {
    align: "right",
  });
  doc.text(
    `Date: ${formatDatePDF(invoice.invoiceDate)}`,
    pageWidth - margin,
    yPos + 5,
    { align: "right" }
  );
  if (invoice.dueDate) {
    doc.text(
      `Due Date: ${formatDatePDF(invoice.dueDate)}`,
      pageWidth - margin,
      yPos + 10,
      { align: "right" }
    );
  }

  yPos += 25;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Seller & Buyer Details (two columns)
  const colWidth = (pageWidth - margin * 3) / 2;

  // Seller (From)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("From:", margin, yPos);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.seller.legalName, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`GSTIN: ${invoice.seller.gstin}`, margin, yPos + 12);
  doc.text(invoice.seller.address.line1, margin, yPos + 17);
  if (invoice.seller.address.line2) {
    doc.text(invoice.seller.address.line2, margin, yPos + 22);
  }
  doc.text(
    `${invoice.seller.address.city}, ${invoice.seller.address.state} - ${invoice.seller.address.pincode}`,
    margin,
    yPos + (invoice.seller.address.line2 ? 27 : 22)
  );
  doc.text(
    `State Code: ${invoice.seller.address.stateCode}`,
    margin,
    yPos + (invoice.seller.address.line2 ? 32 : 27)
  );

  // Buyer (To)
  const buyerX = margin + colWidth + margin;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("To:", buyerX, yPos);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.buyer.name, buyerX, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (invoice.buyer.gstin) {
    doc.text(`GSTIN: ${invoice.buyer.gstin}`, buyerX, yPos + 12);
  } else {
    doc.text(
      `(${invoice.buyer.customerType.replace("_", " ")})`,
      buyerX,
      yPos + 12
    );
  }
  doc.text(invoice.buyer.billingAddress.line1, buyerX, yPos + 17);
  doc.text(
    `${invoice.buyer.billingAddress.city}, ${invoice.buyer.billingAddress.state} - ${invoice.buyer.billingAddress.pincode}`,
    buyerX,
    yPos + 22
  );
  doc.text(
    `Place of Supply: ${getStateName(invoice.buyer.placeOfSupply)} (${
      invoice.buyer.placeOfSupply
    })`,
    buyerX,
    yPos + 27
  );

  yPos += 45;

  // Supply Type indicator
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Supply Type: ${isInterState ? "INTER-STATE (IGST)" : "INTRA-STATE (CGST + SGST)"}`,
    margin + 5,
    yPos + 5.5
  );

  yPos += 15;

  // Items Table
  const tableColumns = isInterState
    ? ["#", "Item Description", "HSN", "Qty", "Rate", "Taxable", "IGST", "Total"]
    : ["#", "Item Description", "HSN", "Qty", "Rate", "Taxable", "CGST", "SGST", "Total"];

  const tableRows = invoice.items.map((item, index) => {
    let description = item.name;
    if (item.dimensions) {
      description += `\n(${item.dimensions.length} x ${item.dimensions.width} ft`;
      if (item.areaSqFt) {
        description += ` = ${item.areaSqFt} sq ft`;
      }
      description += ")";
    }
    if (item.description) {
      description += `\n${item.description}`;
    }

    if (isInterState) {
      return [
        (index + 1).toString(),
        description,
        item.hsnCode,
        `${item.quantity} ${item.unit}`,
        formatCurrencyPDF(item.unitPrice),
        formatCurrencyPDF(item.taxableValue),
        formatCurrencyPDF(item.igstAmount || 0),
        formatCurrencyPDF(item.totalAmount),
      ];
    } else {
      return [
        (index + 1).toString(),
        description,
        item.hsnCode,
        `${item.quantity} ${item.unit}`,
        formatCurrencyPDF(item.unitPrice),
        formatCurrencyPDF(item.taxableValue),
        formatCurrencyPDF(item.cgstAmount || 0),
        formatCurrencyPDF(item.sgstAmount || 0),
        formatCurrencyPDF(item.totalAmount),
      ];
    }
  });

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: isInterState
      ? {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 55 },
          2: { halign: "center", cellWidth: 18 },
          3: { halign: "center", cellWidth: 20 },
          4: { halign: "right", cellWidth: 22 },
          5: { halign: "right", cellWidth: 25 },
          6: { halign: "right", cellWidth: 20 },
          7: { halign: "right", cellWidth: 25 },
        }
      : {
          0: { halign: "center", cellWidth: 8 },
          1: { cellWidth: 45 },
          2: { halign: "center", cellWidth: 15 },
          3: { halign: "center", cellWidth: 18 },
          4: { halign: "right", cellWidth: 20 },
          5: { halign: "right", cellWidth: 22 },
          6: { halign: "right", cellWidth: 18 },
          7: { halign: "right", cellWidth: 18 },
          8: { halign: "right", cellWidth: 22 },
        },
    margin: { left: margin, right: margin },
  });

  // Get Y position after table
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Check if we need a new page for totals
  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = margin;
  }

  // Totals Section (right-aligned box)
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;
  let totalsY = yPos;

  // Draw totals box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);

  const totalsData = [
    ["Subtotal:", formatCurrencyPDF(invoice.totals.subtotal)],
  ];

  if (invoice.totals.totalDiscount > 0) {
    totalsData.push(["Discount:", `-${formatCurrencyPDF(invoice.totals.totalDiscount)}`]);
  }

  if (isInterState) {
    if (invoice.totals.totalIgst > 0) {
      totalsData.push([`IGST (18%):`, formatCurrencyPDF(invoice.totals.totalIgst)]);
    }
  } else {
    if (invoice.totals.totalCgst > 0) {
      totalsData.push([`CGST (9%):`, formatCurrencyPDF(invoice.totals.totalCgst)]);
      totalsData.push([`SGST (9%):`, formatCurrencyPDF(invoice.totals.totalSgst)]);
    }
  }

  if (invoice.totals.roundOff !== 0) {
    const sign = invoice.totals.roundOff >= 0 ? "+" : "-";
    totalsData.push([
      "Round Off:",
      `${sign}${formatCurrencyPDF(Math.abs(invoice.totals.roundOff))}`,
    ]);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  totalsData.forEach((row, index) => {
    doc.text(row[0], totalsX, totalsY + index * 6);
    doc.text(row[1], pageWidth - margin, totalsY + index * 6, { align: "right" });
  });

  totalsY += totalsData.length * 6 + 3;

  // Grand Total
  doc.setDrawColor(37, 99, 235);
  doc.line(totalsX, totalsY, pageWidth - margin, totalsY);
  totalsY += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", totalsX, totalsY);
  doc.setTextColor(37, 99, 235);
  doc.text(formatCurrencyPDF(invoice.totals.grandTotal), pageWidth - margin, totalsY, {
    align: "right",
  });
  doc.setTextColor(0, 0, 0);

  // Amount in Words (full width below table)
  yPos = Math.max(yPos, totalsY + 15);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Amount in Words: ${invoice.totals.amountInWords}`, margin + 5, yPos + 8);

  yPos += 20;

  // Payment Status
  if (invoice.paidAmount > 0 || invoice.dueAmount > 0) {
    doc.setFontSize(9);
    doc.text(`Paid: ${formatCurrencyPDF(invoice.paidAmount)}`, margin, yPos);
    doc.text(
      `Balance Due: ${formatCurrencyPDF(invoice.dueAmount)}`,
      margin + 60,
      yPos
    );
    yPos += 10;
  }

  // Bank Details
  if (showBankDetails && invoice.seller.bankDetails) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details for Payment:", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const bank = invoice.seller.bankDetails;
    doc.text(`Account Name: ${bank.accountName}`, margin, yPos);
    doc.text(`Account No: ${bank.accountNumber}`, margin, yPos + 4);
    doc.text(`IFSC: ${bank.ifscCode}`, margin, yPos + 8);
    doc.text(`Bank: ${bank.bankName}${bank.branch ? `, ${bank.branch}` : ""}`, margin, yPos + 12);
    if (bank.upiId) {
      doc.text(`UPI: ${bank.upiId}`, margin, yPos + 16);
      yPos += 4;
    }
    yPos += 20;
  }

  // Terms & Conditions
  if (showTerms && invoice.compliance?.termsAndConditions) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", margin, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const terms = invoice.compliance.termsAndConditions.split("\n");
    terms.forEach((line) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += 4;
    });
  }

  // Signature Area
  yPos = Math.max(yPos + 10, pageHeight - 35);
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = pageHeight - 35;
  }

  doc.setDrawColor(150, 150, 150);
  doc.line(pageWidth - margin - 50, yPos + 10, pageWidth - margin, yPos + 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Signatory", pageWidth - margin - 25, yPos + 15, {
    align: "center",
  });
  if (invoice.compliance?.authorizedSignatory) {
    doc.setFont("helvetica", "bold");
    doc.text(invoice.compliance.authorizedSignatory, pageWidth - margin - 25, yPos + 20, {
      align: "center",
    });
  }

  // Footer - Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString("en-IN")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
}

/**
 * Download invoice as PDF
 */
export function downloadInvoicePDF(invoice: Invoice, options?: InvoicePDFOptions): void {
  const doc = generateInvoicePDF(invoice, options);
  const filename = `${invoice.invoiceNumber.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}

/**
 * Get invoice PDF as Blob (for preview or upload)
 */
export function getInvoicePDFBlob(invoice: Invoice, options?: InvoicePDFOptions): Blob {
  const doc = generateInvoicePDF(invoice, options);
  return doc.output("blob");
}

/**
 * Open invoice PDF in new tab for preview
 */
export function previewInvoicePDF(invoice: Invoice, options?: InvoicePDFOptions): void {
  const doc = generateInvoicePDF(invoice, options);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
