"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Search,
  MapPin,
  User,
  Building2,
  Calculator,
  Copy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  OrderType,
  Priority,
  GSTAddress,
  ShippingAddress,
  CustomerType,
  UnitOfMeasure,
} from "@/types";
import { INDIAN_STATES } from "@/types";

// Mock inventory items for selection
const mockInventoryItems = [
  {
    id: "inv-001",
    name: "Italian White Carrara Marble",
    sku: "IWC-001",
    hsnCode: "68022100",
    category: "Marble",
    color: "White",
    finish: "Polished",
    unitPrice: 850,
    availableQty: 500,
  },
  {
    id: "inv-002",
    name: "Black Galaxy Granite",
    sku: "BGG-001",
    hsnCode: "68022300",
    category: "Granite",
    color: "Black",
    finish: "Polished",
    unitPrice: 450,
    availableQty: 800,
  },
  {
    id: "inv-003",
    name: "Rajasthan Green Marble",
    sku: "RGM-001",
    hsnCode: "68022100",
    category: "Marble",
    color: "Green",
    finish: "Polished",
    unitPrice: 380,
    availableQty: 600,
  },
  {
    id: "inv-004",
    name: "Makrana White Marble",
    sku: "MWM-001",
    hsnCode: "68022100",
    category: "Marble",
    color: "White",
    finish: "Polished",
    unitPrice: 650,
    availableQty: 400,
  },
  {
    id: "inv-005",
    name: "Tan Brown Granite",
    sku: "TBG-001",
    hsnCode: "68022300",
    category: "Granite",
    color: "Brown",
    finish: "Polished",
    unitPrice: 320,
    availableQty: 1000,
  },
  {
    id: "inv-006",
    name: "Italian Botticino Beige",
    sku: "IBB-001",
    hsnCode: "68022100",
    category: "Marble",
    color: "Beige",
    finish: "Honed",
    unitPrice: 780,
    availableQty: 300,
  },
];

// Mock customers
const mockCustomers = [
  {
    id: "party-001",
    name: "Sharma Constructions Pvt. Ltd.",
    gstin: "24AADCS1234F1ZP",
    phone: "+91 79 2345 6789",
    email: "procurement@sharma.com",
    customerType: "B2B_REGISTERED" as CustomerType,
    billingAddress: {
      line1: "45, Industrial Estate",
      city: "Ahmedabad",
      state: "Gujarat",
      stateCode: "24",
      pincode: "380015",
    },
    shippingAddress: {
      line1: "Site Office, Sarkhej Road",
      city: "Ahmedabad",
      state: "Gujarat",
      stateCode: "24",
      pincode: "380055",
      contactPerson: "Ramesh Sharma",
      contactPhone: "+91 98765 11111",
    },
  },
  {
    id: "party-002",
    name: "Mumbai Interiors & Designs",
    gstin: "27AABFM5678G1ZK",
    phone: "+91 22 2456 7890",
    email: "orders@mumbaiinteriors.in",
    customerType: "B2B_REGISTERED" as CustomerType,
    billingAddress: {
      line1: "Office 301, Trade Center",
      city: "Mumbai",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "400001",
    },
    shippingAddress: {
      line1: "Warehouse, Bhiwandi",
      city: "Thane",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "421302",
      contactPerson: "Suresh Patil",
      contactPhone: "+91 98765 22222",
    },
  },
  {
    id: "party-005",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    customerType: "B2C" as CustomerType,
    billingAddress: {
      line1: "B-102, Shanti Apartments",
      city: "Rajkot",
      state: "Gujarat",
      stateCode: "24",
      pincode: "360005",
    },
    shippingAddress: {
      line1: "B-102, Shanti Apartments",
      city: "Rajkot",
      state: "Gujarat",
      stateCode: "24",
      pincode: "360005",
      contactPerson: "Rajesh Kumar",
      contactPhone: "+91 98765 43210",
    },
  },
];

interface OrderItem {
  id: string;
  inventoryId: string;
  name: string;
  hsnCode: string;
  category: string;
  length: number;
  width: number;
  quantity: number;
  unit: UnitOfMeasure;
  areaSqft: number;
  unitPrice: number;
  discountPercent: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
  lineNotes: string;
}

const emptyAddress: GSTAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  stateCode: "",
  pincode: "",
};

const emptyShippingAddress: ShippingAddress = {
  ...emptyAddress,
  contactPerson: "",
  contactPhone: "",
};

