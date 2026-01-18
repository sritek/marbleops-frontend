"use client";

import * as React from "react";
import { Store, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/hooks/use-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Store switcher dropdown for OWNER/MANAGER users
 */
export function StoreSwitcher() {
  const { currentStore, availableStores, switchStore, canSwitchStores, isLoading } =
    useStore();

  if (!canSwitchStores || availableStores.length <= 1) {
    // Show current store name without dropdown
    if (currentStore) {
      return (
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <Store className="h-4 w-4 text-text-muted" />
          <span className="truncate max-w-[150px]">{currentStore.name}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-2 px-2"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Store className="h-4 w-4 shrink-0 text-text-muted" />
            <span className="truncate">
              {currentStore?.name || "Select store"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-text-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Store</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableStores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => switchStore(store.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col min-w-0">
              <span className="truncate">{store.name}</span>
              {store.address && (
                <span className="text-xs text-text-muted truncate">
                  {store.address}
                </span>
              )}
            </div>
            {currentStore?.id === store.id && (
              <Check className="h-4 w-4 shrink-0 text-primary-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
