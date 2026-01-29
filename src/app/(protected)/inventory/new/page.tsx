"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCreateInventory, useParties } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { clearPhotoStorage } from "@/components/features";
import { InventoryForm, type InventoryFormData } from "@/components/features/inventory-form";

export default function NewInventoryPage() {
  const router = useRouter();
  const createInventory = useCreateInventory();
  const { data: parties = [] } = useParties({ type: "SUPPLIER" });

  const onSubmit = async (data: InventoryFormData) => {
    try {
      const payload = {
        // Backend-required generic fields
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
        color: data.color || undefined,
        lotNumber: data.lotNumber || undefined,
        // Link to supplier party if selected
        partyId: data.partyId || undefined,
        // Dimensions
        length: data.length,
        height: data.height,
        thickness: data.thickness,
        totalSqft: data.totalSqft,
        availableSqft: data.totalSqft, // Initially all sqft is available
        // Pricing
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        // Quality
        quality: data.quality,
      };

      await createInventory.mutateAsync(payload);
      // Clear photo storage after successful submission
      clearPhotoStorage();
      router.push("/inventory");
    } catch {
      // Error handled by mutation
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
          <h1 className="text-2xl font-semibold text-text-primary">Add Item</h1>
          <p className="text-sm text-text-muted">Add a new item to inventory</p>
        </div>
      </div>

      <InventoryForm
        mode="create"
        onSubmit={onSubmit}
        supplierOptions={parties.map((party) => ({
          value: party.id,
          label: party.name,
        }))}
      />
    </div>
  );
}
