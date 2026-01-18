"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useParty, useInvoices, usePayments } from "@/lib/api";
import { usePermission } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import type { PartyType } from "@/types";

const typeVariants: Record<PartyType, "info" | "accent" | "default"> = {
  CUSTOMER: "info",
  SUPPLIER: "accent",
  BOTH: "default",
};

export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canEdit = usePermission("PARTY_EDIT");

  const { data: party, isLoading, error } = useParty(id);

  if (isLoading) {
    return <PageLoader message="Loading party..." />;
  }

  if (error || !party) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-muted mb-4">Party not found</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const balanceColor =
    party.currentBalance >= 0 ? "text-success" : "text-error";

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
              {party.name}
            </h1>
            <Badge variant={typeVariants[party.type]}>{party.type}</Badge>
            <Badge variant={party.isActive ? "success" : "default"}>
              {party.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-text-muted">
            Customer since {formatDate(party.createdAt)}
          </p>
        </div>
        {canEdit && (
          <Button variant="secondary" asChild>
            <Link href={`/parties/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-muted">
                  <User className="h-5 w-5 text-text-muted" />
                </div>
                <div>
                  <p className="font-medium">{party.name}</p>
                  <p className="text-sm text-text-muted">{party.type}</p>
                </div>
              </div>

              {party.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <span>{party.phone}</span>
                </div>
              )}

              {party.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-text-muted" />
                  <span>{party.email}</span>
                </div>
              )}

              {party.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-text-muted mt-0.5" />
                  <span>{party.address}</span>
                </div>
              )}

              {party.gstNumber && (
                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-xs text-text-muted">GST Number</p>
                  <p className="font-mono">{party.gstNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Opening Balance</span>
                <span>{formatCurrency(party.openingBalance)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Current Balance</span>
                <span className={balanceColor}>
                  {formatCurrency(party.currentBalance)}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {party.currentBalance >= 0
                  ? "Party owes you this amount"
                  : "You owe party this amount"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ledger / Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transaction History</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/invoices?partyId=${id}`}>
                    <FileText className="h-4 w-4 mr-1" />
                    Invoices
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/payments?partyId=${id}`}>
                    <Wallet className="h-4 w-4 mr-1" />
                    Payments
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PartyLedger partyId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Ledger component showing combined invoices and payments
function PartyLedger({ partyId }: { partyId: string }) {
  // This would ideally fetch a dedicated ledger endpoint
  // For now, we'll show a placeholder
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-text-muted">
        <p>Transaction ledger will be displayed here</p>
        <p className="text-sm">
          View invoices and payments to see full history
        </p>
      </div>
    </div>
  );
}
