"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Truck,
  XCircle,
  CheckCircle,
  User,
  Package,
  MapPin,
  CreditCard,
  IndianRupee,
  AlertTriangle,
  History,
  Wallet,
  Play,
  Pause,
  Download,
  Printer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrder, useOrderEvents, useUpdateOrderStatus, usePayments, useInvoices } from "@/lib/api";
import type { OrderStatus, OrderItem, OrderEvent, Order, Payment } from "@/types";

type TimelineItem = { id: string; label: `activity.${string}`; dotClass: string; createdAt: string };

function getEventConfig(
  eventName: string
): { label: `activity.${string}`; dotClass: string } {
  switch (eventName) {
    case "order.created":
      return { label: "activity.orderCreated", dotClass: "bg-success" };
    case "order.confirmed":
      return { label: "activity.orderConfirmed", dotClass: "bg-warning-500" };
    case "order.delivered":
      return { label: "activity.orderDelivered", dotClass: "bg-success-500" };
    case "order.cancelled":
      return { label: "activity.orderCancelled", dotClass: "bg-error" };
    default:
      return { label: "activity.orderCreated", dotClass: "bg-primary-500" };
  }
}

function buildTimelineItems(order: Order, orderEvents: OrderEvent[]): TimelineItem[] {
  if (orderEvents.length > 0) {
    return orderEvents.map((event) => {
      const config = getEventConfig(event.name);
      return {
        id: event.id,
        label: config.label,
        dotClass: config.dotClass,
        createdAt: event.createdAt,
      };
    });
  }
  const items: TimelineItem[] = [];
  items.push({
    id: "synthetic-order.created",
    label: "activity.orderCreated",
    dotClass: "bg-success",
    createdAt: order.createdAt,
  });
  if (order.status === "CONFIRMED" || order.status === "DELIVERED") {
    items.push({
      id: "synthetic-order.confirmed",
      label: "activity.orderConfirmed",
      dotClass: "bg-warning-500",
      createdAt: order.confirmedAt ?? order.updatedAt ?? order.createdAt,
    });
  }
  if (order.status === "DELIVERED") {
    items.push({
      id: "synthetic-order.delivered",
      label: "activity.orderDelivered",
      dotClass: "bg-success-500",
      createdAt: order.deliveredAt ?? order.updatedAt ?? order.createdAt,
    });
  }
  if (order.status === "CANCELLED") {
    items.push({
      id: "synthetic-order.cancelled",
      label: "activity.orderCancelled",
      dotClass: "bg-error",
      createdAt: order.updatedAt ?? order.createdAt,
    });
  }
  return items;
}

