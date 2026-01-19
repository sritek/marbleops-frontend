"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateUser, useStores } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Role } from "@/types";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["OWNER", "MANAGER", "ACCOUNTANT", "STAFF"]),
  storeId: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const canManage = usePermission("USER_MANAGE");
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const { data: stores = [] } = useStores();
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: {
      role: "STAFF",
    },
  });

  const selectedRole = watch("role");

  // Reset storeId when role changes to OWNER
  React.useEffect(() => {
    if (selectedRole === "OWNER") {
      setValue("storeId", undefined);
    }
  }, [selectedRole, setValue]);

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      await createUser.mutateAsync({
        ...data,
        storeId: data.role === "OWNER" ? undefined : data.storeId,
      });
      router.push("/users");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("createUser")}</h1>
          <p className="text-sm text-text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("userDetails")}</CardTitle>
          <CardDescription>
            {t("roleDescriptions." + selectedRole.toLowerCase())}
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

            <FormInput
              {...register("password")}
              name="password"
              label={tAuth("password")}
              type="password"
              placeholder="Enter password"
              error={errors.password?.message}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="role">
                {t("role")} <span className="text-error">*</span>
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue("role", value as Role)}
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
              {errors.role && (
                <p className="text-sm text-error">{errors.role.message}</p>
              )}
            </div>

            {selectedRole !== "OWNER" && (
              <div className="space-y-2">
                <Label htmlFor="storeId">
                  {t("assignedStore")}
                  {selectedRole === "STAFF" && <span className="text-error"> *</span>}
                </Label>
                <Select
                  value={watch("storeId") || ""}
                  onValueChange={(value) => setValue("storeId", value || undefined)}
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
                {errors.storeId && (
                  <p className="text-sm text-error">{errors.storeId.message}</p>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" isLoading={createUser.isPending}>
                {t("createUser")}
              </Button>
              <Button type="button" variant="secondary" asChild>
                <Link href="/users">{tCommon("cancel")}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
