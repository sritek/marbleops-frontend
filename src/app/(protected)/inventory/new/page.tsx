"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useCreateInventory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput, FormTextarea, FormSelect } from "@/components/forms";
import { PhotoUpload, clearPhotoStorage } from "@/components/features";

// Validation schema
const inventorySchema = z.object({
  stoneName: z.string().min(1, "Name is required").max(200),
  materialType: z.enum(["MARBLE", "GRANITE", "TILE"]).optional(),
  form: z.enum(["SLAB", "BLOCK", "TILE"]).optional(),
  color: z.enum(["WHITE", "BLACK", "GREY", "BEIGE", "BROWN", "GREEN", "BLUE", "PINK", "RED", "YELLOW", "MULTI"]).optional(),
  finish: z.string().max(100).optional(),
  supplier: z.string().max(200).optional(),
  lotNumber: z.string().max(50).optional(),
  length: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  thickness: z.coerce.number().positive().optional(),
  totalSqft: z.coerce.number().positive().optional(),
  buyPrice: z.coerce.number().positive().optional(),
  sellPrice: z.coerce.number().positive().optional(),
  quality: z.enum(["NORMAL", "CRACKED", "DAMAGED"]).optional(),
  description: z.string().max(500).optional(),
  photos: z.array(z.string()).optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

export default function NewInventoryPage() {
  const router = useRouter();
  const createInventory = useCreateInventory();
  
  // Photos state
  const [photos, setPhotos] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema) as any,
    defaultValues: {
      materialType: undefined,
      form: undefined,
      quality: "NORMAL",
      photos: [],
    },
  });

  // Watch length and height for auto-calculation
  const length = watch("length");
  const height = watch("height");

  // Auto-calculate Total Sqft when length and height change
  React.useEffect(() => {
    if (length && height && length > 0 && height > 0) {
      const calculatedSqft = Number((length * height).toFixed(2));
      setValue("totalSqft", calculatedSqft);
    }
  }, [length, height, setValue]);

  // Update form photos when photos state changes
  React.useEffect(() => {
    setValue("photos", photos);
  }, [photos, setValue]);

  const onSubmit = async (data: InventoryFormData) => {
    try {
      await createInventory.mutateAsync({
        ...data,
        photos: photos,
        availableSqft: data.totalSqft, // Initially all sqft is available
      });
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

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Two-column layout: Photo on left, Form on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Left Column - Photo Upload (sticky on desktop) */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <PhotoUpload
              photos={photos}
              onChange={setPhotos}
              maxPhotos={5}
              storageKey="inventory_photos_temp"
            />
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormInput
                  {...register("stoneName")}
                  name="stoneName"
                  label="Stone Name"
                  placeholder="e.g., Italian White Marble"
                  error={errors.stoneName?.message}
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormSelect
                    name="materialType"
                    label="Material Type"
                    value={watch("materialType") || ""}
                    onValueChange={(v) => setValue("materialType", v as "MARBLE" | "GRANITE" | "TILE")}
                    options={[
                      { value: "MARBLE", label: "Marble" },
                      { value: "GRANITE", label: "Granite" },
                      { value: "TILE", label: "Tile" },
                    ]}
                    error={errors.materialType?.message}
                  />

                  <FormSelect
                    name="form"
                    label="Form"
                    value={watch("form") || ""}
                    onValueChange={(v) => setValue("form", v as "SLAB" | "BLOCK" | "TILE")}
                    options={[
                      { value: "SLAB", label: "Slab" },
                      { value: "BLOCK", label: "Block" },
                      { value: "TILE", label: "Tile" },
                    ]}
                    error={errors.form?.message}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormSelect
                    name="color"
                    label="Color"
                    value={watch("color") || ""}
                    onValueChange={(v) => setValue("color", v as "WHITE" | "BLACK" | "GREY" | "BEIGE" | "BROWN" | "GREEN" | "BLUE" | "PINK" | "RED" | "YELLOW" | "MULTI")}
                    options={[
                      { value: "WHITE", label: "White" },
                      { value: "BLACK", label: "Black" },
                      { value: "GREY", label: "Grey" },
                      { value: "BEIGE", label: "Beige" },
                      { value: "BROWN", label: "Brown" },
                      { value: "GREEN", label: "Green" },
                      { value: "BLUE", label: "Blue" },
                      { value: "PINK", label: "Pink" },
                      { value: "RED", label: "Red" },
                      { value: "YELLOW", label: "Yellow" },
                      { value: "MULTI", label: "Multi-color" },
                    ]}
                    error={errors.color?.message}
                  />

                  <FormInput
                    {...register("finish")}
                    name="finish"
                    label="Finish"
                    placeholder="e.g., Polished"
                    error={errors.finish?.message}
                  />

                  <FormSelect
                    name="quality"
                    label="Quality"
                    value={watch("quality") || "NORMAL"}
                    onValueChange={(v) => setValue("quality", v as "NORMAL" | "CRACKED" | "DAMAGED")}
                    options={[
                      { value: "NORMAL", label: "Normal" },
                      { value: "CRACKED", label: "Cracked" },
                      { value: "DAMAGED", label: "Damaged" },
                    ]}
                    error={errors.quality?.message}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormInput
                    {...register("length")}
                    name="length"
                    label="Length (ft)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.length?.message}
                  />
                  <FormInput
                    {...register("height")}
                    name="height"
                    label="Height (ft)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.height?.message}
                  />
                  <FormInput
                    {...register("thickness")}
                    name="thickness"
                    label="Thickness (mm)"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    error={errors.thickness?.message}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FormInput
                      {...register("totalSqft")}
                      name="totalSqft"
                      label="Total Sqft"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      error={errors.totalSqft?.message}
                      readOnly={!!(length && height && length > 0 && height > 0)}
                      className={length && height && length > 0 && height > 0 ? "bg-bg-app" : ""}
                    />
                    {length && height && length > 0 && height > 0 && (
                      <p className="text-xs text-text-muted mt-1">
                        Auto-calculated: {length} × {height} = {(length * height).toFixed(2)} sqft
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Source */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing & Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    {...register("buyPrice")}
                    name="buyPrice"
                    label="Buy Price (₹/sqft)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.buyPrice?.message}
                  />
                  <FormInput
                    {...register("sellPrice")}
                    name="sellPrice"
                    label="Sell Price (₹/sqft)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.sellPrice?.message}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    {...register("supplier")}
                    name="supplier"
                    label="Supplier"
                    placeholder="Supplier name"
                    error={errors.supplier?.message}
                  />
                  <FormInput
                    {...register("lotNumber")}
                    name="lotNumber"
                    label="Lot Number"
                    placeholder="e.g., LOT-2024-001"
                    error={errors.lotNumber?.message}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormTextarea
                  {...register("description")}
                  name="description"
                  label="Description"
                  placeholder="Any additional notes about this item..."
                  error={errors.description?.message}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
