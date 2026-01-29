"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExpenseStore } from "@/lib/stores/expense-store";
import { useParties } from "@/lib/api";
import type { ExpenseCategory, ExpenseStatus, PaymentMethod, RecurringFrequency } from "@/types";

export default function NewExpensePage() {
  const router = useRouter();
  const canEdit = usePermission("EXPENSE_EDIT");
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const { addExpense } = useExpenseStore();
  const { data: parties = [] } = useParties({ type: "SUPPLIER" });

  // Form state
  const [category, setCategory] = React.useState<ExpenseCategory>("OTHER");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = React.useState("");
  const [gstRate, setGstRate] = React.useState("");
  const [vendorId, setVendorId] = React.useState("");
  const [vendorName, setVendorName] = React.useState("");
  const [billNumber, setBillNumber] = React.useState("");
  const [billDate, setBillDate] = React.useState("");
  const [status, setStatus] = React.useState<ExpenseStatus>("PENDING");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");
  const [paymentReference, setPaymentReference] = React.useState("");
  const [paidDate, setPaidDate] = React.useState("");
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurringFrequency, setRecurringFrequency] = React.useState<RecurringFrequency>("MONTHLY");
  const [recurringEndDate, setRecurringEndDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Calculate GST and total
  const amountNum = parseFloat(amount) || 0;
  const gstRateNum = parseFloat(gstRate) || 0;
  const gstAmount = amountNum * (gstRateNum / 100);
  const totalAmount = amountNum + gstAmount;

  // Category options
  const categoryOptions: { value: ExpenseCategory; label: string }[] = [
    { value: "MATERIAL_PURCHASE", label: t("category.materialpurchase") },
    { value: "FREIGHT", label: t("category.freight") },
    { value: "LABOR", label: t("category.labor") },
    { value: "RENT", label: t("category.rent") },
    { value: "UTILITIES", label: t("category.utilities") },
    { value: "EQUIPMENT", label: t("category.equipment") },
    { value: "OTHER", label: t("category.other") },
  ];

  // Payment method options
  const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "UPI", label: "UPI" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "OTHER", label: "Other" },
  ];

  // Recurring frequency options
  const frequencyOptions: { value: RecurringFrequency; label: string }[] = [
    { value: "DAILY", label: t("recurring.weekly")?.replace("Weekly", "Daily") || "Daily" },
    { value: "WEEKLY", label: t("recurring.weekly") },
    { value: "MONTHLY", label: t("recurring.monthly") },
    { value: "QUARTERLY", label: t("recurring.quarterly") },
    { value: "YEARLY", label: t("recurring.yearly") },
  ];

  // Handle vendor selection
  const handleVendorSelect = (value: string) => {
    if (value === "new") {
      setVendorId("");
      setVendorName("");
    } else {
      const party = parties.find((p) => p.id === value);
      if (party) {
        setVendorId(party.id);
        setVendorName(party.name);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount || amountNum <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newExpense = addExpense({
        category,
        description: description.trim(),
        date,
        amount: amountNum,
        gstAmount: gstAmount > 0 ? gstAmount : undefined,
        gstRate: gstRateNum > 0 ? gstRateNum : undefined,
        vendorId: vendorId || undefined,
        vendorName: vendorName || undefined,
        billNumber: billNumber.trim() || undefined,
        billDate: billDate || undefined,
        status,
        paymentMethod: status === "PAID" ? paymentMethod : undefined,
        paymentReference: paymentReference.trim() || undefined,
        paidDate: status === "PAID" ? (paidDate || date) : undefined,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
      });

      router.push(`/expenses/${newExpense.id}`);
    } catch (error) {
      console.error("Failed to create expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{tCommon("error")}</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/expenses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("newExpense")}</h1>
          <p className="text-sm text-text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("fields.basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t("fields.category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("fields.description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("fields.descriptionPlaceholder")}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{tCommon("date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">{t("fields.vendor")}</Label>
              <Select value={vendorId || "new"} onValueChange={handleVendorSelect}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder={t("fields.selectVendor")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("fields.newVendor")}</SelectItem>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(!vendorId || vendorId === "new") && (
              <div className="space-y-2">
                <Label htmlFor="vendorName">{t("fields.vendorName")}</Label>
                <Input
                  id="vendorName"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder={t("fields.vendorNamePlaceholder")}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billNumber">{t("fields.billNumber")}</Label>
                <Input
                  id="billNumber"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder={t("fields.billNumberPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billDate">{t("fields.billDate")}</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {t("fields.amountDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("fields.amount")}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstRate">{t("fields.gstRate")}</Label>
              <Input
                id="gstRate"
                type="number"
                step="0.01"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                placeholder="0"
              />
            </div>

            {amountNum > 0 && (
              <div className="rounded-lg bg-bg-app p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("fields.amount")}</span>
                  <span className="font-medium">{formatCurrency(amountNum)}</span>
                </div>
                {gstRateNum > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">GST ({gstRateNum}%)</span>
                      <span className="font-medium">{formatCurrency(gstAmount)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-medium">{t("fields.totalAmount")}</span>
                      <span className="font-semibold text-lg">{formatCurrency(totalAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("fields.paymentInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t("fields.paymentStatus")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ExpenseStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">{t("status.pending")}</SelectItem>
                  <SelectItem value="PAID">{t("status.paid")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "PAID" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">{t("fields.paymentMethod")}</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="paidDate">{t("fields.paidDate")}</Label>
                    <Input
                      id="paidDate"
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentReference">{t("fields.paymentReference")}</Label>
                    <Input
                      id="paymentReference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={t("fields.paymentReferencePlaceholder")}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recurring Expense */}
        <Card>
          <CardHeader>
            <CardTitle>{t("recurring.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">
                {t("recurring.isRecurring")}
              </Label>
            </div>

            {isRecurring && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurringFrequency">{t("recurring.frequency")}</Label>
                  <Select
                    value={recurringFrequency}
                    onValueChange={(v) => setRecurringFrequency(v as RecurringFrequency)}
                  >
                    <SelectTrigger id="recurringFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurringEndDate">{t("recurring.endDate")}</Label>
                  <Input
                    id="recurringEndDate"
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" isLoading={isSubmitting}>
            {tCommon("create")}
          </Button>
          <Button type="button" variant="secondary" asChild>
            <Link href="/expenses">{tCommon("cancel")}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
