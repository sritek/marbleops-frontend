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
} from "lucide-react";
import { useOrder, useUpdateOrderStatus } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import type { OrderStatus } from "@/types";

const statusVariants: Record<OrderStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  CONFIRMED: "warning",
  DELIVERED: "success",
  CANCELLED: "error",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canEdit = usePermission("ORDER_EDIT");

  const { data: order, isLoading, error } = useOrder(id);
  const updateStatus = useUpdateOrderStatus(id);

  const handleStatusUpdate = async (newStatus: string) => {
    await updateStatus.mutateAsync(newStatus);
  };

  if (isLoading) {
    return <PageLoader message="Loading order..." />;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">Order not found</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-text-primary">
              {order.orderNumber}
            </h1>
            <Badge variant={statusVariants[order.status]}>{order.status}</Badge>
          </div>
          <p className="text-sm text-text-muted">
            Created on {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2">
            {order.status === "DRAFT" && (
              <Button
                variant="secondary"
                onClick={() => handleStatusUpdate("CONFIRMED")}
                isLoading={updateStatus.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            )}
            {order.status === "CONFIRMED" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleStatusUpdate("DELIVERED")}
                  isLoading={updateStatus.isPending}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Mark Delivered
                </Button>
                <Button asChild>
                  <Link href={`/invoices/new?orderId=${order.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Link>
                </Button>
              </>
            )}
            {(order.status === "DRAFT" || order.status === "CONFIRMED") && (
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate("CANCELLED")}
                isLoading={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                        Item
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
                        Unit Price
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border-subtle last:border-0"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-app">
                              <Package className="h-4 w-4 text-text-muted" />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-text-muted">
                          No items in this order
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-bg-app">
                      <td
                        colSpan={3}
                        className="py-3 px-4 text-right font-medium"
                      >
                        Total
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-lg">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted whitespace-pre-wrap">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-app">
                  <User className="h-5 w-5 text-text-muted" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {order.party?.name || "Unknown"}
                  </p>
                  {order.party?.phone && (
                    <p className="text-sm text-text-muted">{order.party.phone}</p>
                  )}
                  {order.party?.address && (
                    <p className="text-sm text-text-muted mt-1">
                      {order.party.address}
                    </p>
                  )}
                </div>
              </div>
              {order.party && (
                <Button variant="link" className="mt-3 p-0" asChild>
                  <Link href={`/parties/${order.partyId}`}>View Customer</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Order Number</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Status</span>
                <Badge variant={statusVariants[order.status]} className="text-xs">
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Created</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Items</span>
                <span>{order.items?.length || 0}</span>
              </div>
              <div className="border-t border-border-subtle pt-3 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
