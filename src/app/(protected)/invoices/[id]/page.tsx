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
import { useInvoice, useParty, useStore as useStoreApi, usePayments } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { INDIAN_STATES, getInvoiceDisplayStatus } from "@/types";

const statusConfig: Record<
  string,
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
  const { currentStore: currentStoreFromContext } = useStore();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const id = params.id as string;
  const canRecordPayment = usePermission("PAYMENT_RECORD");

  // Fetch invoice from backend
  const { data: invoice, isLoading, error } = useInvoice(id);

  // Fetch payments for this invoice
  const { data: payments = [] } = usePayments(id ? { invoiceId: id } : undefined);
  
  // Fetch store details for seller information
  const { data: store } = useStoreApi(invoice?.storeId || "");
  
  // Fetch party details for buyer information
  const { data: party } = useParty(invoice?.partyId || "");

  // Use store from context if API store not available
  const storeForSeller = store || currentStoreFromContext;

  const handlePrint = () => {
    window.print();
  };

  const getStateName = (code: string) => {
    return INDIAN_STATES.find((s) => s.code === code)?.name || code;
  };

  if (isLoading) {
    return <PageLoader message="Loading invoice..." />;
  }

  if (error || (!isLoading && !invoice)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">{t("invoiceNotFound")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {tCommon("goBack")}
        </Button>
      </div>
    );
  }

  if (!invoice) {
    return <PageLoader message="Loading invoice..." />;
  }

  // Compute display status
  const displayStatus = getInvoiceDisplayStatus(invoice);
  const StatusIcon = statusConfig[displayStatus]?.icon || Clock;

  // Compute seller details from store
  const sellerDetails = storeForSeller ? {
    legalName: storeForSeller.legalName || storeForSeller.name,
    tradeName: storeForSeller.tradeName,
    gstin: storeForSeller.gstin,
    pan: storeForSeller.pan,
    address: {
      line1: storeForSeller.addressLine1 || storeForSeller.address || "",
      line2: storeForSeller.addressLine2,
      city: storeForSeller.city,
      state: storeForSeller.state,
      stateCode: storeForSeller.stateCode,
      pincode: storeForSeller.pincode,
    },
    contact: { phone: storeForSeller.phone, email: storeForSeller.email },
    bankDetails: {
      accountName: storeForSeller.bankAccountName,
      accountNumber: storeForSeller.bankAccountNumber,
      ifscCode: storeForSeller.bankIfscCode,
      bankName: storeForSeller.bankName,
      branch: storeForSeller.bankBranch,
      upiId: storeForSeller.bankUpiId,
    },
  } : null;

  // Compute buyer details from party
  const buyerDetails = party ? {
    name: party.name,
    gstin: party.gstNumber,
    customerType: party.gstNumber ? "B2B_REGISTERED" : (party.type === "CUSTOMER" ? "B2B_UNREGISTERED" : "B2C"),
    billingAddress: party.address ? {
      line1: party.address.split(",")[0] || party.address,
      city: "",
      state: "",
      pincode: "",
    } : { line1: "", city: "", state: "", pincode: "" },
    placeOfSupply: "", // Would need to extract from address or add to Party model
  } : null;

  // Compute supply type: Compare seller state code with buyer state code
  const isInterState = sellerDetails?.address.stateCode && buyerDetails?.placeOfSupply
    ? sellerDetails.address.stateCode !== buyerDetails.placeOfSupply
    : false;

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
            <Badge variant={statusConfig[displayStatus]?.variant || "default"}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {displayStatus}
            </Badge>
            {isInterState && <Badge variant="default">Inter-State</Badge>}
          </div>
          <p className="text-sm text-text-muted">
            {t("invoiceDate")}: {formatDate(invoice.createdAt)}
            {invoice.dueDate && ` • ${t("due")}: ${formatDate(invoice.dueDate)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t("print")}
          </Button>
          {invoice.dueAmount > 0 && canRecordPayment && displayStatus !== "CANCELLED" && displayStatus !== "PAID" && (
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
            {sellerDetails ? (
              <>
                <p className="font-semibold text-lg">{sellerDetails.legalName}</p>
                {sellerDetails.tradeName && (
                  <p className="text-sm text-text-muted">({sellerDetails.tradeName})</p>
                )}
                <div className="text-sm space-y-1">
                  {sellerDetails.gstin && (
                    <p>
                      <span className="text-text-muted">GSTIN:</span>{" "}
                      <span className="font-medium">{sellerDetails.gstin}</span>
                    </p>
                  )}
                  {sellerDetails.address.line1 && (
                    <p className="text-text-muted">
                      {sellerDetails.address.line1}
                      {sellerDetails.address.line2 && `, ${sellerDetails.address.line2}`}
                    </p>
                  )}
                  {(sellerDetails.address.city || sellerDetails.address.state || sellerDetails.address.pincode) && (
                    <p className="text-text-muted">
                      {[sellerDetails.address.city, sellerDetails.address.state, sellerDetails.address.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {sellerDetails.address.stateCode && (
                    <p className="text-text-muted">
                      State Code: {sellerDetails.address.stateCode}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-text-muted">Store details not available</p>
            )}
          </CardContent>
        </Card>

        {/* Buyer Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("to")} {buyerDetails && `(${buyerDetails.customerType.replace("_", " ")})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {buyerDetails ? (
              <>
                <p className="font-semibold text-lg">{buyerDetails.name}</p>
                <div className="text-sm space-y-1">
                  {buyerDetails.gstin && (
                    <p>
                      <span className="text-text-muted">GSTIN:</span>{" "}
                      <span className="font-medium">{buyerDetails.gstin}</span>
                    </p>
                  )}
                  {!buyerDetails.gstin && buyerDetails.customerType !== "B2C" && (
                    <p className="text-text-muted italic">Unregistered (No GSTIN)</p>
                  )}
                  {buyerDetails.billingAddress.line1 && (
                    <p className="text-text-muted">
                      {buyerDetails.billingAddress.line1}
                    </p>
                  )}
                  {(buyerDetails.billingAddress.city || buyerDetails.billingAddress.state || buyerDetails.billingAddress.pincode) && (
                    <p className="text-text-muted">
                      {[buyerDetails.billingAddress.city, buyerDetails.billingAddress.state, buyerDetails.billingAddress.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {buyerDetails.placeOfSupply && (
                    <p>
                      <span className="text-text-muted">Place of Supply:</span>{" "}
                      <span className="font-medium">
                        {getStateName(buyerDetails.placeOfSupply)} ({buyerDetails.placeOfSupply})
                      </span>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-text-muted">Party details not available</p>
            )}
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
                {invoice.items?.map((item, index) => {
                  // Calculate taxable value (totalPrice before GST)
                  const taxableValue = invoice.isGst && (invoice.cgstRate + invoice.sgstRate + invoice.igstRate) > 0
                    ? item.totalPrice / (1 + (invoice.cgstRate + invoice.sgstRate + invoice.igstRate) / 100)
                    : item.totalPrice;
                  const cgstAmount = invoice.isGst ? (taxableValue * invoice.cgstRate) / 100 : 0;
                  const sgstAmount = invoice.isGst ? (taxableValue * invoice.sgstRate) / 100 : 0;
                  const igstAmount = invoice.isGst ? (taxableValue * invoice.igstRate) / 100 : 0;
                  
                  return (
                    <tr key={item.id} className="border-b border-border-subtle">
                      <td className="py-3 px-2 text-sm text-text-muted">{index + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-text-muted">{item.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-sm">{item.hsnCode || "—"}</td>
                      <td className="py-3 px-2 text-right text-sm">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        {formatCurrency(taxableValue)}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        {isInterState
                          ? formatCurrency(igstAmount)
                          : formatCurrency(cgstAmount)}
                      </td>
                      {!isInterState && (
                        <td className="py-3 px-2 text-right text-sm">
                          {formatCurrency(sgstAmount)}
                        </td>
                      )}
                      <td className="py-3 px-2 text-right text-sm font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
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
                    {invoice.isGst && (invoice.cgstRate > 0 || invoice.sgstRate > 0 || invoice.igstRate > 0) && (
                      <tr className="border-b border-border-subtle">
                        <td className="py-2">{invoice.cgstRate + invoice.sgstRate + invoice.igstRate}%</td>
                        <td className="text-right py-2">{formatCurrency(invoice.subtotal - invoice.discountAmount)}</td>
                        {!isInterState && (
                          <>
                            <td className="text-right py-2">{formatCurrency(invoice.cgstAmount)}</td>
                            <td className="text-right py-2">{formatCurrency(invoice.sgstAmount)}</td>
                          </>
                        )}
                        {isInterState && (
                          <td className="text-right py-2">{formatCurrency(invoice.igstAmount)}</td>
                        )}
                        <td className="text-right py-2 font-medium">
                          {formatCurrency(invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="md:w-72 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-text-muted">{t("subtotal")}</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">{t("discount")}</span>
                  <span className="text-success">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}
              {!isInterState && invoice.cgstAmount > 0 && (
                <>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">CGST</span>
                    <span>{formatCurrency(invoice.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">SGST</span>
                    <span>{formatCurrency(invoice.sgstAmount)}</span>
                  </div>
                </>
              )}
              {isInterState && invoice.igstAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">IGST</span>
                  <span>{formatCurrency(invoice.igstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-border-strong font-semibold text-lg">
                <span>{t("grandTotal")}</span>
                <span className="text-primary-600">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mt-4 p-3 bg-bg-app rounded-lg">
            <p className="text-sm">
              <span className="text-text-muted">{t("amountInWords")}:</span>{" "}
              <span className="font-medium">
                {(() => {
                  // Simple amount in words conversion (can be enhanced later)
                  const amount = invoice.totalAmount;
                  const rupees = Math.floor(amount);
                  const paise = Math.round((amount - rupees) * 100);
                  return `Rupees ${rupees.toLocaleString("en-IN")}${paise > 0 ? ` and ${paise} Paise` : ""} Only`;
                })()}
              </span>
            </p>
          </div>

          {/* Bank Details */}
          {sellerDetails?.bankDetails && sellerDetails.bankDetails.accountName && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-medium text-text-muted mb-2">{t("bankDetails")}</h4>
              <div className="grid gap-1 text-sm">
                <p>
                  <span className="text-text-muted">Account Name:</span>{" "}
                  {sellerDetails.bankDetails.accountName}
                </p>
                <p>
                  <span className="text-text-muted">Account No:</span>{" "}
                  {sellerDetails.bankDetails.accountNumber}
                </p>
                <p>
                  <span className="text-text-muted">IFSC:</span>{" "}
                  {sellerDetails.bankDetails.ifscCode}
                </p>
                {sellerDetails.bankDetails.bankName && (
                  <p>
                    <span className="text-text-muted">Bank:</span>{" "}
                    {sellerDetails.bankDetails.bankName}
                    {sellerDetails.bankDetails.branch && `, ${sellerDetails.bankDetails.branch}`}
                  </p>
                )}
                {sellerDetails.bankDetails.upiId && (
                  <p>
                    <span className="text-text-muted">UPI:</span>{" "}
                    {sellerDetails.bankDetails.upiId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Terms & Notes */}
          {invoice.notes && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-medium text-text-muted mb-2">
                {t("termsAndConditions")}
              </h4>
              <p className="text-sm whitespace-pre-line">
                {invoice.notes}
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
                Authorized Signatory
              </p>
              <p className="text-xs text-text-muted">{sellerDetails?.tradeName || sellerDetails?.legalName || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary - always visible */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t("paymentSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-text-muted">{t("grandTotal")}</p>
              <p className="font-semibold">{formatCurrency(invoice?.totalAmount ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">{t("totalPaid")}</p>
              <p className="font-semibold text-success">
                {formatCurrency(invoice?.paidAmount ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">{t("balanceDue")}</p>
              <p
                className={`font-semibold ${
                  (invoice?.dueAmount ?? 0) > 0 ? "text-error" : "text-success"
                }`}
              >
                {formatCurrency(invoice?.dueAmount ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History - when payments exist */}
      {payments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("paymentHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-app"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount ?? 0)}</p>
                    <p className="text-sm text-text-muted">
                      {(() => {
                      const d = (payment as { createdAt?: string; date?: string }).createdAt ?? (payment as { date?: string }).date;
                      return d ? formatDate(d) : "—";
                    })()} • {(payment.method ?? "CASH").replace("_", " ")}
                    </p>
                    {(payment.reference ?? "") && (
                      <p className="text-xs text-text-muted">Ref: {payment.reference}</p>
                    )}
                  </div>
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Received
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Note Reference */}
      {false && ( // Credit note feature not yet in backend
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning-500" />
              <div>
                <p className="font-medium">Credit Note</p>
                <p className="text-sm text-text-muted">
                  This is a credit note for the original invoice.
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild className="ml-auto">
                <Link href={`/invoices`}>
                  View Invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* E-Way Bill Info - Not yet in backend */}
    </div>
  );
}
