"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/components/ui/spinner";
import { useOrder, useCreateInvoiceFromOrder } from "@/lib/api";
import type { Order, OrderItem } from "@/types";

export default function OrderInvoiceNewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const canEdit = usePermission("INVOICE_EDIT");
  const t = useTranslations("orders");
  const tInvoices = useTranslations("invoices");

  const { data: order, isLoading, error } = useOrder(orderId);
  const createFromOrder = useCreateInvoiceFromOrder();

  const [dueDate, setDueDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (dueDate) return;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split("T")[0]);
  }, [dueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    try {
      const invoice = await createFromOrder.mutateAsync({
        orderId,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
      router.push(`/invoices/${invoice.id}`);
    } catch {
      // Error toast handled in hook
    }
  };

  if (isLoading) {
    return <PageLoader message={t("loadingOrder")} />;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">{t("orderNotFound")}</p>
        <Button variant="secondary" asChild>
          <Link href={`/orders/${orderId}`}>Back to Order</Link>
        </Button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{tInvoices("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${orderId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("createInvoice")} – {order.orderNumber}
          </h1>
          <p className="text-sm text-text-muted">
            {tInvoices("createInvoiceDesc")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("customer")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{order.partyName ?? order.party?.name ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("orderSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-3 text-sm font-medium text-text-muted">
                    {t("item")}
                  </th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-text-muted">
                    {t("qty")}
                  </th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-text-muted">
                    {t("rate")}
                  </th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-text-muted">
                    {t("total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: OrderItem) => (
                  <tr key={item.id} className="border-b border-border-subtle last:border-0">
                    <td className="py-3 px-3">
                      <p className="font-medium">{item.name}</p>
                    </td>
                    <td className="py-3 px-3 text-right">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-bg-app">
                  <td colSpan={3} className="py-3 px-3 text-right font-medium">
                    {t("subtotal")}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    {formatCurrency(order.subtotal)}
                  </td>
                </tr>
                {order.discountAmount > 0 && (
                  <tr className="bg-bg-app">
                    <td colSpan={3} className="py-2 px-3 text-right text-success">
                      {t("discount")}
                      {typeof order.discountPercent === "number"
                        ? ` (${order.discountPercent}%)`
                        : ""}
                    </td>
                    <td className="py-2 px-3 text-right text-success">
                      -{formatCurrency(order.discountAmount)}
                    </td>
                  </tr>
                )}
                <tr className="bg-bg-app">
                  <td colSpan={3} className="py-2 px-3 text-right text-text-muted">
                    {order.igstAmount > 0 ? "IGST" : "CGST + SGST"}
                  </td>
                  <td className="py-2 px-3 text-right text-text-muted">
                    {formatCurrency(order.totalTax)}
                  </td>
                </tr>
                <tr className="bg-bg-app border-t border-border-subtle">
                  <td colSpan={3} className="py-3 px-3 text-right font-semibold">
                    {t("total")}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-lg">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tInvoices("invoiceDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dueDate">{tInvoices("dueDate")}</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tInvoices("notes")}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/orders/${orderId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={createFromOrder.isPending}>
            {createFromOrder.isPending ? "Creating..." : tInvoices("issueInvoice")}
          </Button>
        </div>
      </form>
    </div>
  );
}
