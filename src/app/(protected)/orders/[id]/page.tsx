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
  Calendar,
  Package,
  MapPin,
  CreditCard,
  Clock,
  IndianRupee,
  AlertTriangle,
  Building2,
  History,
  Wallet,
  Play,
  Pause,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMockOrderById,
  getMockDeliveryChallansByOrder,
  getMockPaymentsByOrder,
} from "@/lib/mock/orders";
import type { OrderStatus, OrderLineItem, DeliveryChallan, OrderPayment } from "@/types";

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

  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("items");

  // Get order data
  const order = React.useMemo(() => getMockOrderById(id), [id]);
  const deliveries = React.useMemo(() => getMockDeliveryChallansByOrder(id), [id]);
  const payments = React.useMemo(() => getMockPaymentsByOrder(id), [id]);

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    console.log(`Updating order ${id} to status: ${newStatus}`);
    // In real app, this would call an API
    router.refresh();
  };

  // Calculate progress percentages
  const deliveryProgress = React.useMemo(() => {
    if (!order || order.totalQuantityOrdered === 0) return 0;
    return Math.round((order.totalQuantityDelivered / order.totalQuantityOrdered) * 100);
  }, [order]);

  const paymentProgress = React.useMemo(() => {
    if (!order || order.grandTotal === 0) return 100;
    return Math.round((order.amountPaid / order.grandTotal) * 100);
  }, [order]);

  // Check if order is overdue
  const isOverdue = React.useMemo(() => {
    if (!order?.expectedDeliveryDate) return false;
    return (
      new Date(order.expectedDeliveryDate) < new Date() &&
      order.deliveryStatus !== "COMPLETE" &&
      order.status !== "CANCELLED" &&
      order.status !== "CLOSED"
    );
  }, [order]);

  if (isLoading) {
    return <PageLoader message={t("loadingOrder")} />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">{t("orderNotFound")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {tCommon("goBack")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-text-primary">
                {order.orderNumber}
              </h1>
              <Badge variant={statusVariants[order.status]}>
                {t(`status.${order.status.toLowerCase()}`)}
              </Badge>
              {order.priority === "URGENT" && (
                <Badge variant="error">{t("priority.urgent")}</Badge>
              )}
              {isOverdue && (
                <Badge variant="error">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t("overdue")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-muted mt-1">
              {order.customerSnapshot.name} • {t("createdOn")} {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {order.status === "DRAFT" && (
              <Button onClick={() => handleStatusUpdate("CONFIRMED")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("confirm")}
              </Button>
            )}
            {order.status === "CONFIRMED" && (
              <>
                <Button variant="secondary" asChild>
                  <Link href={`/orders/${id}/deliveries/new`}>
                    <Truck className="h-4 w-4 mr-2" />
                    {t("createDelivery")}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/invoices/new?orderId=${id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t("createInvoice")}
                  </Link>
                </Button>
              </>
            )}
            {(order.status === "CONFIRMED" || order.status === "PARTIALLY_DELIVERED") && (
              <Button variant="secondary" asChild>
                <Link href={`/orders/${id}/payments/new`}>
                  <IndianRupee className="h-4 w-4 mr-2" />
                  {t("recordPayment")}
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">{t("moreActions")}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {order.status === "ON_HOLD" && (
                  <DropdownMenuItem onClick={() => handleStatusUpdate("CONFIRMED")}>
                    <Play className="h-4 w-4 mr-2" />
                    {t("resumeOrder")}
                  </DropdownMenuItem>
                )}
                {(order.status === "CONFIRMED" || order.status === "PROCESSING") && (
                  <DropdownMenuItem onClick={() => handleStatusUpdate("ON_HOLD")}>
                    <Pause className="h-4 w-4 mr-2" />
                    {t("holdOrder")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {order.status !== "CANCELLED" && order.status !== "CLOSED" && (
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
          </div>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium">{t("delivery")}</span>
              </div>
              <Badge 
                variant={deliveryProgress === 100 ? "success" : deliveryProgress > 0 ? "warning" : "error"}
              >
                {t(deliveryProgress === 100 ? "deliveryBadge.shipped" : deliveryProgress > 0 ? "deliveryBadge.partial" : "deliveryBadge.pending")}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium">{t("payment")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={paymentProgress === 100 ? "success" : paymentProgress > 0 ? "warning" : "error"}
                >
                  {t(paymentProgress === 100 ? "paymentBadge.paid" : paymentProgress > 0 ? "paymentBadge.partial" : "paymentBadge.unpaid")}
                </Badge>
                {order.amountDue > 0 && (
                  <span className="text-xs text-text-muted">{formatCurrency(order.amountDue)} {t("due")}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="items" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("tabs.items")} ({order.items?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="deliveries" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {t("tabs.deliveries")} ({deliveries.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t("tabs.payments")} ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("tabs.activity")}
              </TabsTrigger>
            </TabsList>

            {/* Items Tab */}
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
                            {t("ordered")}
                          </th>
                          <th className="text-right py-3 px-3 text-sm font-medium text-text-muted">
                            {t("delivered")}
                          </th>
                          <th className="text-right py-3 px-3 text-sm font-medium text-text-muted">
                            {t("rate")}
                          </th>
                          <th className="text-right py-3 px-3 text-sm font-medium text-text-muted">
                            {t("total")}
                          </th>
                          <th className="text-center py-3 px-3 text-sm font-medium text-text-muted">
                            {tCommon("status")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item: OrderLineItem) => (
                          <tr
                            key={item.id}
                            className="border-b border-border-subtle last:border-0"
                          >
                            <td className="py-3 px-3">
                              <div>
                                <p className="font-medium">{item.productSnapshot.name}</p>
                                <p className="text-xs text-text-muted">
                                  HSN: {item.productSnapshot.hsnCode}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {item.quantityOrdered} {item.unit}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {item.quantityDelivered} {item.unit}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="py-3 px-3 text-right font-medium">
                              {formatCurrency(item.lineTotal)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge
                                variant={
                                  item.deliveryStatus === "COMPLETE"
                                    ? "success"
                                    : item.deliveryStatus === "PARTIAL"
                                    ? "warning"
                                    : item.deliveryStatus === "CANCELLED"
                                    ? "error"
                                    : "default"
                                }
                              >
                                {t(`deliveryStatus.${item.deliveryStatus.toLowerCase()}`)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-bg-app">
                          <td colSpan={4} className="py-3 px-3 text-right font-medium">
                            {t("subtotal")}
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            {formatCurrency(order.subtotal)}
                          </td>
                          <td />
                        </tr>
                        {order.discountAmount > 0 && (
                          <tr className="bg-bg-app">
                            <td colSpan={4} className="py-2 px-3 text-right text-success">
                              {t("discount")} ({order.discountPercent}%)
                            </td>
                            <td className="py-2 px-3 text-right text-success">
                              -{formatCurrency(order.discountAmount)}
                            </td>
                            <td />
                          </tr>
                        )}
                        <tr className="bg-bg-app">
                          <td colSpan={4} className="py-2 px-3 text-right text-text-muted">
                            {order.igstAmount > 0 ? "IGST" : "CGST + SGST"}
                          </td>
                          <td className="py-2 px-3 text-right text-text-muted">
                            {formatCurrency(order.totalTax)}
                          </td>
                          <td />
                        </tr>
                        <tr className="bg-bg-app border-t border-border-subtle">
                          <td colSpan={4} className="py-3 px-3 text-right font-semibold">
                            {t("grandTotal")}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-lg">
                            {formatCurrency(order.grandTotal)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deliveries Tab */}
            <TabsContent value="deliveries">
              <Card>
                <CardContent className="pt-6">
                  {deliveries.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                      <Truck className="h-10 w-10 mx-auto mb-3 text-text-muted" />
                      <p className="font-medium">{t("noDeliveries")}</p>
                      <p className="text-sm">{t("noDeliveriesDesc")}</p>
                      {canEdit && order.status === "CONFIRMED" && (
                        <Button className="mt-4" asChild>
                          <Link href={`/orders/${id}/deliveries/new`}>
                            <Truck className="h-4 w-4 mr-2" />
                            {t("createDelivery")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deliveries.map((challan: DeliveryChallan) => (
                        <div
                          key={challan.id}
                          className="p-4 border border-border-subtle rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-primary-600">
                                  {challan.challanNumber}
                                </p>
                                <Badge
                                  variant={
                                    challan.status === "DELIVERED"
                                      ? "success"
                                      : challan.status === "IN_TRANSIT"
                                      ? "warning"
                                      : "default"
                                  }
                                >
                                  {challan.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-text-muted mt-1">
                                {formatDate(challan.challanDate)}
                              </p>
                            </div>
                            {challan.vehicleNumber && (
                              <div className="text-right text-sm">
                                <p className="font-medium">{challan.vehicleNumber}</p>
                                <p className="text-text-muted">{challan.driverName}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-border-subtle">
                            <p className="text-sm text-text-muted mb-2">
                              {t("itemsDelivered")}:
                            </p>
                            {challan.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-sm py-1"
                              >
                                <span>{item.productName}</span>
                                <span className="font-medium">
                                  {item.quantityDelivered} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                          {challan.ewayBillNumber && (
                            <p className="text-xs text-text-muted mt-2">
                              E-Way Bill: {challan.ewayBillNumber}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardContent className="pt-6">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                      <CreditCard className="h-10 w-10 mx-auto mb-3 text-text-muted" />
                      <p className="font-medium">{t("noPayments")}</p>
                      <p className="text-sm">{t("noPaymentsDesc")}</p>
                      {canEdit &&
                        (order.status === "CONFIRMED" ||
                          order.status === "PARTIALLY_DELIVERED") && (
                          <Button className="mt-4" asChild>
                            <Link href={`/orders/${id}/payments/new`}>
                              <IndianRupee className="h-4 w-4 mr-2" />
                              {t("recordPayment")}
                            </Link>
                          </Button>
                        )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment: OrderPayment) => (
                        <div
                          key={payment.id}
                          className="p-4 border border-border-subtle rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-primary-600">
                                  {payment.receiptNumber}
                                </p>
                                <Badge variant="success">
                                  {payment.paymentMode}
                                </Badge>
                              </div>
                              <p className="text-sm text-text-muted mt-1">
                                {formatDate(payment.paymentDate)}
                              </p>
                            </div>
                            <p className="font-semibold text-lg text-success">
                              +{formatCurrency(payment.amount)}
                            </p>
                          </div>
                          {(payment.referenceNumber || payment.notes) && (
                            <div className="mt-3 pt-3 border-t border-border-subtle text-sm text-text-muted">
                              {payment.referenceNumber && (
                                <p>Ref: {payment.referenceNumber}</p>
                              )}
                              {payment.notes && <p>{payment.notes}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Activity timeline (mock data) */}
                    <div className="relative pl-6 pb-4 border-l-2 border-border-subtle">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-success" />
                      <p className="text-sm font-medium">{t("activity.orderCreated")}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(order.createdAt)} • {t("by")} System
                      </p>
                    </div>
                    {order.approvedAt && (
                      <div className="relative pl-6 pb-4 border-l-2 border-border-subtle">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary-500" />
                        <p className="text-sm font-medium">{t("activity.orderConfirmed")}</p>
                        <p className="text-xs text-text-muted">
                          {formatDate(order.approvedAt)}
                        </p>
                      </div>
                    )}
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="relative pl-6 pb-4 border-l-2 border-border-subtle"
                      >
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-success" />
                        <p className="text-sm font-medium">
                          {t("activity.paymentReceived")}: {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatDate(payment.paymentDate)} • {payment.paymentMode}
                        </p>
                      </div>
                    ))}
                    {deliveries.map((challan) => (
                      <div
                        key={challan.id}
                        className="relative pl-6 pb-4 border-l-2 border-border-subtle"
                      >
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-warning-500" />
                        <p className="text-sm font-medium">
                          {t("activity.deliveryCreated")}: {challan.challanNumber}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatDate(challan.challanDate)}
                        </p>
                      </div>
                    ))}
                    {order.cancelledAt && (
                      <div className="relative pl-6 pb-4 border-l-2 border-border-subtle">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-error" />
                        <p className="text-sm font-medium">{t("activity.orderCancelled")}</p>
                        <p className="text-xs text-text-muted">
                          {formatDate(order.cancelledAt)} • {order.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                <p className="font-medium">{order.customerSnapshot.name}</p>
                <p className="text-sm text-text-muted">{order.customerSnapshot.phone}</p>
                {order.customerSnapshot.email && (
                  <p className="text-sm text-text-muted">{order.customerSnapshot.email}</p>
                )}
              </div>
              {order.customerSnapshot.gstin && (
                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-xs text-text-muted">GSTIN</p>
                  <p className="text-sm font-mono">{order.customerSnapshot.gstin}</p>
                </div>
              )}
              <Badge variant="default">
                {order.customerSnapshot.customerType === "B2B_REGISTERED" ? "B2B" : "B2C"}
              </Badge>
            </CardContent>
          </Card>

          {/* Shipping Address */}
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

          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("orderSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("orderType")}</span>
                <Badge variant="default">{order.orderType}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("orderDate")}</span>
                <span>{formatDate(order.orderDate)}</span>
              </div>
              {order.expectedDeliveryDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("expectedDelivery")}</span>
                  <span className={isOverdue ? "text-error font-medium" : ""}>
                    {formatDate(order.expectedDeliveryDate)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("items")}</span>
                <span>{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("placeOfSupply")}</span>
                <span>{order.shippingAddress.state}</span>
              </div>

              <div className="pt-3 border-t border-border-subtle space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("subtotal")}</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>{t("discount")}</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("tax")}</span>
                  <span>{formatCurrency(order.totalTax)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border-subtle">
                  <span>{t("grandTotal")}</span>
                  <span className="text-lg">{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("paid")}</span>
                  <span className="text-success">{formatCurrency(order.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-text-muted">{t("due")}</span>
                  <span className={order.amountDue > 0 ? "text-error" : ""}>
                    {formatCurrency(order.amountDue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.internalNotes || order.customerNotes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("notes")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.internalNotes && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t("internalNotes")}</p>
                    <p className="text-sm">{order.internalNotes}</p>
                  </div>
                )}
                {order.customerNotes && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t("customerNotes")}</p>
                    <p className="text-sm">{order.customerNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
