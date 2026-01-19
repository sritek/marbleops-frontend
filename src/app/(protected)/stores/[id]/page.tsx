"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MapPin, Phone, Calendar, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore, useUpdateStore, useUsers } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/types";

const updateStoreSchema = z.object({
  name: z.string().min(1, "Store name is required").max(100),
  address: z.string().max(255).optional(),
  phone: z.string().min(10).max(15).optional().or(z.literal("")),
  isActive: z.boolean(),
});

type UpdateStoreFormData = z.infer<typeof updateStoreSchema>;

const roleVariants: Record<Role, "default" | "warning" | "success" | "info"> = {
  OWNER: "success",
  MANAGER: "warning",
  ACCOUNTANT: "info",
  STAFF: "default",
};

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const canManage = usePermission("STORE_MANAGE");
  const t = useTranslations("stores");
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("users");

  const { data: store, isLoading } = useStore(storeId);
  const { data: users = [] } = useUsers({ storeId });
  const updateStore = useUpdateStore(storeId);

  // Filter users assigned to this store
  const assignedUsers = React.useMemo(() => {
    return users.filter((user) => user.storeId === storeId);
  }, [users, storeId]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateStoreFormData>({
    resolver: zodResolver(updateStoreSchema) as any,
  });

  // Reset form when store data loads
  React.useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        address: store.address || "",
        phone: store.phone || "",
        isActive: store.isActive,
      });
    }
  }, [store, reset]);

  const isActive = watch("isActive");

  const onSubmit = async (data: UpdateStoreFormData) => {
    try {
      await updateStore.mutateAsync({
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        isActive: data.isActive,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{t("noPermission")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{tCommon("noResults")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/stores">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-text-primary">{store.name}</h1>
              {!store.isActive && (
                <Badge variant="default">{tCommon("inactive")}</Badge>
              )}
            </div>
            {store.address && (
              <p className="text-sm text-text-muted flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {store.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Store Info Cards */}
        <div className="space-y-6">
          {store.phone && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("storePhone")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{store.phone}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {tCommon("createdAt")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{formatDate(store.createdAt)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("assignedUsers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedUsers.length > 0 ? (
                <div className="space-y-3">
                  {assignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-text-muted">{user.phone}</p>
                      </div>
                      <Badge variant={roleVariants[user.role]} className="text-xs">
                        {tUsers(`roles.${user.role.toLowerCase()}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">{t("noAssignedUsers")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("editStore")}</CardTitle>
            <CardDescription>
              Update store information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput
                {...register("name")}
                name="name"
                label={t("storeName")}
                placeholder="Enter store name"
                error={errors.name?.message}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="address">{t("storeAddress")}</Label>
                <Textarea
                  {...register("address")}
                  id="address"
                  placeholder="Enter store address"
                  rows={3}
                />
                {errors.address && (
                  <p className="text-sm text-error">{errors.address.message}</p>
                )}
              </div>

              <FormInput
                {...register("phone")}
                name="phone"
                label={t("storePhone")}
                type="tel"
                placeholder="Enter store phone"
                error={errors.phone?.message}
              />

              <div className="space-y-2">
                <Label>{tCommon("status")}</Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(value) => setValue("isActive", value === "active", { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{tCommon("active")}</SelectItem>
                    <SelectItem value="inactive">{tCommon("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  isLoading={updateStore.isPending}
                  disabled={!isDirty}
                >
                  {tCommon("saveChanges")}
                </Button>
                <Button type="button" variant="secondary" asChild>
                  <Link href="/stores">{tCommon("cancel")}</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
