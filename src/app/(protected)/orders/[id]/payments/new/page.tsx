"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, IndianRupee, CreditCard, Building2, Smartphone, Banknote, CheckCircle, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrder, usePayments, useRecordPayment } from "@/lib/api";
import { downloadReceiptPDF, printReceiptPDF } from "@/lib/receipt-pdf";
import type { Order, PaymentMode, OrderPayment, Payment, PaymentMethod } from "@/types";

const paymentModeIcons: Record<PaymentMode, React.ElementType> = {
  CASH: Banknote,
  UPI: Smartphone,
  BANK_TRANSFER: Building2,
  CHEQUE: CreditCard,
  CARD: CreditCard,
  CREDIT: IndianRupee,
};

function toBackendMethod(mode: PaymentMode): PaymentMethod {
  if (mode === "CARD" || mode === "CREDIT") return "OTHER";
  return mode;
}

function toOrderPaymentDisplay(payment: Payment, order: Order): OrderPayment {
  const dateStr = typeof payment.createdAt === "string" ? payment.createdAt : new Date(payment.createdAt).toISOString();
  return {
    id: payment.id,
    receiptNumber: payment.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentDate: dateStr.slice(0, 10),
    amount: payment.amount,
    paymentMode: (payment.method === "OTHER" ? "CARD" : payment.method) as PaymentMode,
    referenceNumber: payment.reference ?? undefined,
    notes: payment.notes ?? undefined,
    createdAt: dateStr,
  };
}

function orderForReceipt(
  order: Order,
  amountPaid: number
): Order & {
  customerSnapshot: { name: string; gstin?: string; phone?: string; email?: string };
  grandTotal: number;
  amountPaid: number;
} {
  const party = order.party;
  return {
    ...order,
    grandTotal: order.totalAmount,
    amountPaid,
    customerSnapshot: {
      name: order.partyName ?? party?.name ?? "Customer",
      gstin: party?.gstNumber ?? "",
      phone: party?.phone ?? "",
      email: party?.email ?? "",
    },
  };
}

