"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Truck, Package, MapPin, User, CheckCircle, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useOrderStore } from "@/lib/stores";
import { downloadChallanPDF, printChallanPDF } from "@/lib/challan-pdf";
import type { Order, OrderLineItem, TransportMode, DeliveryChallan } from "@/types";

interface DeliveryItem {
  orderLineId: string;
  productName: string;
  hsnCode: string;
  quantityOrdered: number;
  quantityDelivered: number;
  quantityRemaining: number;
  quantityToDeliver: number;
  unit: string;
  selected: boolean;
}

export default function NewDeliveryChallanPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const canEdit = usePermission("ORDER_EDIT");
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  // Get store functions
  const { getOrderById, addDeliveryChallan } = useOrderStore();

  const [isLoading, setIsLoading] = React.useState(true);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [deliveryItems, setDeliveryItems] = React.useState<DeliveryItem[]>([]);
  const [createdChallan, setCreatedChallan] = React.useState<DeliveryChallan | null>(null);

  // Form state
  const [challanDate, setChallanDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [transportMode, setTransportMode] = React.useState<TransportMode>("OWN");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [driverName, setDriverName] = React.useState("");
  const [driverPhone, setDriverPhone] = React.useState("");
  const [transporterName, setTransporterName] = React.useState("");
  const [lrNumber, setLrNumber] = React.useState("");
  const [ewayBillNumber, setEwayBillNumber] = React.useState("");
  const [ewayBillDate, setEwayBillDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Load order data from store
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const fetchedOrder = getOrderById(orderId);
      setOrder(fetchedOrder || null);

      if (fetchedOrder?.items) {
        setDeliveryItems(
          fetchedOrder.items.map((item: OrderLineItem) => ({
            orderLineId: item.id,
            productName: item.productSnapshot.name,
            hsnCode: item.productSnapshot.hsnCode,
            quantityOrdered: item.quantityOrdered,
            quantityDelivered: item.quantityDelivered,
            quantityRemaining: item.quantityRemaining,
            quantityToDeliver: item.quantityRemaining,
            unit: item.unit,
            selected: item.quantityRemaining > 0,
          }))
        );
      }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [orderId, getOrderById]);

  // Handle item selection
  const handleItemSelect = (index: number, selected: boolean) => {
    setDeliveryItems((prev) => {
      const updated = [...prev];
      updated[index].selected = selected;
      if (!selected) {
        updated[index].quantityToDeliver = 0;
      } else {
        updated[index].quantityToDeliver = updated[index].quantityRemaining;
      }
      return updated;
    });
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, quantity: number) => {
    setDeliveryItems((prev) => {
      const updated = [...prev];
      updated[index].quantityToDeliver = Math.min(
        Math.max(0, quantity),
        updated[index].quantityRemaining
      );
      updated[index].selected = updated[index].quantityToDeliver > 0;
      return updated;
    });
  };

  // Get selected items count
  const selectedItems = deliveryItems.filter((item) => item.selected && item.quantityToDeliver > 0);
  const totalQuantityToDeliver = selectedItems.reduce(
    (sum, item) => sum + item.quantityToDeliver,
    0
  );

  // Submit delivery
  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    try {
      const challan = addDeliveryChallan({
        orderId,
        challanDate,
        transportMode,
        vehicleNumber: vehicleNumber || undefined,
        driverName: driverName || undefined,
        driverPhone: driverPhone || undefined,
        transporterName: transporterName || undefined,
        lrNumber: lrNumber || undefined,
        ewayBillNumber: ewayBillNumber || undefined,
        ewayBillDate: ewayBillDate || undefined,
        notes: notes || undefined,
        items: selectedItems.map((item) => ({
          orderLineId: item.orderLineId,
          productName: item.productName,
          hsnCode: item.hsnCode,
          quantityToDeliver: item.quantityToDeliver,
          unit: item.unit,
        })),
      });

      // Show success screen with the created challan
      setCreatedChallan(challan);
    } catch (error) {
      console.error("Failed to create delivery challan:", error);
    }
  };

  // Handle download PDF
  const handleDownloadPDF = () => {
    if (createdChallan && order) {
      downloadChallanPDF(createdChallan, order);
    }
  };

  // Handle print PDF
  const handlePrintPDF = () => {
    if (createdChallan && order) {
      printChallanPDF(createdChallan, order);
    }
  };

  // Handle create another
  const handleCreateAnother = () => {
    setCreatedChallan(null);
    // Reset form
    setChallanDate(new Date().toISOString().split("T")[0]);
    setTransportMode("OWN");
    setVehicleNumber("");
    setDriverName("");
    setDriverPhone("");
    setTransporterName("");
    setLrNumber("");
    setEwayBillNumber("");
    setEwayBillDate("");
    setNotes("");
    // Reload order to get updated remaining quantities
    const fetchedOrder = getOrderById(orderId);
    setOrder(fetchedOrder || null);
    if (fetchedOrder?.items) {
      setDeliveryItems(
        fetchedOrder.items.map((item: OrderLineItem) => ({
          orderLineId: item.id,
          productName: item.productSnapshot.name,
          hsnCode: item.productSnapshot.hsnCode,
          quantityOrdered: item.quantityOrdered,
          quantityDelivered: item.quantityDelivered,
          quantityRemaining: item.quantityRemaining,
          quantityToDeliver: item.quantityRemaining,
          unit: item.unit,
          selected: item.quantityRemaining > 0,
        }))
      );
    }
  };

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
        <p className="text-text-muted mb-4">You don't have permission to create deliveries</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className={`space-y-6 pb-24 lg:pb-6 transition-all duration-300 ${createdChallan ? "blur-sm pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 sm:ml-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
            {t("deliveryChallan.title")}
          </h1>
          <p className="text-sm text-text-muted truncate">
            {order.orderNumber} • {order.customerSnapshot.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 order-1">
          {/* Delivery Date */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("deliveryChallan.challanDate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Transport Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {t("deliveryChallan.transportMode")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("deliveryChallan.transportMode")}</Label>
                  <Select
                    value={transportMode}
                    onValueChange={(v) => setTransportMode(v as TransportMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWN">
                        {t("deliveryChallan.transportModes.own")}
                      </SelectItem>
                      <SelectItem value="COURIER">
                        {t("deliveryChallan.transportModes.courier")}
                      </SelectItem>
                      <SelectItem value="CUSTOMER_PICKUP">
                        {t("deliveryChallan.transportModes.customerPickup")}
                      </SelectItem>
                      <SelectItem value="THIRD_PARTY">
                        {t("deliveryChallan.transportModes.thirdParty")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("deliveryChallan.vehicleNumber")}</Label>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="MH-02-XX-1234"
                  />
                </div>
              </div>

              {(transportMode === "OWN" || transportMode === "THIRD_PARTY") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("deliveryChallan.driverName")}</Label>
                    <Input
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("deliveryChallan.driverPhone")}</Label>
                    <Input
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              )}

              {transportMode === "THIRD_PARTY" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("deliveryChallan.transporterName")}</Label>
                    <Input
                      value={transporterName}
                      onChange={(e) => setTransporterName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("deliveryChallan.lrNumber")}</Label>
                    <Input
                      value={lrNumber}
                      onChange={(e) => setLrNumber(e.target.value)}
                      placeholder="LR Number"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* E-Way Bill */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("deliveryChallan.ewayBill")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("deliveryChallan.ewayBillNumber")}</Label>
                  <Input
                    value={ewayBillNumber}
                    onChange={(e) => setEwayBillNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("deliveryChallan.ewayBillDate")}</Label>
                  <Input
                    type="date"
                    value={ewayBillDate}
                    onChange={(e) => setEwayBillDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items to Deliver */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("deliveryChallan.selectItems")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliveryItems.map((item, index) => (
                  <div
                    key={item.orderLineId}
                    className={`p-4 border rounded-lg transition-colors ${
                      item.selected
                        ? "border-primary-300 bg-primary-50"
                        : "border-border-subtle"
                    } ${item.quantityRemaining === 0 ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Larger touch target for checkbox */}
                      <div className="flex items-center justify-center w-8 h-8 -ml-1">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(checked) =>
                            handleItemSelect(index, !!checked)
                          }
                          disabled={item.quantityRemaining === 0}
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Stack on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.productName}</p>
                            <p className="text-xs text-text-muted">
                              HSN: {item.hsnCode}
                            </p>
                          </div>
                          <div className="text-left sm:text-right text-sm flex flex-wrap gap-x-3 sm:block">
                            <p>
                              <span className="text-text-muted">Ordered:</span>{" "}
                              {item.quantityOrdered} {item.unit}
                            </p>
                            <p>
                              <span className="text-text-muted">Delivered:</span>{" "}
                              {item.quantityDelivered} {item.unit}
                            </p>
                            <p className="font-medium">
                              <span className="text-text-muted">Remaining:</span>{" "}
                              {item.quantityRemaining} {item.unit}
                            </p>
                          </div>
                        </div>

                        {item.quantityRemaining > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                            <Label className="text-sm whitespace-nowrap">
                              {t("deliveryChallan.quantityToDeliver")}:
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={item.quantityRemaining}
                                value={item.quantityToDeliver}
                                onChange={(e) =>
                                  handleQuantityChange(index, Number(e.target.value))
                                }
                                className="w-24"
                              />
                              <span className="text-sm text-text-muted">
                                {item.unit}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("notes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery instructions, special handling notes..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Desktop only */}
        <div className="lg:col-span-1 space-y-6 order-2 hidden lg:block">
          {/* Delivery Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("detail.shippingAddress")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                {order.shippingAddress.contactPerson && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-text-muted" />
                      {order.shippingAddress.contactPerson}
                    </p>
                    {order.shippingAddress.contactPhone && (
                      <p className="text-text-muted">
                        {order.shippingAddress.contactPhone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Items Selected</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Total Quantity</span>
                  <span className="font-medium">{totalQuantityToDeliver} units</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  disabled={selectedItems.length === 0}
                  onClick={handleSubmit}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Create Delivery Challan
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

        {/* Mobile Delivery Address Card */}
        <div className="order-2 lg:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("detail.shippingAddress")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                {order.shippingAddress.contactPerson && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-text-muted" />
                      {order.shippingAddress.contactPerson}
                    </p>
                    {order.shippingAddress.contactPhone && (
                      <p className="text-text-muted">
                        {order.shippingAddress.contactPhone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border-subtle p-4 lg:hidden z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted">Selected</p>
            <p className="text-sm font-semibold">
              {selectedItems.length} items • {totalQuantityToDeliver} units
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => router.back()}>
              {tCommon("cancel")}
            </Button>
            <Button
              size="sm"
              disabled={selectedItems.length === 0}
              onClick={handleSubmit}
            >
              <Truck className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Success Overlay Dialog */}
    <Dialog open={!!createdChallan} onOpenChange={() => router.push(`/orders/${orderId}`)}>
      <DialogContent className="sm:max-w-md">
        {createdChallan && order && (
          <>
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <DialogTitle className="text-2xl font-semibold text-text-primary">
                {t("deliveryChallan.challanCreated")}
              </DialogTitle>
              <p className="text-text-muted text-sm">
                {createdChallan.challanNumber}
              </p>
            </DialogHeader>

            {/* Challan Summary */}
            <div className="p-4 bg-surface-secondary rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("deliveryChallan.challanDate")}</span>
                <span className="font-medium">{formatDate(createdChallan.challanDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("order")}</span>
                <span className="font-medium">{createdChallan.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{tCommon("status")}</span>
                <span className="font-medium text-warning-600">Dispatched</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Items</span>
                <span className="font-medium">{createdChallan.items.length} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Quantity</span>
                <span className="font-medium">
                  {createdChallan.items.reduce((sum, item) => sum + item.quantityDispatched, 0)} units
                </span>
              </div>
              {createdChallan.vehicleNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t("deliveryChallan.vehicleNumber")}</span>
                  <span className="font-medium">{createdChallan.vehicleNumber}</span>
                </div>
              )}
            </div>

            {/* Print Action */}
            <Button className="w-full" onClick={handlePrintPDF}>
              <Printer className="h-4 w-4 mr-2" />
              {t("deliveryChallan.printChallan")}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
