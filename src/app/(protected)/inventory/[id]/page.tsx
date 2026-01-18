"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Ruler,
  DollarSign,
  Calendar,
  Tag,
  User,
  History,
} from "lucide-react";
import { useInventoryItem } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDimensions, formatSqft, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import type { InventoryStatus } from "@/types";

const statusVariants: Record<InventoryStatus, "success" | "warning" | "default"> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "default",
};

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canEdit = usePermission("INVENTORY_EDIT");

  const { data: item, isLoading, error } = useInventoryItem(id);

  if (isLoading) {
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

  const displayName = item.stoneName || item.name || "Unnamed Item";

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
              {displayName}
            </h1>
            <Badge variant={statusVariants[item.status]}>{item.status}</Badge>
          </div>
          <p className="text-sm text-text-muted">
            {item.materialType && `${item.materialType} • `}
            {item.form && `${item.form} • `}
            {item.lotNumber && `Lot: ${item.lotNumber}`}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" asChild>
              <Link href={`/inventory/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Photos */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              {item.photos && item.photos.length > 0 ? (
                <div className="grid gap-2">
                  {item.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`${displayName} ${idx + 1}`}
                      className="rounded-lg object-cover w-full aspect-[4/3]"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-bg-muted rounded-lg">
                  <Package className="h-12 w-12 text-text-muted" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow
                  icon={Tag}
                  label="Material Type"
                  value={item.materialType || "—"}
                />
                <DetailRow icon={Package} label="Form" value={item.form || "—"} />
                <DetailRow icon={Tag} label="Finish" value={item.finish || "—"} />
                <DetailRow
                  icon={Tag}
                  label="Quality"
                  value={item.quality || "—"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dimensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow
                  icon={Ruler}
                  label="Dimensions (L×H×T)"
                  value={formatDimensions(item.length, item.height, item.thickness)}
                />
                <DetailRow
                  icon={Ruler}
                  label="Total Sqft"
                  value={
                    item.totalSqft !== null ? formatSqft(item.totalSqft) : "—"
                  }
                />
                <DetailRow
                  icon={Ruler}
                  label="Available Sqft"
                  value={
                    item.availableSqft !== null
                      ? formatSqft(item.availableSqft)
                      : "—"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow
                  icon={DollarSign}
                  label="Buy Price"
                  value={
                    item.buyPrice !== null
                      ? `${formatCurrency(item.buyPrice)}/sqft`
                      : "—"
                  }
                />
                <DetailRow
                  icon={DollarSign}
                  label="Sell Price"
                  value={
                    item.sellPrice !== null
                      ? `${formatCurrency(item.sellPrice)}/sqft`
                      : "—"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Other Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Other Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow icon={User} label="Supplier" value={item.supplier || "—"} />
                <DetailRow icon={Tag} label="Lot Number" value={item.lotNumber || "—"} />
                <DetailRow
                  icon={Calendar}
                  label="Added On"
                  value={formatDate(item.createdAt)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Last Updated"
                  value={formatDate(item.updatedAt)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-muted shrink-0">
        <Icon className="h-4 w-4 text-text-muted" />
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
