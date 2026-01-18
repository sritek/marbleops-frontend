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
  Download,
} from "lucide-react";
import { usePermission } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reports = [
  {
    id: "sales",
    title: "Sales Report",
    description: "View sales summary, trends, and top customers",
    icon: TrendingUp,
    href: "/reports/sales",
  },
  {
    id: "stock",
    title: "Stock Report",
    description: "Inventory valuation and stock levels",
    icon: Package,
    href: "/reports/stock",
  },
  {
    id: "party-ledger",
    title: "Party Ledger",
    description: "Transaction history by customer/supplier",
    icon: Users,
    href: "/reports/party-ledger",
  },
  {
    id: "invoices",
    title: "Invoice Report",
    description: "Invoice summary and aging analysis",
    icon: FileText,
    href: "/reports/invoices",
  },
  {
    id: "payments",
    title: "Payment Report",
    description: "Payment collection by method and date",
    icon: Wallet,
    href: "/reports/payments",
  },
];

export default function ReportsPage() {
  const canViewReports = usePermission("REPORTS_VIEW");

  if (!canViewReports) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted">
          You don't have permission to view reports
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Reports</h1>
          <p className="text-sm text-text-muted">
            View and export business reports
          </p>
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
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {report.description}
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
          <CardTitle className="text-base">Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-muted">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p>Select a report above to view detailed analytics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
