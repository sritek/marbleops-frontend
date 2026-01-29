"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Receipt,
  IndianRupee,
  Building2,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Copy,
  Edit,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExpenseStore } from "@/lib/stores";
import type { Expense, ExpenseStatus, PaymentMethod } from "@/types";

// Status badge variants
const statusVariants: Record<ExpenseStatus, "default" | "success" | "error"> = {
  PENDING: "default",
  PAID: "success",
  CANCELLED: "error",
};

// Category labels
const categoryLabels: Record<string, string> = {
  MATERIAL_PURCHASE: "Material Purchase",
  FREIGHT: "Freight/Transport",
  LABOR: "Labor",
  RENT: "Rent",
  UTILITIES: "Utilities",
  EQUIPMENT: "Equipment",
  VEHICLE: "Vehicle",
  PACKAGING: "Packaging",
  MARKETING: "Marketing",
  OFFICE: "Office Supplies",
  PROFESSIONAL: "Professional Fees",
  TAXES: "Taxes & Licenses",
  INSURANCE: "Insurance",
  OTHER: "Other",
};

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canEdit = usePermission("EXPENSE_EDIT");
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  // Get store functions
  const { getExpenseById, updateExpense, markAsPaid, cancelExpense, addExpense } = useExpenseStore();

  // State
  const [isLoading, setIsLoading] = React.useState(true);
  const [expense, setExpense] = React.useState<Expense | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");
  const [paymentReference, setPaymentReference] = React.useState("");

  // Load expense
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const fetchedExpense = getExpenseById(id);
      setExpense(fetchedExpense || null);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id, getExpenseById]);

  // Handle mark as paid
  const handleMarkAsPaid = () => {
    if (!expense) return;
    markAsPaid(expense.id, paymentMethod, paymentReference || undefined);
    setShowMarkPaidDialog(false);
    setPaymentReference("");
    // Refresh expense
    const updated = getExpenseById(id);
    setExpense(updated || null);
    router.refresh();
  };

  // Handle cancel
  const handleCancel = () => {
    if (!expense || !confirm("Are you sure you want to cancel this expense?")) return;
    cancelExpense(expense.id);
    const updated = getExpenseById(id);
    setExpense(updated || null);
    router.refresh();
  };

  // Handle duplicate
  const handleDuplicate = () => {
    if (!expense) return;
    const duplicated = addExpense({
      category: expense.category,
      description: `${expense.description} (Copy)`,
      date: new Date().toISOString().split("T")[0],
      amount: expense.amount,
      gstAmount: expense.gstAmount,
      gstRate: expense.gstRate,
      vendorId: expense.vendorId,
      vendorName: expense.vendorName,
      billNumber: undefined,
      billDate: undefined,
      isRecurring: false,
      status: "PENDING",
    });
    router.push(`/expenses/${duplicated.id}`);
  };

  if (isLoading) {
    return <PageLoader message={tCommon("loading")} />;
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">{t("expenseNotFound") || "Expense not found"}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-start gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 -ml-2 md:ml-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-text-primary">
                  {expense.expenseNumber}
                </h1>
                <Badge variant={statusVariants[expense.status]}>
                  {t(`status.${expense.status.toLowerCase()}`)}
                </Badge>
                {expense.isRecurring && (
                  <Badge variant="default">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {t("recurring.isRecurring")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-muted mt-1">
                {expense.description} • {formatCurrency(expense.totalAmount)}
              </p>
            </div>

            {canEdit && expense.status !== "CANCELLED" && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {expense.status === "PENDING" && (
                  <Button onClick={() => setShowMarkPaidDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("actions.markPaid")}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary">
                      {tCommon("actions")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {expense.status === "PENDING" && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {tCommon("edit")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="h-4 w-4 mr-2" />
                      {t("actions.duplicate")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {expense.status === "PENDING" && (
                      <DropdownMenuItem
                        className="text-error"
                        onClick={handleCancel}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t("actions.cancel")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                {t("fields.basicInfo") || "Basic Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-text-muted mb-1">{t("fields.category") || "Category"}</p>
                  <p className="font-medium">
                    {t(`category.${expense.category.toLowerCase().replace("_", "")}`) || categoryLabels[expense.category]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">{tCommon("date")}</p>
                  <p className="font-medium">{formatDate(expense.date)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">{t("fields.description") || "Description"}</p>
                <p className="font-medium">{expense.description}</p>
              </div>
              {expense.isRecurring && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t("recurring.frequency")}</p>
                    <p className="font-medium">{t(`recurring.${expense.recurringFrequency?.toLowerCase()}`) || expense.recurringFrequency}</p>
                  </div>
                  {expense.recurringEndDate && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">{t("recurring.endDate")}</p>
                      <p className="font-medium">{formatDate(expense.recurringEndDate)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                {t("fields.amountDetails") || "Amount Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">{t("fields.amount") || "Amount (excl. GST)"}</span>
                <span className="font-medium">{formatCurrency(expense.amount)}</span>
              </div>
              {expense.gstAmount && expense.gstAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t("fields.gstRate") || "GST Rate"}</span>
                    <span className="font-medium">{expense.gstRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t("fields.gstAmount") || "GST Amount"}</span>
                    <span className="font-medium">{formatCurrency(expense.gstAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t border-border-subtle">
                <span className="font-semibold">{t("fields.totalAmount") || "Total Amount"}</span>
                <span className="font-semibold text-lg">{formatCurrency(expense.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Vendor & Bill Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("fields.vendor") || "Vendor/Supplier"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1">{t("fields.vendorName") || "Vendor Name"}</p>
                <p className="font-medium">{expense.vendorName || expense.vendor?.name || "—"}</p>
              </div>
              {expense.billNumber && (
                <div>
                  <p className="text-xs text-text-muted mb-1">{t("fields.billNumber") || "Bill Number"}</p>
                  <p className="font-medium">{expense.billNumber}</p>
                </div>
              )}
              {expense.billDate && (
                <div>
                  <p className="text-xs text-text-muted mb-1">{t("fields.billDate") || "Bill Date"}</p>
                  <p className="font-medium">{formatDate(expense.billDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          {expense.status === "PAID" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {t("fields.paymentInfo") || "Payment Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expense.paidDate && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t("fields.paidDate") || "Paid Date"}</p>
                    <p className="font-medium">{formatDate(expense.paidDate)}</p>
                  </div>
                )}
                {expense.paymentMethod && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t("fields.paymentMethod") || "Payment Method"}</p>
                    <p className="font-medium">{expense.paymentMethod.replace("_", " ")}</p>
                  </div>
                )}
                {expense.paymentReference && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t("fields.paymentReference") || "Reference"}</p>
                    <p className="font-medium">{expense.paymentReference}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("summary") || "Summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{tCommon("status")}</span>
                <Badge variant={statusVariants[expense.status]}>
                  {t(`status.${expense.status.toLowerCase()}`)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("fields.totalAmount") || "Total"}</span>
                <span className="font-semibold">{formatCurrency(expense.totalAmount)}</span>
              </div>
              {expense.gstAmount && expense.gstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("stats.gstClaimable") || "GST Input Credit"}</span>
                  <span className="font-medium text-success">{formatCurrency(expense.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-border-subtle">
                <span className="text-text-muted">{t("fields.createdAt") || "Created"}</span>
                <span className="text-text-muted">{formatDate(expense.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark as Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.markPaid") || "Mark as Paid"}</DialogTitle>
            <DialogDescription>
              {t("markPaidDescription") || "Record payment details for this expense"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{t("fields.paymentMethod") || "Payment Method"} *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReference">{t("fields.paymentReference") || "Reference Number"}</Label>
              <Input
                id="paymentReference"
                placeholder={t("fields.paymentReferencePlaceholder") || "UTR, Transaction ID, etc."}
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowMarkPaidDialog(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleMarkAsPaid}>
              {t("actions.markPaid") || "Mark as Paid"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
