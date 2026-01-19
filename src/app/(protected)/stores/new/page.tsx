"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateStore } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required").max(100),
  address: z.string().max(255).optional(),
  phone: z.string().min(10).max(15).optional().or(z.literal("")),
});

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

export default function NewStorePage() {
  const router = useRouter();
  const canManage = usePermission("STORE_MANAGE");
  const t = useTranslations("stores");
  const tCommon = useTranslations("common");

  const createStore = useCreateStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema) as any,
  });

  const onSubmit = async (data: CreateStoreFormData) => {
    try {
      await createStore.mutateAsync({
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
      });
      router.push("/stores");
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
          <Link href="/stores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("createStore")}</h1>
          <p className="text-sm text-text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("storeDetails")}</CardTitle>
          <CardDescription>
            Add a new store location for your business.
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

            <div className="flex gap-4 pt-4">
              <Button type="submit" isLoading={createStore.isPending}>
                {t("createStore")}
              </Button>
              <Button type="button" variant="secondary" asChild>
                <Link href="/stores">{tCommon("cancel")}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
