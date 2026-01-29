/**
 * Payment Receipt PDF Generation
 * Uses jspdf for PDF creation
 */

import jsPDF from "jspdf";
import type { OrderPayment, Order } from "@/types";
import { mockSellerDetails } from "./mock/invoices";

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

// Get payment mode display name
function getPaymentModeDisplay(mode: string): string {
  const modes: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque",
    CARD: "Card",
    CREDIT: "Credit",
  };
  return modes[mode] || mode;
}

// Get allocation type display name
function getAllocationTypeDisplay(type: string): string {
  const types: Record<string, string> = {
    ADVANCE: "Advance Payment",
    AGAINST_ORDER: "Against Order",
    AGAINST_INVOICE: "Against Invoice",
  };
  return types[type] || type;
}

// Convert number to words (Indian system)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';

  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
    num = rupees % 10000000;
  }
  if (rupees >= 100000) {
    result += convertLessThanThousand(Math.floor((rupees % 10000000) / 100000)) + ' Lakh ';
  }
  if (rupees >= 1000) {
    result += convertLessThanThousand(Math.floor((rupees % 100000) / 1000)) + ' Thousand ';
  }
  if (rupees % 1000 > 0) {
    result += convertLessThanThousand(rupees % 1000);
  }

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  return result + ' Only';
}

interface ReceiptPDFOptions {
  showWatermark?: boolean;
}

/**
 * Generate a Payment Receipt PDF
 */
