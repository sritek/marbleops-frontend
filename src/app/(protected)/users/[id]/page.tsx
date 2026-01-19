"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Shield, Store, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUser, useUpdateUser, useStores } from "@/lib/api";
import { usePermission, useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Role } from "@/types";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["OWNER", "MANAGER", "ACCOUNTANT", "STAFF"]),
  storeId: z.string().optional(),
  isActive: z.boolean(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const roleVariants: Record<Role, "default" | "warning" | "success" | "info"> = {
  OWNER: "success",
  MANAGER: "warning",
  ACCOUNTANT: "info",
  STAFF: "default",
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();
  const canManage = usePermission("USER_MANAGE");
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const { data: user, isLoading } = useUser(userId);
  const { data: stores = [] } = useStores();
  const updateUser = useUpdateUser(userId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema) as any,
  });

  // Reset form when user data loads
  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.phone,
        password: "",
        role: user.role,
        storeId: user.storeId || undefined,
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const selectedRole = watch("role");
  const isActive = watch("isActive");
  const isSelf = currentUser?.id === userId;

  // Reset storeId when role changes to OWNER
  React.useEffect(() => {
    if (selectedRole === "OWNER") {
      setValue("storeId", undefined);
    }
  }, [selectedRole, setValue]);

  const onSubmit = async (data: UpdateUserFormData) => {
    try {
      await updateUser.mutateAsync({
        name: data.name,
        phone: data.phone,
        password: data.password || undefined,
        role: data.role,
        storeId: data.role === "OWNER" ? undefined : data.storeId,
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

  if (!user) {
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
            <Link href="/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-text-primary">{user.name}</h1>
              <Badge variant={roleVariants[user.role]}>
                {t(`roles.${user.role.toLowerCase()}`)}
              </Badge>
              {!user.isActive && (
                <Badge variant="default">{tCommon("inactive")}</Badge>
              )}
            </div>
            <p className="text-sm text-text-muted">{user.phone}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info Cards */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("role")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={roleVariants[user.role]} className="text-sm">
                {t(`roles.${user.role.toLowerCase()}`)}
              </Badge>
              <p className="text-sm text-text-muted mt-2">
                {t(`roleDescriptions.${user.role.toLowerCase()}`)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4" />
                {t("assignedStore")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {user.storeName || t("noStoreAssigned")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {tCommon("createdAt")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("editUser")}</CardTitle>
            <CardDescription>
              {isSelf && t("cannotChangeRole")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput
                {...register("name")}
                name="name"
                label={tCommon("name")}
                placeholder="Enter full name"
                error={errors.name?.message}
                required
              />

              <FormInput
                {...register("phone")}
                name="phone"
                label={tAuth("phone")}
                type="tel"
                placeholder="Enter phone number"
                error={errors.phone?.message}
                required
              />

              <div>
                <FormInput
                  {...register("password")}
                  name="password"
                  label={tAuth("password")}
                  type="password"
                  placeholder="Enter new password"
                  error={errors.password?.message}
                />
                <p className="text-xs text-text-muted mt-1">{t("passwordHelp")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">
                  {t("role")} <span className="text-error">*</span>
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue("role", value as Role, { shouldDirty: true })}
                  disabled={isSelf}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("role")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">{t("roles.owner")}</SelectItem>
                    <SelectItem value="MANAGER">{t("roles.manager")}</SelectItem>
                    <SelectItem value="ACCOUNTANT">{t("roles.accountant")}</SelectItem>
                    <SelectItem value="STAFF">{t("roles.staff")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole !== "OWNER" && (
                <div className="space-y-2">
                  <Label htmlFor="storeId">
                    {t("assignedStore")}
                    {selectedRole === "STAFF" && <span className="text-error"> *</span>}
                  </Label>
                  <Select
                    value={watch("storeId") || ""}
                    onValueChange={(value) => setValue("storeId", value || undefined, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("store")} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRole !== "STAFF" && (
                        <SelectItem value="">{t("allStores")}</SelectItem>
                      )}
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>{tCommon("status")}</Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(value) => setValue("isActive", value === "active", { shouldDirty: true })}
                  disabled={isSelf}
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
                  isLoading={updateUser.isPending}
                  disabled={!isDirty}
                >
                  {tCommon("saveChanges")}
                </Button>
                <Button type="button" variant="secondary" asChild>
                  <Link href="/users">{tCommon("cancel")}</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
