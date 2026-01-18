"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { config } from "@/config";
import { useAuth } from "@/lib/auth";
import type { Store } from "@/types";

interface StoreContextValue {
  /** Currently selected store */
  currentStore: Store | null;
  /** All available stores for the user */
  availableStores: Store[];
  /** Whether stores are loading */
  isLoading: boolean;
  /** Switch to a different store */
  switchStore: (storeId: string) => void;
  /** Whether user can switch stores (OWNER/MANAGER only) */
  canSwitchStores: boolean;
}

const StoreContext = React.createContext<StoreContextValue | undefined>(
  undefined
);

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Current store ID from localStorage
  const [currentStoreId, setCurrentStoreId] = React.useState<string | null>(
    () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(config.storage.storeKey);
    }
  );

  // Fetch available stores
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const response = await api.get<Store[]>("/stores");
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine if user can switch stores
  const canSwitchStores =
    !!user && (user.role === "OWNER" || user.role === "MANAGER");

  // Get current store object
  const currentStore = React.useMemo(() => {
    if (!currentStoreId) return stores[0] || null;
    return stores.find((s) => s.id === currentStoreId) || stores[0] || null;
  }, [currentStoreId, stores]);

  // Set default store when stores load
  React.useEffect(() => {
    if (stores.length > 0 && !currentStoreId) {
      // Use user's assigned store or first available
      const defaultStore = user?.storeId
        ? stores.find((s) => s.id === user.storeId)
        : stores[0];

      if (defaultStore) {
        setCurrentStoreId(defaultStore.id);
        localStorage.setItem(config.storage.storeKey, defaultStore.id);
      }
    }
  }, [stores, currentStoreId, user?.storeId]);

  // Switch store
  const switchStore = React.useCallback(
    (storeId: string) => {
      if (!canSwitchStores) return;

      const store = stores.find((s) => s.id === storeId);
      if (!store) return;

      setCurrentStoreId(storeId);
      localStorage.setItem(config.storage.storeKey, storeId);

      // Invalidate store-specific queries
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    [canSwitchStores, stores, queryClient]
  );

  const value: StoreContextValue = {
    currentStore,
    availableStores: stores,
    isLoading,
    switchStore,
    canSwitchStores,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

/**
 * Hook to access store context
 */
export function useStore(): StoreContextValue {
  const context = React.useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