// Status badge variants
const statusVariants: Record<OrderStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  CONFIRMED: "warning",
  PROCESSING: "warning",
  PARTIALLY_DELIVERED: "warning",
  DELIVERED: "success",
  CLOSED: "success",
  CANCELLED: "error",
  ON_HOLD: "default",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canEdit = usePermission("ORDER_EDIT");
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  // Fetch order from backend
  const { data: order, isLoading, error } = useOrder(id);
  const { data: orderEvents = [] } = useOrderEvents(id);
  const updateOrderStatusMutation = useUpdateOrderStatus(id);
  const { data: orderPayments = [] } = usePayments({ orderId: id });
  const { data: orderInvoices = [] } = useInvoices({ orderId: id });

  // State hooks
  const [activeTab, setActiveTab] = React.useState("items");

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateOrderStatusMutation.mutateAsync(newStatus);
      // Query will automatically refetch after mutation
    } catch (error) {
      // Error is handled by mutation (toast notification)
      console.error("Failed to update order status:", error);
    }
  };

  // Get primary action based on order status
  const getPrimaryAction = React.useCallback(() => {
    if (!canEdit || !order) return null;

    // DRAFT -> "Confirm Order"
    if (order.status === "DRAFT") {
      return {
        label: t("confirm"),
        icon: CheckCircle,
        action: () => handleStatusUpdate("CONFIRMED"),
        href: null,
      };
    }

    // CONFIRMED -> "Mark as Delivered"
    if (order.status === "CONFIRMED") {
      return {
        label: t("markDelivered"),
        icon: Truck,
        action: () => handleStatusUpdate("DELIVERED"),
        href: null,
      };
    }

    return null;
  }, [canEdit, order, t, id, handleStatusUpdate]);

  // Early returns after all hooks
  if (isLoading) {
    return <PageLoader message={t("loadingOrder")} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-error mb-4" />
        <p className="text-text-muted mb-4">
          {error instanceof Error ? error.message : t("orderNotFound")}
        </p>
        <Button variant="secondary" onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">{t("orderNotFound")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const primaryAction = getPrimaryAction();

  const amountPaid = (orderPayments ?? []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const grandTotal = Number(order?.totalAmount) ?? 0;
  const amountDue = Math.max(0, grandTotal - amountPaid);

  return (
    <div className="space-y-6">
      {/* Mobile: Inline back button | Desktop: Side back button */}
      <div className="flex items-start gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 -ml-2 md:ml-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
        {/* Header with Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: Order Identity */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-text-primary">
                  {order.orderNumber}
                </h1>
                <Badge variant={statusVariants[order.status]}>
                  {t(`status.${order.status.toLowerCase()}`)}
                </Badge>
              </div>
              <p className="text-sm text-text-muted mt-1">
                {order.partyName || order.party?.name || "Unknown Customer"} • {formatCurrency(order.totalAmount)} • {order.items?.length || 0} {t("itemsCount")}
              </p>
            </div>

            {/* Right: Actions in same row */}
            {canEdit && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {primaryAction && (
                  primaryAction.href ? (
                    <Button asChild>
                      <Link href={primaryAction.href}>
                        <primaryAction.icon className="h-4 w-4 mr-2" />
                        {primaryAction.label}
                      </Link>
                    </Button>
                  ) : (
                    <Button onClick={primaryAction.action!}>
                      <primaryAction.icon className="h-4 w-4 mr-2" />
                      {primaryAction.label}
                    </Button>
                  )
                )}
{order.status !== "CANCELLED" && order.status !== "CLOSED" && order.status !== "DELIVERED" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary">
                        {t("moreActions")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(order.status === "CONFIRMED" || order.status === "DELIVERED") && orderInvoices.length === 0 && (
                        <DropdownMenuItem asChild>
                          <Link href={`/orders/${id}/invoice/new`}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t("createInvoice")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {order.status !== "DELIVERED" && (
                        <DropdownMenuItem
                          className="text-error"
                          onClick={() => handleStatusUpdate("CANCELLED")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("cancelOrder")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Three Domain Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mt-6">
        {/* Items Card */}
        <Card 
          className="cursor-pointer hover:border-primary-500 transition-colors"
          onClick={() => setActiveTab("items")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-text-muted" />
              <span className="text-sm font-medium">{t("tabs.items")}</span>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{order.items?.length || 0} {t("itemsCount")}</p>
              <p className="text-sm text-text-muted">{formatCurrency(order.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Total Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-text-muted" />
              <span className="text-sm font-medium">{t("totalAmount")}</span>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
              <p className="text-sm text-text-muted">{t("orderTotal")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Stacks on mobile */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* ZONE 4: Tab Content */}
        <div className="lg:col-span-2 order-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Scrollable tabs on mobile */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="w-full justify-start min-w-max">
                <TabsTrigger value="items" className="flex items-center gap-2 px-3 py-2">
                  <Package className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("tabs.items")} ({order.items?.length || 0})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Items Tab - Clean version without delivery status column */}
            <TabsContent value="items">
              <Card>
                <CardContent className="pt-6">
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
                          <tr
                            key={item.id}
                            className="border-b border-border-subtle last:border-0"
                          >
                            <td className="py-3 px-3">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-text-muted">
                                  Inventory ID: {item.inventoryId.slice(0, 8)}...
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {item.quantity}
                            </td>
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
                              {t("discount")} ({order.discountPercent}%)
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
            </TabsContent>

          </Tabs>
        </div>

        {/* ZONE 5: Simplified Sidebar - Below on mobile, side on desktop */}
        <div className="space-y-6 order-2">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("customer")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.partyName || order.party?.name || "Unknown Customer"}</p>
                {order.party?.phone && (
                  <p className="text-sm text-text-muted">{order.party.phone}</p>
                )}
                {order.party?.email && (
                  <p className="text-sm text-text-muted">{order.party.email}</p>
                )}
              </div>
              {order.party?.gstNumber && (
                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-xs text-text-muted">GSTIN</p>
                  <p className="text-sm font-mono">{order.party.gstNumber}</p>
                </div>
              )}
              {order.party?.type && (
                <Badge variant="default">
                  {order.party.type}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Payments for this order */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {t("payment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Payment Summary */}
              <div className="grid grid-cols-3 gap-2 pb-3 border-b border-border-subtle">
                <div>
                  <p className="text-xs text-text-muted">{t("totalAmount")}</p>
                  <p className="font-semibold">{formatCurrency(grandTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t("paid")}</p>
                  <p className="font-semibold text-success">{formatCurrency(amountPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t("stats.paymentDue")}</p>
                  <p className={`font-semibold ${amountDue > 0 ? "text-error" : "text-success"}`}>
                    {formatCurrency(amountDue)}
                  </p>
                </div>
              </div>
              {orderPayments.length === 0 ? (
                <p className="text-sm text-text-muted">{t("noPayments")}</p>
              ) : (
                <ul className="space-y-2">
                  {orderPayments.map((p: Payment) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between text-sm border-b border-border-subtle pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-text-muted">{formatDate(p.createdAt)}</span>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      <span className="text-text-muted capitalize">
                        {p.method === "OTHER" ? "Other" : p.method.replace("_", " ").toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {order.status !== "CANCELLED" && order.status !== "CLOSED" && canEdit && (
                <Button variant="primary" size="sm" className="w-full" asChild>
                  <Link href={`/orders/${id}/payments/new`}>
                    <IndianRupee className="h-4 w-4 mr-2" />
                    {t("recordPayment")}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("shippingAddress")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                {order.shippingAddress.contactPerson && (
                  <div className="pt-2 mt-2 border-t border-border-subtle">
                    <p className="font-medium">{order.shippingAddress.contactPerson}</p>
                    <p className="text-text-muted">{order.shippingAddress.contactPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline - backend events or hybrid synthetic from order */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("tabs.activity")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {buildTimelineItems(order, orderEvents).map((item) => (
                <div
                  key={item.id}
                  className="relative pl-6 pb-2 border-l-2 border-border-subtle last:border-0"
                >
                  <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full ${item.dotClass}`} />
                  <p className="text-sm font-medium">{t(item.label)}</p>
                  <p className="text-xs text-text-muted">{formatDate(item.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
