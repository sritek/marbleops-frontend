"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  FileText,
  Wallet,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsPage() {
  const canViewReports = usePermission("REPORTS_VIEW");
  const t = useTranslations("reports");

  // Define reports with translation keys
  const reports = [
    {
      id: "sales",
      titleKey: "salesReport",
      descKey: "salesReportDesc",
      icon: TrendingUp,
      href: "/reports/sales",
    },
    {
      id: "stock",
      titleKey: "stockReport",
      descKey: "stockReportDesc",
      icon: Package,
      href: "/reports/stock",
    },
    {
      id: "party-ledger",
      titleKey: "partyLedger",
      descKey: "partyLedgerDesc",
      icon: Users,
      href: "/reports/party-ledger",
    },
    {
      id: "invoices",
      titleKey: "invoiceReport",
      descKey: "invoiceReportDesc",
      icon: FileText,
      href: "/reports/invoices",
    },
    {
      id: "payments",
      titleKey: "paymentReport",
      descKey: "paymentReportDesc",
      icon: Wallet,
      href: "/reports/payments",
    },
    {
      id: "orders",
      titleKey: "orderReport",
      descKey: "orderReportDesc",
      icon: ShoppingCart,
      href: "/reports/orders",
    },
  ];

  if (!canViewReports) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
          <p className="text-sm text-text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.id} href={report.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-border-strong cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t(report.titleKey)}</CardTitle>
                      <CardDescription className="text-xs">
                        {t(report.descKey)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("quickOverview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-muted">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p>{t("selectReportAbove")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
