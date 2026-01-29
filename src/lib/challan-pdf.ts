/**
 * Delivery Challan PDF Generation
 * Uses jspdf and jspdf-autotable for PDF creation
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DeliveryChallan, Order } from "@/types";
import { mockSellerDetails } from "./mock/invoices";

// Date formatter
function formatDatePDF(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Get transport mode display name
function getTransportModeDisplay(mode: string): string {
  const modes: Record<string, string> = {
    OWN: "Own Vehicle",
    COURIER: "Courier",
    CUSTOMER_PICKUP: "Customer Pickup",
    THIRD_PARTY: "Third Party Transport",
  };
  return modes[mode] || mode;
}

interface ChallanPDFOptions {
  showWatermark?: boolean;
}

/**
 * Generate a Delivery Challan PDF
 */
export function generateChallanPDF(
  challan: DeliveryChallan,
  order: Order,
  options: ChallanPDFOptions = {}
): jsPDF {
  const { showWatermark = challan.status === "DISPATCHED" } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Watermark for dispatched status
  if (showWatermark && challan.status === "DISPATCHED") {
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(50);
    doc.setFont("helvetica", "bold");
    doc.text("DISPATCHED", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
    doc.setTextColor(0, 0, 0);
  }

  // Header - Document Type
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235); // Primary blue
  doc.text("DELIVERY CHALLAN", margin, yPos + 5);

  // Challan Number & Date (right side)
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`Challan No: ${challan.challanNumber}`, pageWidth - margin, yPos, {
    align: "right",
  });
  doc.text(
    `Date: ${formatDatePDF(challan.challanDate)}`,
    pageWidth - margin,
    yPos + 5,
    { align: "right" }
  );
  doc.text(
    `Order: ${challan.orderNumber}`,
    pageWidth - margin,
    yPos + 10,
    { align: "right" }
  );

  yPos += 25;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // From & To Details (two columns)
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

  // To (Customer/Delivery Address)
  const buyerX = margin + colWidth + margin;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Deliver To:", buyerX, yPos);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(order.customerSnapshot.name, buyerX, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (order.customerSnapshot.gstin) {
    doc.text(`GSTIN: ${order.customerSnapshot.gstin}`, buyerX, yPos + 12);
  }
  
  const deliveryAddr = challan.deliveryAddress;
  doc.text(deliveryAddr.line1, buyerX, yPos + 17);
  if (deliveryAddr.line2) {
    doc.text(deliveryAddr.line2, buyerX, yPos + 22);
  }
  doc.text(
    `${deliveryAddr.city}, ${deliveryAddr.state} - ${deliveryAddr.pincode}`,
    buyerX,
    yPos + (deliveryAddr.line2 ? 27 : 22)
  );
  if (deliveryAddr.contactPerson) {
    doc.text(
      `Contact: ${deliveryAddr.contactPerson}`,
      buyerX,
      yPos + (deliveryAddr.line2 ? 32 : 27)
    );
  }
  if (deliveryAddr.contactPhone) {
    doc.text(
      `Phone: ${deliveryAddr.contactPhone}`,
      buyerX,
      yPos + (deliveryAddr.line2 ? 37 : 32)
    );
  }

  yPos += 50;

  // Transport Details Section
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 2, 2, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Transport Details", margin + 5, yPos + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  // Column 1
  doc.text(`Mode: ${getTransportModeDisplay(challan.transportMode)}`, margin + 5, yPos + 14);
  if (challan.vehicleNumber) {
    doc.text(`Vehicle No: ${challan.vehicleNumber}`, margin + 5, yPos + 20);
  }
  if (challan.driverName) {
    doc.text(`Driver: ${challan.driverName}`, margin + 5, yPos + 26);
  }
  if (challan.driverPhone) {
    doc.text(`Driver Phone: ${challan.driverPhone}`, margin + 5, yPos + 32);
  }

  // Column 2
  const col2X = margin + 70;
  if (challan.transporterName) {
    doc.text(`Transporter: ${challan.transporterName}`, col2X, yPos + 14);
  }
  if (challan.lrNumber) {
    doc.text(`LR Number: ${challan.lrNumber}`, col2X, yPos + 20);
  }

  // Column 3 - E-Way Bill
  const col3X = margin + 135;
  if (challan.ewayBillNumber) {
    doc.setFont("helvetica", "bold");
    doc.text("E-Way Bill", col3X, yPos + 14);
    doc.setFont("helvetica", "normal");
    doc.text(`No: ${challan.ewayBillNumber}`, col3X, yPos + 20);
    if (challan.ewayBillDate) {
      doc.text(`Date: ${formatDatePDF(challan.ewayBillDate)}`, col3X, yPos + 26);
    }
    if (challan.ewayBillValidUntil) {
      doc.text(`Valid Till: ${formatDatePDF(challan.ewayBillValidUntil)}`, col3X, yPos + 32);
    }
  }

  yPos += 45;

  // Items Table
  const tableColumns = ["#", "Product Description", "HSN Code", "Quantity", "Unit"];

  const tableRows = challan.items.map((item, index) => {
    return [
      (index + 1).toString(),
      item.productName,
      item.hsnCode,
      item.quantityDispatched.toString(),
      item.unit,
    ];
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
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { halign: "center", cellWidth: 30 },
      3: { halign: "center", cellWidth: 30 },
      4: { halign: "center", cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
  });

  // Get Y position after table
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  // Total Items Summary
  const totalItems = challan.items.length;
  const totalQuantity = challan.items.reduce((sum, item) => sum + item.quantityDispatched, 0);
  
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total Items: ${totalItems} | Total Quantity: ${totalQuantity}`,
    margin + 5,
    yPos + 8
  );

  yPos += 20;

  // Declaration
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a delivery challan and not an invoice. Goods are being dispatched as per the order mentioned above.",
    margin,
    yPos
  );

  yPos += 15;

  // Signature Areas
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin + 20;
  }

  // Draw signature boxes
  const signatureY = pageHeight - 45;
  const boxWidth = 60;

  // Dispatched By
  doc.setDrawColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.line(margin, signatureY, margin + boxWidth, signatureY);
  doc.text("Dispatched By", margin + boxWidth / 2, signatureY + 5, {
    align: "center",
  });
  doc.text("(Signature & Stamp)", margin + boxWidth / 2, signatureY + 10, {
    align: "center",
  });

  // Received By
  doc.line(pageWidth - margin - boxWidth, signatureY, pageWidth - margin, signatureY);
  doc.text("Received By", pageWidth - margin - boxWidth / 2, signatureY + 5, {
    align: "center",
  });
  doc.text("(Signature & Date)", pageWidth - margin - boxWidth / 2, signatureY + 10, {
    align: "center",
  });

  // Goods received declaration
  doc.setFontSize(7);
  doc.text(
    "I/We hereby acknowledge receipt of the above goods in good condition.",
    pageWidth / 2,
    signatureY + 18,
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
 * Download delivery challan as PDF
 */
export function downloadChallanPDF(
  challan: DeliveryChallan,
  order: Order,
  options?: ChallanPDFOptions
): void {
  const doc = generateChallanPDF(challan, order, options);
  const filename = `${challan.challanNumber.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}

/**
 * Get delivery challan PDF as Blob (for preview or upload)
 */
export function getChallanPDFBlob(
  challan: DeliveryChallan,
  order: Order,
  options?: ChallanPDFOptions
): Blob {
  const doc = generateChallanPDF(challan, order, options);
  return doc.output("blob");
}

/**
 * Open delivery challan PDF in new tab for preview/print
 */
export function printChallanPDF(
  challan: DeliveryChallan,
  order: Order,
  options?: ChallanPDFOptions
): void {
  const doc = generateChallanPDF(challan, order, options);
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
 * Preview delivery challan PDF in new tab
 */
export function previewChallanPDF(
  challan: DeliveryChallan,
  order: Order,
  options?: ChallanPDFOptions
): void {
  const doc = generateChallanPDF(challan, order, options);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
