"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useRecordPayment, useParties, useInvoices } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput, FormTextarea, FormSelect } from "@/components/forms";

const paymentSchema = z.object({
  partyId: z.string().min(1, "Please select a party"),
  invoiceId: z.string().optional(),
  type: z.enum(["IN", "OUT"]),
  method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordPayment = useRecordPayment();

  const preselectedPartyId = searchParams.get("partyId") || "";
  const preselectedInvoiceId = searchParams.get("invoiceId") || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      partyId: preselectedPartyId,
      invoiceId: preselectedInvoiceId || undefined,
      type: "IN",
      method: "CASH",
    },
  });

  const selectedPartyId = watch("partyId");

  const { data: parties = [] } = useParties();
  const { data: invoices = [] } = useInvoices({
    status: "ISSUED",
  });

  // Filter invoices by selected party
  const partyInvoices = invoices.filter(
    (inv) => inv.partyId === selectedPartyId && inv.dueAmount > 0
  );

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await recordPayment.mutateAsync(data);
      router.push("/payments");
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Record Payment
          </h1>
          <p className="text-sm text-text-muted">
            Record an incoming or outgoing payment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                name="type"
                label="Payment Type"
                value={watch("type")}
                onValueChange={(v) => setValue("type", v as "IN" | "OUT")}
                options={[
                  { value: "IN", label: "Received (Money In)" },
                  { value: "OUT", label: "Paid (Money Out)" },
                ]}
                required
              />

              <FormSelect
                name="method"
                label="Payment Method"
                value={watch("method")}
                onValueChange={(v) =>
                  setValue("method", v as PaymentFormData["method"])
                }
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "BANK_TRANSFER", label: "Bank Transfer" },
                  { value: "UPI", label: "UPI" },
                  { value: "CHEQUE", label: "Cheque" },
                  { value: "OTHER", label: "Other" },
                ]}
                required
              />
            </div>

            <FormSelect
              name="partyId"
              label="Party"
              value={watch("partyId")}
              onValueChange={(v) => setValue("partyId", v)}
              options={parties.map((p) => ({
                value: p.id,
                label: `${p.name}${p.phone ? ` (${p.phone})` : ""}`,
              }))}
              error={errors.partyId?.message}
              required
            />

            {partyInvoices.length > 0 && (
              <FormSelect
                name="invoiceId"
                label="Link to Invoice (Optional)"
                value={watch("invoiceId") || ""}
                onValueChange={(v) =>
                  setValue("invoiceId", v === "none" ? undefined : v)
                }
                options={[
                  { value: "none", label: "No invoice" },
                  ...partyInvoices.map((inv) => ({
                    value: inv.id,
                    label: `${inv.invoiceNumber} - Due: ${formatCurrency(inv.dueAmount)}`,
                  })),
                ]}
              />
            )}

            <FormInput
              {...register("amount")}
              name="amount"
              label="Amount (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              required
            />

            <FormInput
              {...register("reference")}
              name="reference"
              label="Reference / Transaction ID"
              placeholder="e.g., UPI Ref, Cheque No."
              error={errors.reference?.message}
            />

            <FormTextarea
              {...register("notes")}
              name="notes"
              label="Notes"
              placeholder="Additional notes..."
              error={errors.notes?.message}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Record Payment
          </Button>
        </div>
      </form>
    </div>
  );
}
