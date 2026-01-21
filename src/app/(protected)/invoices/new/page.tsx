"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Calculator,
  Save,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePermission } from "@/lib/auth";
import { useStore } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockSellerDetails } from "@/lib/mock/invoices";
import {
  INDIAN_STATES,
  MARBLE_HSN_CODES,
  type CustomerType,
  type InvoiceType,
  type UnitOfMeasure,
} from "@/types";

// Form validation schema
const lineItemSchema = z.object({
  inventoryId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  hsnCode: z.string().min(4, "HSN code required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string(),
  unitPrice: z.number().min(0, "Price must be positive"),
  gstRate: z.number(),
  dimensions: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      thickness: z.number().optional(),
    })
    .optional(),
});

const invoiceFormSchema = z.object({
  invoiceType: z.string(),
  partyId: z.string().min(1, "Please select a party"),
  customerType: z.string(),
  buyerName: z.string().min(1, "Buyer name required"),
  buyerGstin: z.string().optional(),
  billingAddress: z.string().min(1, "Billing address required"),
  billingState: z.string().min(1, "State required"),
  shippingAddress: z.string().optional(),
  shippingState: z.string().optional(),
  invoiceDate: z.string(),
  dueDate: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "At least one item required"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

// Mock parties for selection
const mockParties = [
  {
    id: "party-001",
    name: "Sharma Constructions Pvt. Ltd.",
    gstin: "24AADCS1234F1ZP",
    type: "B2B_REGISTERED" as CustomerType,
    address: "45, Industrial Estate, Ahmedabad",
    state: "24",
    phone: "+91 79 2345 6789",
  },
  {
    id: "party-002",
    name: "Mumbai Interiors & Designs",
    gstin: "27AABFM5678G1ZK",
    type: "B2B_REGISTERED" as CustomerType,
    address: "Office 301, Trade Center, Mumbai",
    state: "27",
    phone: "+91 22 2456 7890",
  },
  {
    id: "party-003",
    name: "Bangalore Stone Works",
    gstin: "29AABCB9012H1ZJ",
    type: "B2B_REGISTERED" as CustomerType,
    address: "123, Peenya Industrial Area, Bangalore",
    state: "29",
    phone: "+91 80 2345 6789",
  },
  {
    id: "party-004",
    name: "Patel Home Decor",
    gstin: null,
    type: "B2B_UNREGISTERED" as CustomerType,
    address: "Shop 12, Stone Market, Surat",
    state: "24",
    phone: "+91 98765 12345",
  },
  {
    id: "party-005",
    name: "Rajesh Kumar",
    gstin: null,
    type: "B2C" as CustomerType,
    address: "Flat 402, Sunrise Apartments, Rajkot",
    state: "24",
    phone: "+91 99887 76655",
  },
];

// Mock inventory items for selection
const mockInventoryItems = [
  { id: "1", name: "Italian White Marble", type: "MARBLE", hsnCode: "68022100", sellPrice: 750 },
  { id: "2", name: "Black Galaxy Granite", type: "GRANITE", hsnCode: "68022300", sellPrice: 800 },
  { id: "3", name: "Makrana White", type: "MARBLE", hsnCode: "68022100", sellPrice: 850 },
  { id: "4", name: "Fantasy Brown", type: "GRANITE", hsnCode: "68022300", sellPrice: 900 },
  { id: "5", name: "Rajnagar White", type: "MARBLE", hsnCode: "68022100", sellPrice: 650 },
  { id: "6", name: "Tan Brown Granite", type: "GRANITE", hsnCode: "68022300", sellPrice: 720 },
  { id: "7", name: "Porcelain 60x60 Tiles", type: "TILE", hsnCode: "69072200", sellPrice: 380 },
  { id: "8", name: "Ceramic Wall Tiles", type: "TILE", hsnCode: "69072100", sellPrice: 250 },
  { id: "9", name: "Statuario White Marble", type: "MARBLE", hsnCode: "68022100", sellPrice: 1500 },
  { id: "10", name: "Carrara White Marble", type: "MARBLE", hsnCode: "68022100", sellPrice: 1200 },
];

// Default line item
const defaultLineItem = {
  inventoryId: "",
  name: "",
  description: "",
  hsnCode: "68022100",
  quantity: 1,
  unit: "SQF" as UnitOfMeasure,
  unitPrice: 0,
  gstRate: 18,
  dimensions: { length: 0, width: 0, thickness: 0 },
};

export default function NewInvoicePage() {
  const router = useRouter();
  const { currentStore } = useStore();
  const canEdit = usePermission("INVOICE_EDIT");
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const sellerStateCode = mockSellerDetails.address.stateCode;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceType: "TAX_INVOICE",
      partyId: "",
      customerType: "B2B_REGISTERED",
      buyerName: "",
      buyerGstin: "",
      billingAddress: "",
      billingState: "",
      shippingAddress: "",
      shippingState: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      items: [defaultLineItem],
      notes: "",
      termsAndConditions:
        "1. Goods once sold will not be taken back.\n2. Payment due within 30 days.\n3. Interest @18% p.a. on delayed payments.",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchBillingState = watch("billingState");
  const watchCustomerType = watch("customerType");

  // Calculate if inter-state
  const isInterState = watchBillingState && watchBillingState !== sellerStateCode;

  // Calculate totals
  const calculations = React.useMemo(() => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const itemTotals = watchItems.map((item) => {
      const areaSqFt =
        item.dimensions?.length && item.dimensions?.width
          ? item.dimensions.length * item.dimensions.width * item.quantity
          : item.quantity;

      const taxableValue = areaSqFt * item.unitPrice;
      subtotal += taxableValue;

      const gstAmount = (taxableValue * item.gstRate) / 100;

      if (isInterState) {
        totalIgst += gstAmount;
        return {
          areaSqFt,
          taxableValue,
          cgst: 0,
          sgst: 0,
          igst: gstAmount,
          total: taxableValue + gstAmount,
        };
      } else {
        const halfGst = gstAmount / 2;
        totalCgst += halfGst;
        totalSgst += halfGst;
        return {
          areaSqFt,
          taxableValue,
          cgst: halfGst,
          sgst: halfGst,
          igst: 0,
          total: taxableValue + gstAmount,
        };
      }
    });

    const totalTax = totalCgst + totalSgst + totalIgst;
    const grandTotal = Math.round(subtotal + totalTax);
    const roundOff = grandTotal - (subtotal + totalTax);

    return {
      itemTotals,
      subtotal,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      roundOff,
      grandTotal,
    };
  }, [watchItems, isInterState]);

  // Handle party selection
  const handlePartySelect = (partyId: string) => {
    const party = mockParties.find((p) => p.id === partyId);
    if (party) {
      setValue("partyId", party.id);
      setValue("buyerName", party.name);
      setValue("buyerGstin", party.gstin || "");
      setValue("customerType", party.type);
      setValue("billingAddress", party.address);
      setValue("billingState", party.state);
      setValue("shippingAddress", party.address);
      setValue("shippingState", party.state);

      // Set due date 30 days from invoice date
      const invoiceDate = watch("invoiceDate");
      if (invoiceDate) {
        const due = new Date(invoiceDate);
        due.setDate(due.getDate() + 30);
        setValue("dueDate", due.toISOString().split("T")[0]);
      }
    }
  };

  // Form submission
  const onSubmit = async (data: InvoiceFormData, status: "DRAFT" | "ISSUED") => {
    console.log("Submitting invoice:", { ...data, status, calculations });
    // In real app, this would call API
    alert(`Invoice ${status === "DRAFT" ? "saved as draft" : "issued"} successfully!`);
    router.push("/invoices");
  };

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("newInvoice")}
          </h1>
          <p className="text-sm text-text-muted">{t("createNewInvoice")}</p>
        </div>
      </div>

      <form className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Invoice Details */}
          <div className="space-y-6">
            {/* Invoice Type & Date */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("invoiceDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                      {t("invoiceType")}
                    </label>
                    <Controller
                      name="invoiceType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TAX_INVOICE">Tax Invoice</SelectItem>
                            <SelectItem value="BILL_OF_SUPPLY">Bill of Supply</SelectItem>
                            <SelectItem value="PROFORMA">Proforma Invoice</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                      {t("invoiceDate")}
                    </label>
                    <Input type="date" {...register("invoiceDate")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">
                    {t("dueDate")}
                  </label>
                  <Input type="date" {...register("dueDate")} />
                </div>
              </CardContent>
            </Card>

            {/* Party Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("buyerDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">
                    {t("selectParty")}
                  </label>
                  <Controller
                    name="partyId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={handlePartySelect}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("searchParty")} />
                        </SelectTrigger>
                        <SelectContent>
                          {mockParties.map((party) => (
                            <SelectItem key={party.id} value={party.id}>
                              <div className="flex items-center gap-2">
                                <span>{party.name}</span>
                                <Badge variant="default" className="text-xs">
                                  {party.type.replace("_", " ")}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.partyId && (
                    <p className="text-sm text-error mt-1">{errors.partyId.message}</p>
                  )}
                </div>

                {watch("partyId") && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-text-primary mb-1.5 block">
                          {t("buyerName")}
                        </label>
                        <Input {...register("buyerName")} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-primary mb-1.5 block">
                          {t("gstin")}
                        </label>
                        <Input
                          {...register("buyerGstin")}
                          placeholder={watchCustomerType === "B2C" ? "N/A (B2C)" : "GSTIN"}
                          disabled={watchCustomerType === "B2C"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-primary mb-1.5 block">
                        {t("billingAddress")}
                      </label>
                      <Input {...register("billingAddress")} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-text-primary mb-1.5 block">
                          {t("billingState")}
                        </label>
                        <Controller
                          name="billingState"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent>
                                {INDIAN_STATES.map((state) => (
                                  <SelectItem key={state.code} value={state.code}>
                                    {state.name} ({state.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-primary mb-1.5 block">
                          {t("placeOfSupply")}
                        </label>
                        <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-border-subtle bg-bg-app">
                          <span className="text-sm">
                            {INDIAN_STATES.find((s) => s.code === watchBillingState)?.name ||
                              "Select billing state"}
                          </span>
                          {isInterState && (
                            <Badge variant="warning" className="ml-auto">
                              Inter-State (IGST)
                            </Badge>
                          )}
                          {!isInterState && watchBillingState && (
                            <Badge variant="success" className="ml-auto">
                              Intra-State (CGST+SGST)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("additionalInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">
                    {t("notes")}
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Internal notes..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">
                    {t("termsAndConditions")}
                  </label>
                  <textarea
                    {...register("termsAndConditions")}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Line Items */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t("lineItems")}</CardTitle>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => append(defaultLineItem)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("addItem")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-lg border border-border-subtle bg-bg-app space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-text-muted">
                        Item #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {/* Inventory Selection Dropdown */}
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">
                          Select Marble/Item
                        </label>
                        <Controller
                          name={`items.${index}.inventoryId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={(itemId) => {
                                field.onChange(itemId);
                                const selectedItem = mockInventoryItems.find(
                                  (item) => item.id === itemId
                                );
                                if (selectedItem) {
                                  setValue(`items.${index}.name`, selectedItem.name);
                                  setValue(`items.${index}.hsnCode`, selectedItem.hsnCode);
                                  setValue(`items.${index}.unitPrice`, selectedItem.sellPrice);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select from inventory..." />
                              </SelectTrigger>
                              <SelectContent>
                                {mockInventoryItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{item.name}</span>
                                      <span className="text-xs text-text-muted">
                                        ({item.type}) - ₹{item.sellPrice}/sqft
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Item Name (auto-filled or manual) */}
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">
                          Item Name
                        </label>
                        <Input
                          {...register(`items.${index}.name`)}
                          placeholder="Item name (e.g., Italian White Marble Slab)"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            HSN Code
                          </label>
                          <Controller
                            name={`items.${index}.hsnCode`}
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={MARBLE_HSN_CODES.MARBLE_SLAB}>
                                    68022100 - Marble Slab
                                  </SelectItem>
                                  <SelectItem value={MARBLE_HSN_CODES.GRANITE_SLAB}>
                                    68022300 - Granite Slab
                                  </SelectItem>
                                  <SelectItem value={MARBLE_HSN_CODES.TILES_CERAMIC}>
                                    69072100 - Ceramic Tiles
                                  </SelectItem>
                                  <SelectItem value={MARBLE_HSN_CODES.TILES_PORCELAIN}>
                                    69072200 - Porcelain Tiles
                                  </SelectItem>
                                  <SelectItem value={MARBLE_HSN_CODES.CUTTING_SERVICE}>
                                    998599 - Cutting Service
                                  </SelectItem>
                                  <SelectItem value={MARBLE_HSN_CODES.TRANSPORT_SERVICE}>
                                    996511 - Transport
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            GST Rate
                          </label>
                          <Controller
                            name={`items.${index}.gstRate`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value.toString()}
                                onValueChange={(v) => field.onChange(parseFloat(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="12">12%</SelectItem>
                                  <SelectItem value="18">18%</SelectItem>
                                  <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Length (ft)
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            {...register(`items.${index}.dimensions.length`, {
                              valueAsNumber: true,
                            })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Width (ft)
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            {...register(`items.${index}.dimensions.width`, {
                              valueAsNumber: true,
                            })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Qty (pcs)
                          </label>
                          <Input
                            type="number"
                            step="1"
                            {...register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Rate/sqft
                          </label>
                          <Input
                            type="number"
                            step="1"
                            {...register(`items.${index}.unitPrice`, {
                              valueAsNumber: true,
                            })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Calculated Values */}
                      <div className="grid gap-3 sm:grid-cols-3 pt-3 border-t border-border-subtle bg-bg-surface -mx-4 px-4 pb-1 -mb-4 rounded-b-lg">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Area (sq ft)
                          </label>
                          <Input
                            type="text"
                            value={calculations.itemTotals[index]?.areaSqFt.toFixed(2) || "0.00"}
                            readOnly
                            className="bg-bg-app text-text-primary font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Taxable Value
                          </label>
                          <Input
                            type="text"
                            value={formatCurrency(calculations.itemTotals[index]?.taxableValue || 0)}
                            readOnly
                            className="bg-bg-app text-text-primary font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Total (incl. GST)
                          </label>
                          <Input
                            type="text"
                            value={formatCurrency(calculations.itemTotals[index]?.total || 0)}
                            readOnly
                            className="bg-bg-app text-primary-600 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tax Summary & Totals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {t("taxSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">{t("subtotal")}</span>
                    <span>{formatCurrency(calculations.subtotal)}</span>
                  </div>

                  {!isInterState && calculations.totalCgst > 0 && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">CGST (9%)</span>
                        <span>{formatCurrency(calculations.totalCgst)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">SGST (9%)</span>
                        <span>{formatCurrency(calculations.totalSgst)}</span>
                      </div>
                    </>
                  )}

                  {isInterState && calculations.totalIgst > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">IGST (18%)</span>
                      <span>{formatCurrency(calculations.totalIgst)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 text-text-muted text-sm">
                    <span>Round Off</span>
                    <span>
                      {calculations.roundOff >= 0 ? "+" : ""}
                      {formatCurrency(Math.abs(calculations.roundOff))}
                    </span>
                  </div>

                  <div className="flex justify-between py-3 border-t-2 border-border-strong font-semibold text-lg">
                    <span>{t("grandTotal")}</span>
                    <span className="text-primary-600">
                      {formatCurrency(calculations.grandTotal)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={handleSubmit((data) => onSubmit(data, "DRAFT"))}
          >
            <Save className="h-4 w-4 mr-2" />
            {t("saveAsDraft")}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit((data) => onSubmit(data, "ISSUED"))}
          >
            <Send className="h-4 w-4 mr-2" />
            {t("issueInvoice")}
          </Button>
        </div>
      </form>
    </div>
  );
}
