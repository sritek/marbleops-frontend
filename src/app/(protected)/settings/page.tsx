"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  Bell,
  Palette,
  Save,
} from "lucide-react";
import { usePermission, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BusinessInfoForm {
  businessName: string;
  gstNumber: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
}

interface InvoiceSettingsForm {
  invoicePrefix: string;
  invoiceTerms: string;
  defaultNotes: string;
}

interface NotificationSettingsForm {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  paymentReminders: boolean;
}

export default function SettingsPage() {
  const canManage = usePermission("SETTINGS_MANAGE");
  const { user } = useAuth();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  // Business Info Form
  const businessForm = useForm<BusinessInfoForm>({
    defaultValues: {
      businessName: "MarbleOps Business",
      gstNumber: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
    },
  });

  // Invoice Settings Form
  const invoiceForm = useForm<InvoiceSettingsForm>({
    defaultValues: {
      invoicePrefix: "INV",
      invoiceTerms: "Payment due within 30 days",
      defaultNotes: "Thank you for your business!",
    },
  });

  // Notification Settings
  const [notifications, setNotifications] = React.useState<NotificationSettingsForm>({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    paymentReminders: true,
  });

  const handleBusinessSubmit = async (data: BusinessInfoForm) => {
    // TODO: Implement API call
    toast.success(t("saveSuccess"));
  };

  const handleInvoiceSubmit = async (data: InvoiceSettingsForm) => {
    // TODO: Implement API call
    toast.success(t("saveSuccess"));
  };

  const handleNotificationToggle = (key: keyof NotificationSettingsForm) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success(t("saveSuccess"));
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">You don't have permission to access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
        <p className="text-sm text-text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Building2 className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-base">{t("businessInfo")}</CardTitle>
                <CardDescription>{t("businessInfoDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-4">
              <FormInput
                {...businessForm.register("businessName")}
                name="businessName"
                label={t("businessName")}
                placeholder="Enter business name"
              />
              <FormInput
                {...businessForm.register("gstNumber")}
                name="gstNumber"
                label={t("gstNumber")}
                placeholder="Enter GST number"
              />
              <div className="space-y-2">
                <Label htmlFor="businessAddress">{t("businessAddress")}</Label>
                <Textarea
                  {...businessForm.register("businessAddress")}
                  id="businessAddress"
                  placeholder="Enter business address"
                  rows={2}
                />
              </div>
              <FormInput
                {...businessForm.register("businessPhone")}
                name="businessPhone"
                label={t("businessPhone")}
                type="tel"
                placeholder="Enter phone"
              />
              <FormInput
                {...businessForm.register("businessEmail")}
                name="businessEmail"
                label={t("businessEmail")}
                type="email"
                placeholder="Enter email"
              />
              <Button type="submit" size="sm">
                <Save className="h-4 w-4 mr-2" />
                {tCommon("save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-base">{t("invoiceSettings")}</CardTitle>
                <CardDescription>{t("invoiceSettingsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={invoiceForm.handleSubmit(handleInvoiceSubmit)} className="space-y-4">
              <FormInput
                {...invoiceForm.register("invoicePrefix")}
                name="invoicePrefix"
                label={t("invoicePrefix")}
                placeholder="INV"
              />
              <FormInput
                {...invoiceForm.register("invoiceTerms")}
                name="invoiceTerms"
                label={t("invoiceTerms")}
                placeholder="Payment terms"
              />
              <div className="space-y-2">
                <Label htmlFor="defaultNotes">{t("defaultNotes")}</Label>
                <Textarea
                  {...invoiceForm.register("defaultNotes")}
                  id="defaultNotes"
                  placeholder="Default invoice notes"
                  rows={3}
                />
              </div>
              <Button type="submit" size="sm">
                <Save className="h-4 w-4 mr-2" />
                {tCommon("save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Bell className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-base">{t("notificationSettings")}</CardTitle>
                <CardDescription>{t("notificationSettingsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t("emailNotifications")}</p>
                <p className="text-xs text-text-muted">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={() => handleNotificationToggle("emailNotifications")}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t("smsNotifications")}</p>
                <p className="text-xs text-text-muted">Receive notifications via SMS</p>
              </div>
              <Switch
                checked={notifications.smsNotifications}
                onCheckedChange={() => handleNotificationToggle("smsNotifications")}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t("lowStockAlerts")}</p>
                <p className="text-xs text-text-muted">Get alerts when stock is low</p>
              </div>
              <Switch
                checked={notifications.lowStockAlerts}
                onCheckedChange={() => handleNotificationToggle("lowStockAlerts")}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t("paymentReminders")}</p>
                <p className="text-xs text-text-muted">Send payment reminders to customers</p>
              </div>
              <Switch
                checked={notifications.paymentReminders}
                onCheckedChange={() => handleNotificationToggle("paymentReminders")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Palette className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-base">{t("appearanceSettings")}</CardTitle>
                <CardDescription>{t("appearanceSettingsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border-subtle p-4 text-center">
              <p className="text-sm text-text-muted">
                Theme and language preferences can be changed from the header menu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
