"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePermission } from "@/lib/auth";
import { useStore } from "@/lib/hooks";
import { useCreateInvoice, useParties, useInventoryList } from "@/lib/api";
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
import {
  type CreateInvoiceInput,
} from "@/types";

// HSN Codes for common items
const HSN_CODES = {
  MARBLE_SLAB: "68022100",
  GRANITE_SLAB: "68022300",
  TILES_CERAMIC: "69072100",
  TILES_PORCELAIN: "69072200",
  CUTTING_SERVICE: "998599",
  TRANSPORT_SERVICE: "996511",
} as const;

// Form validation schema
const lineItemSchema = z.object({
  inventoryId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Price must be positive"),
});

const invoiceFormSchema = z.object({
  partyId: z.string().min(1, "Please select a party"),
  items: z.array(lineItemSchema).min(1, "At least one item required"),
  isGst: z.boolean(),
  cgstRate: z.number().min(0).max(100),
  sgstRate: z.number().min(0).max(100),
  igstRate: z.number().min(0).max(100),
  discountAmount: z.number().min(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

// Default line item
const defaultLineItem = {
  inventoryId: "",
  name: "",
  description: "",
  hsnCode: "",
  quantity: 1,
  unitPrice: 0,
};

export default function NewInvoicePage() {
  const router = useRouter();
  const { currentStore } = useStore();
  const canEdit = usePermission("INVOICE_EDIT");
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  // Fetch parties and inventory from backend
  const { data: parties = [], isLoading: isLoadingParties } = useParties({ type: "CUSTOMER" });
  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useInventoryList({ status: "AVAILABLE" });
  const createInvoice = useCreateInvoice();

  const sellerStateCode = currentStore?.stateCode || "";

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      partyId: "",
      items: [defaultLineItem],
      isGst: false,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      discountAmount: 0,
      dueDate: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchPartyId = watch("partyId");
  const watchIsGst = watch("isGst");
  const watchCgstRate = watch("cgstRate");
  const watchSgstRate = watch("sgstRate");
  const watchIgstRate = watch("igstRate");
  const watchDiscountAmount = watch("discountAmount");

  // Get selected party
  const selectedParty = React.useMemo(() => {
    return parties.find((p) => p.id === watchPartyId);
  }, [parties, watchPartyId]);

  // Calculate if inter-state (compare store state with party state if available)
  const isInterState = React.useMemo(() => {
    if (!selectedParty?.address || !sellerStateCode) return false;
    // Extract state code from party address or use a default
    // For now, we'll assume same state unless we have structured address
    return false; // TODO: Implement proper state code extraction
  }, [selectedParty, sellerStateCode]);

  // Calculate totals (for display only, backend will calculate final amounts)
  const calculations = React.useMemo(() => {
    let subtotal = 0;

    watchItems.forEach((item) => {
      subtotal += item.quantity * item.unitPrice;
    });

    const taxableAmount = subtotal - watchDiscountAmount;
    const cgstAmount = watchIsGst ? (taxableAmount * watchCgstRate) / 100 : 0;
    const sgstAmount = watchIsGst ? (taxableAmount * watchSgstRate) / 100 : 0;
    const igstAmount = watchIsGst ? (taxableAmount * watchIgstRate) / 100 : 0;
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = Math.round(taxableAmount + totalTax);
    const roundOff = grandTotal - (taxableAmount + totalTax);

    return {
      subtotal,
      discountAmount: watchDiscountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      roundOff,
      grandTotal,
    };
  }, [watchItems, watchDiscountAmount, watchIsGst, watchCgstRate, watchSgstRate, watchIgstRate]);

  // Handle party selection
  const handlePartySelect = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (party) {
      setValue("partyId", party.id);
      
      // Set due date 30 days from today
      const due = new Date();
      due.setDate(due.getDate() + 30);
      setValue("dueDate", due.toISOString().split("T")[0]);
    }
  };

  // Form submission
  const onSubmit = async (data: InvoiceFormData) => {
    if (!data.partyId || data.items.length === 0) return;

    try {
      const payload: CreateInvoiceInput = {
        partyId: data.partyId,
        items: data.items.map((item) => ({
          inventoryId: item.inventoryId || undefined,
          name: item.name,
          description: item.description || undefined,
          hsnCode: item.hsnCode || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        isGst: data.isGst,
        cgstRate: data.cgstRate,
        sgstRate: data.sgstRate,
        igstRate: data.igstRate,
        discountAmount: data.discountAmount,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
      };

      const newInvoice = await createInvoice.mutateAsync(payload);
      router.push(`/invoices/${newInvoice.id}`);
    } catch (error) {
      console.error("Failed to create invoice:", error);
    }
  };

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-text-primary">{t("newInvoice")}</h1>
          <p className="text-sm text-text-muted">{t("createInvoiceDesc")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("invoiceDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          {isLoadingParties ? (
                            <SelectItem value="loading" disabled>Loading parties...</SelectItem>
                          ) : (
                            parties.map((party) => (
                              <SelectItem key={party.id} value={party.id}>
                                <div className="flex items-center gap-2">
                                  <span>{party.name}</span>
                                  {party.gstNumber && (
                                    <Badge variant="default" className="text-xs">
                                      GST
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.partyId && (
                    <p className="text-sm text-error mt-1">{errors.partyId.message}</p>
                  )}
                </div>

                {selectedParty && (
                  <div className="p-4 bg-bg-app rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{selectedParty.name}</p>
                      {selectedParty.gstNumber && (
                        <Badge variant="default" className="text-xs">
                          GST: {selectedParty.gstNumber}
                        </Badge>
                      )}
                    </div>
                    {selectedParty.phone && (
                      <p className="text-sm text-text-muted">Phone: {selectedParty.phone}</p>
                    )}
                    {selectedParty.address && (
                      <p className="text-sm text-text-muted">Address: {selectedParty.address}</p>
                    )}
                    {selectedParty.email && (
                      <p className="text-sm text-text-muted">Email: {selectedParty.email}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GST Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">GST Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("isGst")}
                    className="rounded border-border-subtle"
                  />
                  <label className="text-sm font-medium text-text-primary">
                    Apply GST
                  </label>
                </div>
                {watchIsGst && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-text-primary mb-1.5 block">
                        CGST Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register("cgstRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-primary mb-1.5 block">
                        SGST Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register("sgstRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-primary mb-1.5 block">
                        IGST Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register("igstRate", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">
                    Discount Amount
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("discountAmount", { valueAsNumber: true })}
                  />
                </div>
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
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t("items")}</CardTitle>
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
                                const selectedItem = inventoryItems.find(
                                  (item) => item.id === itemId
                                );
                                if (selectedItem) {
                                  setValue(`items.${index}.name`, selectedItem.name || selectedItem.stoneName || "");
                                  setValue(`items.${index}.unitPrice`, selectedItem.sellPrice || selectedItem.unitPrice || 0);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingInventory ? "Loading..." : "Select from inventory..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingInventory ? (
                                  <SelectItem value="loading" disabled>Loading inventory...</SelectItem>
                                ) : (
                                  inventoryItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      <div className="flex items-center gap-2">
                                        <span>{item.name || item.stoneName || "Unnamed Item"}</span>
                                        {item.sellPrice && (
                                          <span className="text-xs text-text-muted">
                                            - ₹{item.sellPrice}/sqft
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
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

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            HSN Code
                          </label>
                          <Controller
                            name={`items.${index}.hsnCode`}
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value || ""} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select HSN" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={HSN_CODES.MARBLE_SLAB}>
                                    68022100 - Marble Slab
                                  </SelectItem>
                                  <SelectItem value={HSN_CODES.GRANITE_SLAB}>
                                    68022300 - Granite Slab
                                  </SelectItem>
                                  <SelectItem value={HSN_CODES.TILES_CERAMIC}>
                                    69072100 - Ceramic Tiles
                                  </SelectItem>
                                  <SelectItem value={HSN_CODES.TILES_PORCELAIN}>
                                    69072200 - Porcelain Tiles
                                  </SelectItem>
                                  <SelectItem value={HSN_CODES.CUTTING_SERVICE}>
                                    998599 - Cutting Service
                                  </SelectItem>
                                  <SelectItem value={HSN_CODES.TRANSPORT_SERVICE}>
                                    996511 - Transport
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Quantity
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">
                            Unit Price
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`items.${index}.unitPrice`, {
                              valueAsNumber: true,
                            })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">
                          Description (optional)
                        </label>
                        <Input
                          {...register(`items.${index}.description`)}
                          placeholder="Item description..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">
                          Total
                        </label>
                        <Input
                          type="text"
                          value={formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0))}
                          readOnly
                          className="bg-bg-app text-text-primary font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {errors.items && (
                  <p className="text-sm text-error">{errors.items.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Totals */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
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
                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Discount</span>
                      <span className="text-success">
                        -{formatCurrency(calculations.discountAmount)}
                      </span>
                    </div>
                  )}
                  {watchIsGst && !isInterState && calculations.cgstAmount > 0 && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">CGST ({watchCgstRate}%)</span>
                        <span>{formatCurrency(calculations.cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">SGST ({watchSgstRate}%)</span>
                        <span>{formatCurrency(calculations.sgstAmount)}</span>
                      </div>
                    </>
                  )}
                  {watchIsGst && isInterState && calculations.igstAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">IGST ({watchIgstRate}%)</span>
                      <span>{formatCurrency(calculations.igstAmount)}</span>
                    </div>
                  )}
                  {calculations.roundOff !== 0 && (
                    <div className="flex justify-between py-1 text-text-muted text-sm">
                      <span>Round Off</span>
                      <span>
                        {calculations.roundOff >= 0 ? "+" : ""}
                        {formatCurrency(Math.abs(calculations.roundOff))}
                      </span>
                    </div>
                  )}
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
            type="submit"
            disabled={createInvoice.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {createInvoice.isPending ? "Creating..." : t("issueInvoice")}
          </Button>
        </div>
      </form>
    </div>
  );
}
