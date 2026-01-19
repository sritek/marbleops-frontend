"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { User, Shield, Store, Calendar, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, isApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/types";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const roleVariants: Record<Role, "default" | "warning" | "success" | "info"> = {
  OWNER: "success",
  MANAGER: "warning",
  ACCOUNTANT: "info",
  STAFF: "default",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("users");
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema) as any,
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t("passwordChanged"));
      reset();
    } catch (error) {
      const message = isApiError(error) ? error.message : t("passwordChangeFailed");
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
        <p className="text-sm text-text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info Cards */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 mb-4">
                  <span className="text-3xl font-bold text-primary-600">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-text-primary">{user.name}</h2>
                <p className="text-sm text-text-muted">{user.phone}</p>
                <Badge variant={roleVariants[user.role]} className="mt-2">
                  {tUsers(`roles.${user.role.toLowerCase()}`)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Role Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("yourRole")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={roleVariants[user.role]} className="mb-2">
                {tUsers(`roles.${user.role.toLowerCase()}`)}
              </Badge>
              <p className="text-sm text-text-muted">
                {tUsers(`roleDescriptions.${user.role.toLowerCase()}`)}
              </p>
              <p className="text-xs text-text-muted mt-3 border-t border-border-subtle pt-3">
                {t("cannotChangeRole")}
              </p>
            </CardContent>
          </Card>

          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4" />
                {t("yourStore")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {user.storeName || tUsers("allStores")}
              </p>
            </CardContent>
          </Card>

          {/* Member Since */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("memberSince")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{t("personalInfo")}</CardTitle>
                  <CardDescription>{t("personalInfoDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-text-muted">{tCommon("name")}</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">{tCommon("phone")}</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">{t("yourRole")}</p>
                  <p className="font-medium">{tUsers(`roles.${user.role.toLowerCase()}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">{t("yourStore")}</p>
                  <p className="font-medium">{user.storeName || tUsers("allStores")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <Lock className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{t("changePassword")}</CardTitle>
                  <CardDescription>{t("changePasswordDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <FormInput
                  {...register("currentPassword")}
                  name="currentPassword"
                  label={t("currentPassword")}
                  type="password"
                  placeholder="Enter current password"
                  error={errors.currentPassword?.message}
                  required
                />
                <FormInput
                  {...register("newPassword")}
                  name="newPassword"
                  label={t("newPassword")}
                  type="password"
                  placeholder="Enter new password"
                  error={errors.newPassword?.message}
                  required
                />
                <FormInput
                  {...register("confirmPassword")}
                  name="confirmPassword"
                  label={t("confirmPassword")}
                  type="password"
                  placeholder="Confirm new password"
                  error={errors.confirmPassword?.message}
                  required
                />
                <Button type="submit" isLoading={isChangingPassword}>
                  {t("changePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
