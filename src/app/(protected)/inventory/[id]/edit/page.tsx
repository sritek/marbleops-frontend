"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useInventoryItem, useParties, useUpdateInventory } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { clearPhotoStorage } from "@/components/features";
import type { CreateInventoryInput } from "@/types";
import { InventoryForm, type InventoryFormData } from "@/components/features/inventory-form";

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const canEdit = usePermission("INVENTORY_EDIT");

  const { data: item, isLoading, error } = useInventoryItem(id);
  const { data: parties = [], isLoading: isPartiesLoading } = useParties({ type: "SUPPLIER" });
  const updateInventory = useUpdateInventory(id);

  const isSubmitting = updateInventory.isPending;

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">You do not have permission to edit inventory items.</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (isLoading || isPartiesLoading) {
    return <PageLoader message="Loading item..." />;
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">Item not found</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const initialValues: Partial<InventoryFormData> = {
    stoneName: item.stoneName || item.name || "",
    materialType: item.materialType || undefined,
    form: item.form || undefined,
    color: item.color || undefined,
    finish: item.finish || undefined,
    supplier: item.supplier || undefined,
    lotNumber: item.lotNumber || undefined,
    quality: item.quality || "NORMAL",
    // Pieces & stock threshold
    pieces: item.quantity ?? undefined,
    lowStockThreshold: item.lowStockThreshold ?? 5,
    // Dimensions
    length: item.length ?? undefined,
    height: item.height ?? undefined,
    thickness: item.thickness ?? undefined,
    totalSqft: item.totalSqft ?? undefined,
    // Pricing
    buyPrice: item.buyPrice ?? undefined,
    sellPrice: item.sellPrice ?? undefined,
    // Description & photos
    description: item.description ?? undefined,
    photos: item.photos ?? [],
  };

  const supplierOptions = parties.map((party) => ({
    value: party.id,
    label: party.name,
  }));

  const handleSubmit = async (data: InventoryFormData) => {
    try {
      const payload: Partial<CreateInventoryInput> = {
        name: data.stoneName.trim(),
        description: data.description || undefined,
        // Generic inventory fields
        quantity: data.pieces,
        lowStockThreshold: data.lowStockThreshold,
        // Marble/Granite specific fields
        materialType: data.materialType,
        stoneName: data.stoneName,
        form: data.form,
        finish: data.finish || undefined,
        supplier: data.supplier || undefined,
        lotNumber: data.lotNumber || undefined,
        partyId: data.partyId || undefined,
        // Dimensions
        length: data.length,
        height: data.height,
        thickness: data.thickness,
        totalSqft: data.totalSqft,
        // We intentionally do not send availableSqft here to avoid overriding stock calculations
        // Pricing
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        // Quality
        quality: data.quality,
        // Color (frontend-only extension, may be ignored by backend)
        color: data.color,
      };

      await updateInventory.mutateAsync(payload);
      clearPhotoStorage();
      router.push(`/inventory/${id}`);
    } catch {
      // Error is handled by mutation toast
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Edit Item</h1>
          <p className="text-sm text-text-muted">
            Update details for {item.stoneName || item.name || "this item"}
          </p>
        </div>
      </div>

      <InventoryForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        supplierOptions={supplierOptions}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

