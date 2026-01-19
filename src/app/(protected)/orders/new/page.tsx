"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { useCreateOrder, useParties, useInventoryList } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Party, Inventory } from "@/types";

interface OrderItem {
  inventoryId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  maxQty?: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();

  // State
  const [partyId, setPartyId] = React.useState<string>("");
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [notes, setNotes] = React.useState("");
  const [partySearch, setPartySearch] = React.useState("");
  const [inventorySearch, setInventorySearch] = React.useState("");

  // Fetch parties and inventory
  const { data: parties = [] } = useParties({ search: partySearch });
  const { data: inventory = [] } = useInventoryList({
    search: inventorySearch,
    status: "AVAILABLE",
  });

  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Add item
  const handleAddItem = (inv: Inventory) => {
    const exists = items.find((i) => i.inventoryId === inv.id);
    if (exists) return;

    const newItem: OrderItem = {
      inventoryId: inv.id,
      name: inv.stoneName || inv.name || "Unnamed",
      quantity: 1,
      unitPrice: Number(inv.sellPrice) || 0,
      totalPrice: Number(inv.sellPrice) || 0,
      maxQty: inv.availableSqft ? Math.floor(inv.availableSqft) : undefined,
    };

    setItems([...items, newItem]);
    setInventorySearch("");
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    item.quantity = Math.max(1, quantity);
    item.totalPrice = item.quantity * item.unitPrice;
    setItems(updatedItems);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async () => {
    if (!partyId || items.length === 0) return;

    try {
      await createOrder.mutateAsync({
        partyId,
        items: items.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: notes || undefined,
      });
      router.push("/orders");
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">New Order</h1>
          <p className="text-sm text-text-muted">Create a new customer order</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Select Customer</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search customers..."
                        value={partySearch}
                        onChange={(e) => setPartySearch(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name}
                        {party.phone && ` (${party.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add item search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search inventory to add items..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="pl-9"
                />
                {inventorySearch && inventory.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-border-subtle rounded-lg shadow-lg max-h-60 overflow-auto">
                    {inventory.slice(0, 10).map((inv) => (
                      <button
                        key={inv.id}
                        className="w-full text-left px-4 py-2 hover:bg-bg-app flex items-center justify-between"
                        onClick={() => handleAddItem(inv)}
                      >
                        <div>
                          <p className="font-medium">
                            {inv.stoneName || inv.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {inv.materialType} • {inv.form}
                          </p>
                        </div>
                        <span className="text-sm text-text-muted">
                          {formatCurrency(inv.sellPrice || 0)}/sqft
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items list */}
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.inventoryId}
                      className="flex items-center gap-4 p-3 bg-bg-app rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-text-muted">
                          {formatCurrency(item.unitPrice)}/unit
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${index}`} className="sr-only">
                          Quantity
                        </Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          min={1}
                          max={item.maxQty}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(index, parseInt(e.target.value))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="w-24 text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <p>No items added yet</p>
                  <p className="text-sm">Search inventory above to add items</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes for this order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.inventoryId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-text-muted truncate">
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-subtle pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!partyId || items.length === 0}
                onClick={handleSubmit}
                isLoading={createOrder.isPending}
              >
                Create Order
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
