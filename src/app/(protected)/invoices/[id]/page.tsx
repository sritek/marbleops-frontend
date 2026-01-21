"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Wallet,
  Building2,
  User,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { useStore } from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { getMockInvoice } from "@/lib/mock/invoices";
import { INDIAN_STATES, type InvoiceStatus } from "@/types";

const statusConfig: Record<
  InvoiceStatus,
  { variant: "default" | "warning" | "success" | "error"; icon: React.ElementType }
> = {
  DRAFT: { variant: "default", icon: Clock },
  ISSUED: { variant: "warning", icon: AlertCircle },
  PARTIAL: { variant: "warning", icon: CreditCard },
  PAID: { variant: "success", icon: CheckCircle },
  OVERDUE: { variant: "error", icon: AlertCircle },
  CANCELLED: { variant: "error", icon: XCircle },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentStore } = useStore();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const id = params.id as string;
  const canRecordPayment = usePermission("PAYMENT_RECORD");

  // Use mock data for now
  const invoice = getMockInvoice(id);
  const isLoading = false;

  const handlePrint = () => {
    window.print();
  };

  const getStateName = (code: string) => {
    return INDIAN_STATES.find((s) => s.code === code)?.name || code;
  };

  if (isLoading) {
    return <PageLoader message="Loading invoice..." />;
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">{t("invoiceNotFound")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {tCommon("goBack")}
        </Button>
      </div>
    );
  }

  const StatusIcon = statusConfig[invoice.status].icon;
  const isInterState = invoice.supplyType === "INTER_STATE";

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center no-print">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-text-primary">
              {invoice.invoiceNumber}
            </h1>
            <Badge variant={statusConfig[invoice.status].variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {invoice.status}
            </Badge>
            {invoice.invoiceType === "CREDIT_NOTE" && (
              <Badge variant="warning">Credit Note</Badge>
            )}
            {isInterState && <Badge variant="default">Inter-State</Badge>}
          </div>
          <p className="text-sm text-text-muted">
            {t("invoiceDate")}: {formatDate(invoice.invoiceDate)}
            {invoice.dueDate && ` • ${t("due")}: ${formatDate(invoice.dueDate)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t("print")}
          </Button>
          {invoice.dueAmount > 0 && canRecordPayment && invoice.status !== "CANCELLED" && (
            <Button asChild>
              <Link href={`/payments/new?invoiceId=${invoice.id}&partyId=${invoice.partyId}`}>
                <Wallet className="h-4 w-4 mr-2" />
                {t("recordPayment")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Seller & Buyer Info */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Seller Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t("from")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold text-lg">{invoice.seller.legalName}</p>
            {invoice.seller.tradeName && (
              <p className="text-sm text-text-muted">({invoice.seller.tradeName})</p>
            )}
            <div className="text-sm space-y-1">
              <p>
                <span className="text-text-muted">GSTIN:</span>{" "}
                <span className="font-medium">{invoice.seller.gstin}</span>
              </p>
              <p className="text-text-muted">
                {invoice.seller.address.line1}
                {invoice.seller.address.line2 && `, ${invoice.seller.address.line2}`}
              </p>
              <p className="text-text-muted">
                {invoice.seller.address.city}, {invoice.seller.address.state} -{" "}
                {invoice.seller.address.pincode}
              </p>
              <p className="text-text-muted">
                State Code: {invoice.seller.address.stateCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("to")} ({invoice.buyer.customerType.replace("_", " ")})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold text-lg">{invoice.buyer.name}</p>
            <div className="text-sm space-y-1">
              {invoice.buyer.gstin && (
                <p>
                  <span className="text-text-muted">GSTIN:</span>{" "}
                  <span className="font-medium">{invoice.buyer.gstin}</span>
                </p>
              )}
              {!invoice.buyer.gstin && invoice.buyer.customerType !== "B2C" && (
                <p className="text-text-muted italic">Unregistered (No GSTIN)</p>
              )}
              <p className="text-text-muted">
                {invoice.buyer.billingAddress.line1}
              </p>
              <p className="text-text-muted">
                {invoice.buyer.billingAddress.city},{" "}
                {invoice.buyer.billingAddress.state} -{" "}
                {invoice.buyer.billingAddress.pincode}
              </p>
              <p>
                <span className="text-text-muted">Place of Supply:</span>{" "}
                <span className="font-medium">
                  {getStateName(invoice.buyer.placeOfSupply)} ({invoice.buyer.placeOfSupply})
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Content (Printable) */}
      <Card className="print-content">
        <CardContent className="p-6">
          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b-2 border-border-strong">
                  <th className="text-left py-3 px-2 font-medium text-sm">#</th>
                  <th className="text-left py-3 px-2 font-medium text-sm">{t("item")}</th>
                  <th className="text-left py-3 px-2 font-medium text-sm">HSN</th>
                  <th className="text-right py-3 px-2 font-medium text-sm">{t("qty")}</th>
                  <th className="text-right py-3 px-2 font-medium text-sm">{t("rate")}</th>
                  <th className="text-right py-3 px-2 font-medium text-sm">{t("taxable")}</th>
                  <th className="text-right py-3 px-2 font-medium text-sm">
                    {isInterState ? "IGST" : "CGST"}
                  </th>
                  {!isInterState && (
                    <th className="text-right py-3 px-2 font-medium text-sm">SGST</th>
                  )}
                  <th className="text-right py-3 px-2 font-medium text-sm">{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-border-subtle">
                    <td className="py-3 px-2 text-sm text-text-muted">{index + 1}</td>
                    <td className="py-3 px-2">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-text-muted">{item.description}</p>
                      )}
                      {item.dimensions && (
                        <p className="text-xs text-text-muted">
                          {item.dimensions.length} × {item.dimensions.width} ft
                          {item.areaSqFt && ` = ${item.areaSqFt} sq ft`}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm">{item.hsnCode}</td>
                    <td className="py-3 px-2 text-right text-sm">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      {formatCurrency(item.taxableValue)}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      {isInterState
                        ? formatCurrency(item.igstAmount || 0)
                        : formatCurrency(item.cgstAmount || 0)}
                    </td>
                    {!isInterState && (
                      <td className="py-3 px-2 text-right text-sm">
                        {formatCurrency(item.sgstAmount || 0)}
                      </td>
                    )}
                    <td className="py-3 px-2 text-right text-sm font-medium">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Totals */}
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            {/* Tax Summary */}
            <div className="md:w-1/2">
              <h4 className="text-sm font-medium text-text-muted mb-2">{t("taxSummary")}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-2">{t("gstRate")}</th>
                      <th className="text-right py-2">{t("taxable")}</th>
                      {!isInterState && (
                        <>
                          <th className="text-right py-2">CGST</th>
                          <th className="text-right py-2">SGST</th>
                        </>
                      )}
                      {isInterState && <th className="text-right py-2">IGST</th>}
                      <th className="text-right py-2">{t("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.taxSummary.map((tax, index) => (
                      <tr key={index} className="border-b border-border-subtle">
                        <td className="py-2">{tax.gstRate}%</td>
                        <td className="text-right py-2">{formatCurrency(tax.taxableValue)}</td>
                        {!isInterState && (
                          <>
                            <td className="text-right py-2">{formatCurrency(tax.cgstAmount)}</td>
                            <td className="text-right py-2">{formatCurrency(tax.sgstAmount)}</td>
                          </>
                        )}
                        {isInterState && (
                          <td className="text-right py-2">{formatCurrency(tax.igstAmount)}</td>
                        )}
                        <td className="text-right py-2 font-medium">
                          {formatCurrency(tax.totalTax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="md:w-72 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-text-muted">{t("subtotal")}</span>
                <span>{formatCurrency(invoice.totals.subtotal)}</span>
              </div>
              {invoice.totals.totalDiscount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">{t("discount")}</span>
                  <span className="text-success">
                    -{formatCurrency(invoice.totals.totalDiscount)}
                  </span>
                </div>
              )}
              {!isInterState && invoice.totals.totalCgst > 0 && (
                <>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">CGST</span>
                    <span>{formatCurrency(invoice.totals.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">SGST</span>
                    <span>{formatCurrency(invoice.totals.totalSgst)}</span>
                  </div>
                </>
              )}
              {isInterState && invoice.totals.totalIgst > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">IGST</span>
                  <span>{formatCurrency(invoice.totals.totalIgst)}</span>
                </div>
              )}
              {invoice.totals.roundOff !== 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-text-muted">{t("roundOff")}</span>
                  <span>
                    {invoice.totals.roundOff >= 0 ? "+" : ""}
                    {formatCurrency(Math.abs(invoice.totals.roundOff))}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-border-strong font-semibold text-lg">
                <span>{t("grandTotal")}</span>
                <span className="text-primary-600">
                  {formatCurrency(invoice.totals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mt-4 p-3 bg-bg-app rounded-lg">
            <p className="text-sm">
              <span className="text-text-muted">{t("amountInWords")}:</span>{" "}
              <span className="font-medium">{invoice.totals.amountInWords}</span>
            </p>
          </div>

          {/* Bank Details */}
          {invoice.seller.bankDetails && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-medium text-text-muted mb-2">{t("bankDetails")}</h4>
              <div className="grid gap-1 text-sm">
                <p>
                  <span className="text-text-muted">Account Name:</span>{" "}
                  {invoice.seller.bankDetails.accountName}
                </p>
                <p>
                  <span className="text-text-muted">Account No:</span>{" "}
                  {invoice.seller.bankDetails.accountNumber}
                </p>
                <p>
                  <span className="text-text-muted">IFSC:</span>{" "}
                  {invoice.seller.bankDetails.ifscCode}
                </p>
                <p>
                  <span className="text-text-muted">Bank:</span>{" "}
                  {invoice.seller.bankDetails.bankName}
                  {invoice.seller.bankDetails.branch && `, ${invoice.seller.bankDetails.branch}`}
                </p>
                {invoice.seller.bankDetails.upiId && (
                  <p>
                    <span className="text-text-muted">UPI:</span>{" "}
                    {invoice.seller.bankDetails.upiId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Terms & Notes */}
          {invoice.compliance?.termsAndConditions && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-medium text-text-muted mb-2">
                {t("termsAndConditions")}
              </h4>
              <p className="text-sm whitespace-pre-line">
                {invoice.compliance.termsAndConditions}
              </p>
            </div>
          )}

          {invoice.notes && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-text-muted mb-1">{t("notes")}:</h4>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Signature */}
          <div className="mt-8 flex justify-end">
            <div className="text-center">
              <div className="h-16 w-40 border-b border-border-subtle mb-2" />
              <p className="text-sm font-medium">
                {invoice.compliance?.authorizedSignatory || "Authorized Signatory"}
              </p>
              <p className="text-xs text-text-muted">{invoice.seller.tradeName || invoice.seller.legalName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("paymentHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-app"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-text-muted">
                      {formatDate(payment.date)} • {payment.method.replace("_", " ")}
                    </p>
                    {payment.reference && (
                      <p className="text-xs text-text-muted">Ref: {payment.reference}</p>
                    )}
                  </div>
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Received
                  </Badge>
                </div>
              ))}

              {/* Balance Summary */}
              <div className="pt-3 border-t border-border-subtle flex justify-between">
                <div>
                  <p className="text-sm text-text-muted">{t("totalPaid")}</p>
                  <p className="font-semibold text-success">
                    {formatCurrency(invoice.paidAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">{t("balanceDue")}</p>
                  <p
                    className={`font-semibold ${
                      invoice.dueAmount > 0 ? "text-error" : "text-success"
                    }`}
                  >
                    {formatCurrency(invoice.dueAmount)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Note Reference */}
      {invoice.invoiceType === "CREDIT_NOTE" && invoice.links?.originalInvoiceId && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning-500" />
              <div>
                <p className="font-medium">Credit Note</p>
                <p className="text-sm text-text-muted">
                  {invoice.compliance?.declaration}
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild className="ml-auto">
                <Link href={`/invoices/${invoice.links.originalInvoiceId}`}>
                  View Original
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* E-Way Bill Info */}
      {invoice.compliance?.eWayBillNo && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-text-muted" />
              <span className="text-text-muted">E-Way Bill:</span>
              <span className="font-medium">{invoice.compliance.eWayBillNo}</span>
              <span className="text-text-muted">
                (Generated: {formatDate(invoice.compliance.eWayBillDate || "")})
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
