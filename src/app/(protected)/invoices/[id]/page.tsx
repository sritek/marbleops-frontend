"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Wallet, User } from "lucide-react";
import { useInvoice } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import type { InvoiceStatus } from "@/types";

const statusVariants: Record<InvoiceStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  ISSUED: "warning",
  PAID: "success",
  CANCELLED: "error",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canRecordPayment = usePermission("PAYMENT_RECORD");

  const { data: invoice, isLoading, error } = useInvoice(id);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <PageLoader message="Loading invoice..." />;
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">Invoice not found</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 no-print">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-text-primary">
              {invoice.invoiceNumber}
            </h1>
            <Badge variant={statusVariants[invoice.status]}>{invoice.status}</Badge>
          </div>
          <p className="text-sm text-text-muted">
            Created on {formatDate(invoice.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {invoice.dueAmount > 0 && canRecordPayment && (
            <Button asChild>
              <Link href={`/payments/new?invoiceId=${invoice.id}&partyId=${invoice.partyId}`}>
                <Wallet className="h-4 w-4 mr-2" />
                Record Payment
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Content (Printable) */}
      <Card className="print-header">
        <CardContent className="p-8">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-primary-600">INVOICE</h2>
              <p className="text-lg font-medium mt-1">{invoice.invoiceNumber}</p>
              <p className="text-sm text-text-muted">
                Date: {formatDate(invoice.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">MarbleOps</p>
              <p className="text-sm text-text-muted">Your business address</p>
              <p className="text-sm text-text-muted">Phone: +91 XXXXXXXXXX</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8 p-4 bg-bg-muted rounded-lg">
            <p className="text-sm font-medium text-text-muted mb-1">Bill To:</p>
            <p className="font-semibold text-lg">{invoice.party?.name || "—"}</p>
            {invoice.party?.phone && (
              <p className="text-sm text-text-muted">{invoice.party.phone}</p>
            )}
            {invoice.party?.address && (
              <p className="text-sm text-text-muted">{invoice.party.address}</p>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-border-strong">
                <th className="text-left py-3 font-medium">Item</th>
                <th className="text-right py-3 font-medium">Qty</th>
                <th className="text-right py-3 font-medium">Unit Price</th>
                <th className="text-right py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id} className="border-b border-border-subtle">
                  <td className="py-3">
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-text-muted">{item.description}</p>
                    )}
                  </td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Discount</span>
                  <span className="text-success">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}
              {invoice.isGst && (
                <>
                  {invoice.cgstAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">
                        CGST ({invoice.cgstRate}%)
                      </span>
                      <span>{formatCurrency(invoice.cgstAmount)}</span>
                    </div>
                  )}
                  {invoice.sgstAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">
                        SGST ({invoice.sgstRate}%)
                      </span>
                      <span>{formatCurrency(invoice.sgstAmount)}</span>
                    </div>
                  )}
                  {invoice.igstAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">
                        IGST ({invoice.igstRate}%)
                      </span>
                      <span>{formatCurrency(invoice.igstAmount)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between py-2 border-t-2 border-border-strong font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Paid</span>
                <span className="text-success">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-border-subtle font-semibold">
                <span>Balance Due</span>
                <span className={invoice.dueAmount > 0 ? "text-error" : "text-success"}>
                  {formatCurrency(invoice.dueAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <p className="text-sm font-medium text-text-muted mb-1">Notes:</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-border-subtle text-center text-sm text-text-muted">
            <p>Thank you for your business!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
