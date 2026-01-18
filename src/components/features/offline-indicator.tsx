"use client";

import * as React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOnline, setupSyncListeners, syncPendingMutations } from "@/lib/offline";

/**
 * Offline indicator banner
 * Shows when the app is offline and syncs pending changes when back online
 */
export function OfflineIndicator() {
  const [online, setOnline] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    // Initial state
    setOnline(isOnline());

    // Setup listeners
    const cleanup = setupSyncListeners(
      () => setOnline(true),
      () => setOnline(false)
    );

    return cleanup;
  }, []);

  const handleSync = async () => {
    if (syncing || !online) return;
    setSyncing(true);
    try {
      await syncPendingMutations();
      setPendingCount(0);
    } catch (error) {
      console.error("Manual sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto",
        "z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
        online ? "bg-warning text-white" : "bg-error text-white"
      )}
    >
      {!online ? (
        <>
          <WifiOff className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">You're offline</p>
            <p className="text-sm opacity-90">
              Changes will sync when you're back online
            </p>
          </div>
        </>
      ) : (
        <>
          <RefreshCw
            className={cn("h-5 w-5 shrink-0", syncing && "animate-spin")}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              {syncing ? "Syncing..." : `${pendingCount} pending changes`}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm font-medium underline"
          >
            Sync now
          </button>
        </>
      )}
    </div>
  );
}