export default function NewPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const canEdit = usePermission("PAYMENT_RECORD");
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId);
  const { data: orderPayments = [] } = usePayments({ orderId });
  const recordPayment = useRecordPayment();

  const [recordedPayment, setRecordedPayment] = React.useState<OrderPayment | null>(null);

  const amountPaid = order ? orderPayments.reduce((s, p) => s + p.amount, 0) : 0;
  const amountDue = order ? Math.max(0, order.totalAmount - amountPaid) : 0;
  const grandTotal = order ? order.totalAmount : 0;

  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = React.useState<number>(0);
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>("BANK_TRANSFER");
  const [referenceNumber, setReferenceNumber] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [chequeNumber, setChequeNumber] = React.useState("");
  const [chequeDate, setChequeDate] = React.useState("");
  const [allocationType, setAllocationType] = React.useState<"ADVANCE" | "AGAINST_ORDER" | "AGAINST_INVOICE">("AGAINST_ORDER");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (order && amountDue > 0) setAmount(amountDue);
  }, [order?.id, amountDue]);

  const getPaymentProgress = () => {
    if (!order || grandTotal === 0) return 100;
    return Math.round((amountPaid / grandTotal) * 100);
  };

  const handleSubmit = async () => {
    if (!order || amount <= 0) return;
    try {
      const payment = await recordPayment.mutateAsync({
        partyId: order.partyId,
        orderId,
        amount,
        type: "IN",
        method: toBackendMethod(paymentMode),
        reference: referenceNumber || undefined,
        notes: notes || undefined,
      });
      setRecordedPayment(toOrderPaymentDisplay(payment, order));
    } catch (error) {
      console.error("Failed to record payment:", error);
    }
  };

  const handleRecordAnother = () => {
    setRecordedPayment(null);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("BANK_TRANSFER");
    setReferenceNumber("");
    setBankName("");
    setChequeNumber("");
    setChequeDate("");
    setAllocationType("AGAINST_ORDER");
    setNotes("");
    if (order) setAmount(amountDue);
  };

  const quickAmounts = order
    ? [
        { label: "Full Due", value: amountDue },
        { label: "50%", value: Math.round(amountDue / 2) },
        { label: "25%", value: Math.round(amountDue / 4) },
      ].filter((a) => a.value > 0)
    : [];

  if (isLoadingOrder) {
    return <PageLoader message="Loading order..." />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">Order not found</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">You don't have permission to record payments</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (order.amountDue <= 0 && !recordedPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IndianRupee className="h-12 w-12 text-success mb-4" />
        <p className="text-lg font-medium text-text-primary mb-2">Order Fully Paid</p>
        <p className="text-text-muted mb-4">There is no outstanding amount for this order.</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const PaymentIcon = paymentModeIcons[paymentMode];
  const RecordedPaymentIcon = recordedPayment ? paymentModeIcons[recordedPayment.paymentMode as PaymentMode] : null;

  return (
    <>
    <div className={`space-y-6 pb-24 lg:pb-6 transition-all duration-300 ${recordedPayment ? "blur-sm pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 sm:ml-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
            {t("paymentRecord.title")}
          </h1>
          <p className="text-sm text-text-muted truncate">
            {order.orderNumber} • {order.partyName ?? "Customer"}
          </p>
        </div>
      </div>

      {/* Payment Progress Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("detail.paymentProgress")}</span>
            <span className="text-sm font-semibold">{getPaymentProgress()}%</span>
          </div>
          <Progress
            value={getPaymentProgress()}
            className={`h-2 ${
              getPaymentProgress() === 100
                ? "[&>div]:bg-success"
                : getPaymentProgress() > 0
                ? "[&>div]:bg-warning-500"
                : "[&>div]:bg-error-400"
            }`}
          />
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-text-muted">
              Paid: <span className="text-success font-medium">{formatCurrency(amountPaid)}</span>
            </span>
            <span className="text-text-muted">
              Due: <span className="text-error font-medium">{formatCurrency(amountDue)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                {t("paymentRecord.amount")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("paymentRecord.amount")}</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="pl-9 text-lg font-semibold"
                    max={amountDue}
                  />
                </div>
                {amount > amountDue && (
                  <p className="text-xs text-warning-600">
                    Amount exceeds due amount. This will be recorded as overpayment.
                  </p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              {quickAmounts.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((qa) => (
                    <Button
                      key={qa.label}
                      variant={amount === qa.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(qa.value)}
                    >
                      {qa.label} ({formatCurrency(qa.value)})
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("paymentRecord.paymentMode")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(Object.keys(paymentModeIcons) as PaymentMode[]).map((mode) => {
                  const Icon = paymentModeIcons[mode];
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        paymentMode === mode
                          ? "border-primary-500 bg-primary-50"
                          : "border-border-subtle hover:border-border-strong"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${paymentMode === mode ? "text-primary-600" : "text-text-muted"}`} />
                      <span className={`text-xs ${paymentMode === mode ? "text-primary-600 font-medium" : "text-text-muted"}`}>
                        {t(`paymentRecord.modes.${mode.toLowerCase().replace("_", "")}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mode-specific fields */}
              {paymentMode === "BANK_TRANSFER" && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border-subtle">
                  <div className="space-y-2">
                    <Label>{t("paymentRecord.referenceNumber")} (UTR)</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter UTR number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("paymentRecord.bankName")}</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Bank name"
                    />
                  </div>
                </div>
              )}

              {paymentMode === "UPI" && (
                <div className="pt-4 border-t border-border-subtle">
                  <div className="space-y-2">
                    <Label>{t("paymentRecord.referenceNumber")} (UPI Ref)</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter UPI reference number"
                    />
                  </div>
                </div>
              )}

              {paymentMode === "CHEQUE" && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border-subtle">
                  <div className="space-y-2">
                    <Label>{t("paymentRecord.chequeNumber")}</Label>
                    <Input
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      placeholder="Cheque number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("paymentRecord.chequeDate")}</Label>
                    <Input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("paymentRecord.bankName")}</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Bank name"
                    />
                  </div>
                </div>
              )}

              {paymentMode === "CARD" && (
                <div className="pt-4 border-t border-border-subtle">
                  <div className="space-y-2">
                    <Label>{t("paymentRecord.referenceNumber")} (Auth Code)</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Card authorization code"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Date & Allocation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("paymentRecord.paymentDate")}</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("paymentRecord.allocationType")}</Label>
                  <Select
                    value={allocationType}
                    onValueChange={(v) => setAllocationType(v as typeof allocationType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADVANCE">
                        {t("paymentRecord.allocation.advance")}
                      </SelectItem>
                      <SelectItem value="AGAINST_ORDER">
                        {t("paymentRecord.allocation.againstOrder")}
                      </SelectItem>
                      <SelectItem value="AGAINST_INVOICE">
                        {t("paymentRecord.allocation.againstInvoice")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment notes..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary (Desktop) */}
        <div className="lg:col-span-1 hidden lg:block">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Order Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Already Paid</span>
                  <span className="text-success">{formatCurrency(amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Outstanding</span>
                  <span className="text-error">{formatCurrency(amountDue)}</span>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-4">
                <div className="flex justify-between">
                  <span className="text-text-muted">This Payment</span>
                  <span className="text-lg font-semibold">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-text-muted">Balance After</span>
                  <span className={amountDue - amount <= 0 ? "text-success" : "text-error"}>
                    {formatCurrency(Math.max(0, amountDue - amount))}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-bg-app rounded-lg">
                <PaymentIcon className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium">
                  {t(`paymentRecord.modes.${paymentMode.toLowerCase().replace("_", "")}`)}
                </span>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  disabled={amount <= 0}
                  onClick={handleSubmit}
                >
                  <IndianRupee className="h-4 w-4 mr-2" />
                  {t("paymentRecord.recordPayment")}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border-subtle p-4 lg:hidden z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted">Recording</p>
            <p className="text-lg font-semibold text-primary-600 truncate">
              {formatCurrency(amount)}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => router.back()}>
              {tCommon("cancel")}
            </Button>
            <Button
              size="sm"
              disabled={amount <= 0}
              onClick={handleSubmit}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Record
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Success Overlay Dialog */}
    <Dialog open={!!recordedPayment} onOpenChange={() => router.push(`/orders/${orderId}`)}>
      <DialogContent className="sm:max-w-md">
        {recordedPayment && order && (
          <>
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <DialogTitle className="text-2xl font-semibold text-text-primary">
                {t("paymentRecord.paymentRecorded")}
              </DialogTitle>
              <p className="text-text-muted text-sm">
                {recordedPayment.receiptNumber}
              </p>
            </DialogHeader>

            {/* Payment Summary */}
            <div className="p-4 bg-surface-secondary rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("paymentRecord.amount")}</span>
                <span className="font-semibold text-success">{formatCurrency(recordedPayment.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("paymentRecord.paymentDate")}</span>
                <span className="font-medium">{formatDate(recordedPayment.paymentDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("paymentRecord.paymentMode")}</span>
                <span className="font-medium flex items-center gap-2">
                  {RecordedPaymentIcon && <RecordedPaymentIcon className="h-4 w-4" />}
                  {t(`paymentRecord.modes.${recordedPayment.paymentMode.toLowerCase().replace("_", "")}`)}
                </span>
              </div>
              {recordedPayment.referenceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("paymentRecord.referenceNumber")}</span>
                  <span className="font-medium">{recordedPayment.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("order")}</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
            </div>

            {/* Print Action */}
            <Button
              className="w-full"
              onClick={() => {
                if (!order) return;
                const enrichedOrder = orderForReceipt(order, amountPaid + recordedPayment.amount);
                printReceiptPDF(recordedPayment, enrichedOrder);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
