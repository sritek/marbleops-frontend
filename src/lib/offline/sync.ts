/**
 * Offline sync utilities
 */

import { api, isApiError } from "@/lib/api";
import {
  getPendingMutations,
  deletePendingMutation,
  type PendingMutation,
} from "./db";

let isSyncing = false;

/**
 * Check if the app is online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Sync pending mutations to the server
 */
export async function syncPendingMutations(): Promise<{
  synced: number;
  failed: number;
}> {
  if (isSyncing || !isOnline()) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const mutations = await getPendingMutations();

    for (const mutation of mutations) {
      try {
        await syncMutation(mutation);
        if (mutation.id) {
          await deletePendingMutation(mutation.id);
        }
        synced++;
      } catch (error) {
        console.error("Failed to sync mutation:", mutation, error);
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

/**
 * Sync a single mutation
 */
async function syncMutation(mutation: PendingMutation): Promise<void> {
  switch (mutation.method) {
    case "POST":
      await api.post(mutation.endpoint, mutation.body);
      break;
    case "PUT":
      await api.put(mutation.endpoint, mutation.body);
      break;
    case "DELETE":
      await api.delete(mutation.endpoint);
      break;
  }
}

/**
 * Setup online/offline listeners
 */
export function setupSyncListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = async () => {
    console.log("[Sync] Back online, syncing pending mutations...");
    onOnline?.();
    const result = await syncPendingMutations();
    console.log(`[Sync] Synced ${result.synced}, failed ${result.failed}`);
  };

  const handleOffline = () => {
    console.log("[Sync] Gone offline");
    onOffline?.();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Initial sync if online
  if (isOnline()) {
    syncPendingMutations().catch(console.error);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
