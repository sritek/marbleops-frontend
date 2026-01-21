"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, IndianRupee, CreditCard, Building2, Smartphone, Banknote } from "lucide-react";
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
import { getMockOrderById } from "@/lib/mock/orders";
import type { Order, PaymentMode } from "@/types";

const paymentModeIcons: Record<PaymentMode, React.ElementType> = {
  CASH: Banknote,
  UPI: Smartphone,
  BANK_TRANSFER: Building2,
  CHEQUE: CreditCard,
  CARD: CreditCard,
  CREDIT: IndianRupee,
};

export default function NewPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const canEdit = usePermission("PAYMENT_RECORD");
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  const [isLoading, setIsLoading] = React.useState(true);
  const [order, setOrder] = React.useState<Order | null>(null);

  // Form state
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

  // Load order data
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const fetchedOrder = getMockOrderById(orderId);
      setOrder(fetchedOrder || null);
      if (fetchedOrder) {
        setAmount(fetchedOrder.amountDue);
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderId]);

  // Calculate payment progress
  const getPaymentProgress = () => {
    if (!order || order.grandTotal === 0) return 100;
    return Math.round((order.amountPaid / order.grandTotal) * 100);
  };

  // Submit payment
  const handleSubmit = async () => {
    if (amount <= 0) return;

    console.log("Recording payment:", {
      orderId,
      paymentDate,
      amount,
      paymentMode,
      referenceNumber,
      bankName,
      chequeNumber,
      chequeDate,
      allocationType,
      notes,
    });

    router.push(`/orders/${orderId}`);
  };

  // Quick amount buttons
  const quickAmounts = order
    ? [
        { label: "Full Due", value: order.amountDue },
        { label: "50%", value: Math.round(order.amountDue / 2) },
        { label: "25%", value: Math.round(order.amountDue / 4) },
      ].filter((a) => a.value > 0)
    : [];

  if (isLoading) {
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

  if (order.amountDue <= 0) {
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("paymentRecord.title")}
          </h1>
          <p className="text-sm text-text-muted">
            {order.orderNumber} • {order.customerSnapshot.name}
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
              Paid: <span className="text-success font-medium">{formatCurrency(order.amountPaid)}</span>
            </span>
            <span className="text-text-muted">
              Due: <span className="text-error font-medium">{formatCurrency(order.amountDue)}</span>
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
                    max={order.amountDue}
                  />
                </div>
                {amount > order.amountDue && (
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

        {/* Sidebar - Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Order Total</span>
                  <span>{formatCurrency(order.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Already Paid</span>
                  <span className="text-success">{formatCurrency(order.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Outstanding</span>
                  <span className="text-error">{formatCurrency(order.amountDue)}</span>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-4">
                <div className="flex justify-between">
                  <span className="text-text-muted">This Payment</span>
                  <span className="text-lg font-semibold">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-text-muted">Balance After</span>
                  <span className={order.amountDue - amount <= 0 ? "text-success" : "text-error"}>
                    {formatCurrency(Math.max(0, order.amountDue - amount))}
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
                  Record Payment
                </Button>
                <Button
                  variant="outline"
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
    </div>
  );
}