export function generateReceiptPDF(
  payment: OrderPayment,
  order: Order,
  options: ReceiptPDFOptions = {}
): jsPDF {
  const { showWatermark = false } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Watermark if needed
  if (showWatermark) {
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(50);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
    doc.setTextColor(0, 0, 0);
  }

  // Header - Document Type
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235); // Primary blue
  doc.text("PAYMENT RECEIPT", margin, yPos + 5);

  // Receipt Number & Date (right side)
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: ${payment.receiptNumber}`, pageWidth - margin, yPos, {
    align: "right",
  });
  doc.text(
    `Date: ${formatDatePDF(payment.paymentDate)}`,
    pageWidth - margin,
    yPos + 5,
    { align: "right" }
  );
  doc.text(
    `Order: ${payment.orderNumber}`,
    pageWidth - margin,
    yPos + 10,
    { align: "right" }
  );

  yPos += 25;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // From & Received From (two columns)
  const colWidth = (pageWidth - margin * 3) / 2;

  // From (Seller/Company)
  const seller = mockSellerDetails;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("From:", margin, yPos);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(seller.legalName, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`GSTIN: ${seller.gstin}`, margin, yPos + 12);
  doc.text(seller.address.line1, margin, yPos + 17);
  if (seller.address.line2) {
    doc.text(seller.address.line2, margin, yPos + 22);
  }
  doc.text(
    `${seller.address.city}, ${seller.address.state} - ${seller.address.pincode}`,
    margin,
    yPos + (seller.address.line2 ? 27 : 22)
  );
  doc.text(
    `Phone: ${seller.contact.phone}`,
    margin,
    yPos + (seller.address.line2 ? 32 : 27)
  );

  // Received From (Customer)
  const customerX = margin + colWidth + margin;
  const customerSnapshot = order.customerSnapshot ?? {
    name: (order as { partyName?: string }).partyName ?? "Customer",
    gstin: undefined,
    phone: undefined,
    email: undefined,
  };
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Received From:", customerX, yPos);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(customerSnapshot.name ?? "Customer", customerX, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (customerSnapshot.gstin) {
    doc.text(`GSTIN: ${customerSnapshot.gstin}`, customerX, yPos + 12);
  }
  doc.text(`Phone: ${customerSnapshot.phone ?? "—"}`, customerX, yPos + (customerSnapshot.gstin ? 17 : 12));
  if (customerSnapshot.email) {
    doc.text(`Email: ${customerSnapshot.email}`, customerX, yPos + (customerSnapshot.gstin ? 22 : 17));
  }

  yPos += 50;

  // Payment Amount Box (highlighted)
  doc.setFillColor(34, 197, 94); // Green background
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 3, 3, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Amount Received", pageWidth / 2, yPos + 12, { align: "center" });
  
  doc.setFontSize(28);
  doc.text(formatCurrencyPDF(payment.amount), pageWidth / 2, yPos + 30, { align: "center" });

  yPos += 50;

  // Amount in Words
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  doc.text(`Amount in words: ${numberToWords(payment.amount)}`, margin, yPos);

  yPos += 15;

  // Payment Details Section
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 55, 2, 2, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Payment Details", margin + 5, yPos + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  // Left column
  doc.text(`Payment Mode: ${getPaymentModeDisplay(payment.paymentMode)}`, margin + 5, yPos + 18);
  doc.text(`Allocation: ${getAllocationTypeDisplay(payment.allocationType)}`, margin + 5, yPos + 26);
  if (payment.referenceNumber) {
    doc.text(`Reference No: ${payment.referenceNumber}`, margin + 5, yPos + 34);
  }
  if (payment.bankName) {
    doc.text(`Bank: ${payment.bankName}`, margin + 5, yPos + 42);
  }

  // Right column
  const rightColX = pageWidth / 2 + 10;
  doc.text(`Payment Date: ${formatDatePDF(payment.paymentDate)}`, rightColX, yPos + 18);
  doc.text(`Received By: ${payment.receivedBy}`, rightColX, yPos + 26);
  if (payment.chequeNumber) {
    doc.text(`Cheque No: ${payment.chequeNumber}`, rightColX, yPos + 34);
  }
  if (payment.chequeDate) {
    doc.text(`Cheque Date: ${formatDatePDF(payment.chequeDate)}`, rightColX, yPos + 42);
  }

  yPos += 65;

  // Order Summary Section
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 45, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 45, 2, 2, "S");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Order Summary", margin + 5, yPos + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  // Summary details
  const orderGrandTotal = (order as { grandTotal?: number }).grandTotal ?? order.totalAmount;
  const orderAmountPaid = (order as { amountPaid?: number }).amountPaid ?? 0;
  doc.text(`Order Number: ${order.orderNumber}`, margin + 5, yPos + 18);
  doc.text(`Order Total: ${formatCurrencyPDF(orderGrandTotal)}`, margin + 5, yPos + 26);
  
  const totalPaidAfter = orderAmountPaid + payment.amount;
  const balanceAfter = orderGrandTotal - totalPaidAfter;
  
  doc.text(`Total Paid (including this): ${formatCurrencyPDF(totalPaidAfter)}`, rightColX, yPos + 18);
  doc.setTextColor(balanceAfter <= 0 ? 34 : 239, balanceAfter <= 0 ? 197 : 68, balanceAfter <= 0 ? 94 : 68);
  doc.text(`Balance Due: ${formatCurrencyPDF(Math.max(0, balanceAfter))}`, rightColX, yPos + 26);
  
  if (balanceAfter <= 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text("FULLY PAID", rightColX, yPos + 36);
  }

  yPos += 55;

  // Notes section (if any)
  if (payment.notes) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(payment.notes, margin, yPos + 6);
    yPos += 20;
  }

  // Check if we need a new page for signatures
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = margin + 20;
  }

  // Signature Areas
  const signatureY = pageHeight - 50;
  const boxWidth = 60;

  // For Company
  doc.setDrawColor(150, 150, 150);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.line(margin, signatureY, margin + boxWidth, signatureY);
  doc.text("For " + seller.tradeName, margin + boxWidth / 2, signatureY + 5, {
    align: "center",
  });
  doc.text("(Authorized Signatory)", margin + boxWidth / 2, signatureY + 10, {
    align: "center",
  });

  // Receiver's Acknowledgment
  doc.line(pageWidth - margin - boxWidth, signatureY, pageWidth - margin, signatureY);
  doc.text("Payer's Acknowledgment", pageWidth - margin - boxWidth / 2, signatureY + 5, {
    align: "center",
  });
  doc.text("(Signature)", pageWidth - margin - boxWidth / 2, signatureY + 10, {
    align: "center",
  });

  // Declaration
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This is a computer-generated receipt. Subject to realization of cheque/bank transfer.",
    pageWidth / 2,
    signatureY + 20,
    { align: "center" }
  );

  // Footer - Page numbers and generation info
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
 * Download payment receipt as PDF
 */
export function downloadReceiptPDF(
  payment: OrderPayment,
  order: Order,
  options?: ReceiptPDFOptions
): void {
  const doc = generateReceiptPDF(payment, order, options);
  const filename = `Receipt-${payment.receiptNumber.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}

/**
 * Get payment receipt PDF as Blob (for preview or upload)
 */
export function getReceiptPDFBlob(
  payment: OrderPayment,
  order: Order,
  options?: ReceiptPDFOptions
): Blob {
  const doc = generateReceiptPDF(payment, order, options);
  return doc.output("blob");
}

/**
 * Open payment receipt PDF in new tab for preview/print
 */
export function printReceiptPDF(
  payment: OrderPayment,
  order: Order,
  options?: ReceiptPDFOptions
): void {
  const doc = generateReceiptPDF(payment, order, options);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Preview payment receipt PDF in new tab
 */
export function previewReceiptPDF(
  payment: OrderPayment,
  order: Order,
  options?: ReceiptPDFOptions
): void {
  const doc = generateReceiptPDF(payment, order, options);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