export default function NewOrderPage() {
  const router = useRouter();
  const canEdit = usePermission("ORDER_EDIT");
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  // Form state
  const [orderType, setOrderType] = React.useState<OrderType>("STANDARD");
  const [priority, setPriority] = React.useState<Priority>("NORMAL");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState("");

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [customerType, setCustomerType] = React.useState<CustomerType>("B2B_REGISTERED");

  // Address state
  const [billingAddress, setBillingAddress] = React.useState<GSTAddress>(emptyAddress);
  const [shippingAddress, setShippingAddress] = React.useState<ShippingAddress>(emptyShippingAddress);
  const [placeOfSupply, setPlaceOfSupply] = React.useState("24"); // Default Gujarat

  // Items state
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const itemIdCounter = React.useRef(0);
  const [inventorySearch, setInventorySearch] = React.useState("");

  // Notes state
  const [internalNotes, setInternalNotes] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState(0);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Seller state code (Gujarat)
  const sellerStateCode = "24";

  // Filter customers
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return mockCustomers;
    const search = customerSearch.toLowerCase();
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(customerSearch) ||
        c.gstin?.toLowerCase().includes(search)
    );
  }, [customerSearch]);

  // Filter inventory
  const filteredInventory = React.useMemo(() => {
    if (!inventorySearch) return [];
    const search = inventorySearch.toLowerCase();
    return mockInventoryItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search)
      )
      .slice(0, 8);
  }, [inventorySearch]);

  // Is inter-state supply
  const isInterState = placeOfSupply !== sellerStateCode;

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
      setCustomerType(customer.customerType);
      setBillingAddress(customer.billingAddress);
      setShippingAddress(customer.shippingAddress as ShippingAddress);
      setPlaceOfSupply(customer.billingAddress.stateCode);
      setCustomerSearch("");
    }
  };

  // Copy billing to shipping
  const handleCopyBillingToShipping = () => {
    setShippingAddress({
      ...billingAddress,
      contactPerson: shippingAddress.contactPerson,
      contactPhone: shippingAddress.contactPhone,
    });
  };

  // Add item to order
  const handleAddItem = (inventoryItem: typeof mockInventoryItems[0]) => {
    const existingIndex = items.findIndex((i) => i.inventoryId === inventoryItem.id);
    if (existingIndex >= 0) {
      // Update existing item quantity
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      recalculateItem(newItems, existingIndex);
      setItems(newItems);
    } else {
      // Add new item
      itemIdCounter.current += 1;
      const newItem: OrderItem = {
        id: `item-${itemIdCounter.current}`,
        inventoryId: inventoryItem.id,
        name: inventoryItem.name,
        hsnCode: inventoryItem.hsnCode,
        category: inventoryItem.category,
        length: 0,
        width: 0,
        quantity: 1,
        unit: "SQF",
        areaSqft: 0,
        unitPrice: inventoryItem.unitPrice,
        discountPercent: 0,
        taxableValue: inventoryItem.unitPrice,
        gstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        lineTotal: 0,
        lineNotes: "",
      };
      recalculateItem([...items, newItem], items.length);
      setItems([...items, newItem]);
    }
    setInventorySearch("");
  };

  // Recalculate item totals
  const recalculateItem = (itemsList: OrderItem[], index: number) => {
    const item = itemsList[index];
    const area = item.length > 0 && item.width > 0 ? item.length * item.width * item.quantity : item.quantity;
    item.areaSqft = area;
    
    const baseValue = area * item.unitPrice;
    item.taxableValue = baseValue * (1 - item.discountPercent / 100);
    
    const taxAmount = item.taxableValue * item.gstRate / 100;
    if (isInterState) {
      item.cgstAmount = 0;
      item.sgstAmount = 0;
      item.igstAmount = taxAmount;
    } else {
      item.cgstAmount = taxAmount / 2;
      item.sgstAmount = taxAmount / 2;
      item.igstAmount = 0;
    }
    
    item.lineTotal = item.taxableValue + item.cgstAmount + item.sgstAmount + item.igstAmount;
  };

  // Update item field
  const handleUpdateItem = (
    index: number,
    field: keyof OrderItem,
    value: number | string
  ) => {
    const newItems = [...items];
    const item = newItems[index];
    // Type-safe field assignment
    switch (field) {
      case "length":
      case "width":
      case "quantity":
      case "unitPrice":
      case "discountPercent":
      case "gstRate":
        item[field] = value as number;
        break;
      case "lineNotes":
        item[field] = value as string;
        break;
      default:
        break;
    }
    recalculateItem(newItems, index);
    setItems(newItems);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate totals
  const totals = React.useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.taxableValue, 0);
    const discountAmount = subtotal * discountPercent / 100;
    const taxableAmount = subtotal - discountAmount;
    
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    
    items.forEach((item) => {
      const itemTaxable = item.taxableValue * (1 - discountPercent / 100);
      const itemTax = itemTaxable * item.gstRate / 100;
      if (isInterState) {
        igstAmount += itemTax;
      } else {
        cgstAmount += itemTax / 2;
        sgstAmount += itemTax / 2;
      }
    });
    
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = taxableAmount + totalTax;
    const roundOff = Math.round(grandTotal) - grandTotal;
    
    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      roundOff,
      grandTotal: Math.round(grandTotal),
    };
  }, [items, discountPercent, isInterState]);

  // Submit order
  const handleSubmit = async () => {
    if (!selectedCustomerId || items.length === 0) return;

    setIsSubmitting(true);
    
    // Simulate API call
    console.log("Creating order:", {
      orderType,
      priority,
      expectedDeliveryDate,
      customerId: selectedCustomerId,
      customerType,
      billingAddress,
      shippingAddress,
      placeOfSupply,
      items: items.map((item) => ({
        inventoryId: item.inventoryId,
        quantity: item.areaSqft || item.quantity,
        unitPrice: item.unitPrice,
        dimensions: item.length > 0 ? { length: item.length, width: item.width, unit: "FT" } : undefined,
        gstRate: item.gstRate,
        discountPercent: item.discountPercent,
        lineNotes: item.lineNotes,
      })),
      discountPercent,
      internalNotes,
      customerNotes,
      totals,
    });

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    router.push("/orders");
  };

  const selectedCustomer = mockCustomers.find((c) => c.id === selectedCustomerId);

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">{t("noPermission")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {tCommon("goBack")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("newOrder")}</h1>
          <p className="text-sm text-text-muted">{t("createNewOrderDesc")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Type & Priority */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("orderDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("orderType")}</Label>
                  <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">{t("orderTypes.standard")}</SelectItem>
                      <SelectItem value="COUNTER_SALE">{t("orderTypes.counterSale")}</SelectItem>
                      <SelectItem value="PROJECT">{t("orderTypes.project")}</SelectItem>
                      <SelectItem value="SAMPLE">{t("orderTypes.sample")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("priority")}</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">{t("priority.normal")}</SelectItem>
                      <SelectItem value="URGENT">{t("priority.urgent")}</SelectItem>
                      <SelectItem value="LOW">{t("priority.low")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("expectedDelivery")}</Label>
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("customer")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCustomer ? (
                <div className="p-4 border border-border-subtle rounded-lg bg-bg-app">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{selectedCustomer.name}</p>
                      <p className="text-sm text-text-muted">{selectedCustomer.phone}</p>
                      {selectedCustomer.gstin && (
                        <p className="text-xs text-text-muted mt-1">
                          GSTIN: {selectedCustomer.gstin}
                        </p>
                      )}
                      <Badge variant="default" className="mt-2">
                        {selectedCustomer.customerType === "B2B_REGISTERED" ? "B2B" : "B2C"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomerId("")}
                    >
                      {tCommon("change")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    placeholder={t("searchCustomer")}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                  {customerSearch && filteredCustomers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-border-subtle rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          className="w-full text-left px-4 py-3 hover:bg-bg-app border-b border-border-subtle last:border-0"
                          onClick={() => handleSelectCustomer(customer.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-xs text-text-muted">{customer.phone}</p>
                            </div>
                            <Badge variant="default">
                              {customer.customerType === "B2B_REGISTERED" ? "B2B" : "B2C"}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          {selectedCustomerId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("addresses")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Billing Address */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t("billingAddress")}</Label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      placeholder={t("addressLine1")}
                      value={billingAddress.line1}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, line1: e.target.value })
                      }
                    />
                    <Input
                      placeholder={t("addressLine2")}
                      value={billingAddress.line2 || ""}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, line2: e.target.value })
                      }
                    />
                    <Input
                      placeholder={t("city")}
                      value={billingAddress.city}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, city: e.target.value })
                      }
                    />
                    <Select
                      value={billingAddress.stateCode}
                      onValueChange={(v) => {
                        const state = INDIAN_STATES.find((s) => s.code === v);
                        setBillingAddress({
                          ...billingAddress,
                          stateCode: v,
                          state: state?.name || "",
                        });
                        setPlaceOfSupply(v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectState")} />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={t("pincode")}
                      value={billingAddress.pincode}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, pincode: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t("shippingAddress")}</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyBillingToShipping}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {t("copyFromBilling")}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      placeholder={t("addressLine1")}
                      value={shippingAddress.line1}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, line1: e.target.value })
                      }
                    />
                    <Input
                      placeholder={t("addressLine2")}
                      value={shippingAddress.line2 || ""}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, line2: e.target.value })
                      }
                    />
                    <Input
                      placeholder={t("city")}
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                    />
                    <Select
                      value={shippingAddress.stateCode}
                      onValueChange={(v) => {
                        const state = INDIAN_STATES.find((s) => s.code === v);
                        setShippingAddress({
                          ...shippingAddress,
                          stateCode: v,
                          state: state?.name || "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectState")} />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={t("pincode")}
                      value={shippingAddress.pincode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, pincode: e.target.value })
                      }
                    />
                    <Input
                      placeholder={t("contactPerson")}
                      value={shippingAddress.contactPerson || ""}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, contactPerson: e.target.value })
                      }
                    />
                    <Input
                      placeholder={t("contactPhone")}
                      value={shippingAddress.contactPhone || ""}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, contactPhone: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Place of Supply */}
                <div className="flex items-center justify-between p-3 bg-bg-app rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{t("placeOfSupply")}</p>
                    <p className="text-xs text-text-muted">
                      {isInterState ? t("interState") : t("intraState")} ({isInterState ? "IGST" : "CGST+SGST"})
                    </p>
                  </div>
                  <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("orderItems")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search inventory */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder={t("searchInventory")}
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="pl-9"
                />
                {inventorySearch && filteredInventory.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-border-subtle rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredInventory.map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-4 py-3 hover:bg-bg-app border-b border-border-subtle last:border-0"
                        onClick={() => handleAddItem(item)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-text-muted">
                              {item.category} • {item.color} • HSN: {item.hsnCode}
                            </p>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(item.unitPrice)}/sqft
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items list */}
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 border border-border-subtle rounded-lg bg-bg-app space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-text-muted">
                            {item.category} • HSN: {item.hsnCode}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Dimensions & Quantity */}
                      <div className="grid gap-3 sm:grid-cols-5">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("lengthFt")}</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={item.length || ""}
                            onChange={(e) =>
                              handleUpdateItem(index, "length", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("widthFt")}</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={item.width || ""}
                            onChange={(e) =>
                              handleUpdateItem(index, "width", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("qty")}</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(index, "quantity", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("areaSqft")}</Label>
                          <Input
                            type="text"
                            value={item.areaSqft.toFixed(2)}
                            readOnly
                            className="bg-bg-surface"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("rate")}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      {/* GST & Discount */}
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("gstRate")}</Label>
                          <Select
                            value={item.gstRate.toString()}
                            onValueChange={(v) => handleUpdateItem(index, "gstRate", parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("discountPercent")}</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discountPercent}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                "discountPercent",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("taxableValue")}</Label>
                          <Input
                            type="text"
                            value={formatCurrency(item.taxableValue)}
                            readOnly
                            className="bg-bg-surface font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("lineTotal")}</Label>
                          <Input
                            type="text"
                            value={formatCurrency(item.lineTotal)}
                            readOnly
                            className="bg-bg-surface font-semibold text-primary-600"
                          />
                        </div>
                      </div>

                      {/* Line Notes */}
                      <Input
                        placeholder={t("lineNotes")}
                        value={item.lineNotes}
                        onChange={(e) => handleUpdateItem(index, "lineNotes", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted border-2 border-dashed border-border-subtle rounded-lg">
                  <Calculator className="h-10 w-10 mx-auto mb-3 text-text-muted" />
                  <p className="font-medium">{t("noItems")}</p>
                  <p className="text-sm">{t("searchToAdd")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("notes")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("internalNotes")}</Label>
                <Textarea
                  placeholder={t("internalNotesPlaceholder")}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("customerNotes")}</Label>
                <Textarea
                  placeholder={t("customerNotesPlaceholder")}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items Summary */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-text-muted truncate max-w-[150px]">
                      {item.name}
                    </span>
                    <span>{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <>
                  {/* Overall Discount */}
                  <div className="pt-2 border-t border-border-subtle">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t("overallDiscount")}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                          className="w-20 text-right"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 pt-2 border-t border-border-subtle text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t("subtotal")}</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>{t("discount")}</span>
                        <span>-{formatCurrency(totals.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t("taxableAmount")}</span>
                      <span>{formatCurrency(totals.taxableAmount)}</span>
                    </div>
                    {!isInterState ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-muted">CGST</span>
                          <span>{formatCurrency(totals.cgstAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">SGST</span>
                          <span>{formatCurrency(totals.sgstAmount)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-text-muted">IGST</span>
                        <span>{formatCurrency(totals.igstAmount)}</span>
                      </div>
                    )}
                    {totals.roundOff !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">{t("roundOff")}</span>
                        <span>{formatCurrency(totals.roundOff)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border-subtle">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>{t("grandTotal")}</span>
                      <span className="text-primary-600">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  disabled={!selectedCustomerId || items.length === 0}
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                >
                  {t("createOrder")}
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => router.back()}>
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
