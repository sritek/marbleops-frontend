"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { navigationItems, adminNavItems, appMeta } from "@/config/navigation";
import type { NavItem } from "@/config/navigation";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile navigation drawer
 */
export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  // Filter navigation items based on permissions
  const visibleNavItems = navigationItems.filter((item) =>
    hasPermission(item.permission)
  );

  const visibleAdminItems = adminNavItems.filter((item) =>
    hasPermission(item.permission)
  );

  // Simple English labels
  const labels: Record<string, string> = {
    "nav.dashboard": "Dashboard",
    "nav.inventory": "Inventory",
    "nav.orders": "Orders",
    "nav.invoices": "Invoices",
    "nav.payments": "Payments",
    "nav.parties": "Parties",
    "nav.reports": "Reports",
    "nav.users": "Users",
    "nav.stores": "Stores",
    "nav.settings": "Settings",
  };

  // Close on path change
  React.useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-bg-surface shadow-xl lg:hidden",
          "transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">
              {appMeta.name}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-100 text-primary-700"
                        : "text-text-muted hover:bg-bg-muted hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{labels[item.labelKey] || item.labelKey}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Admin section */}
          {visibleAdminItems.length > 0 && (
            <>
              <div className="my-4 h-px bg-border-subtle" />
              <p className="px-3 mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                Settings
              </p>
              <ul className="space-y-1">
                {visibleAdminItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary-100 text-primary-700"
                            : "text-text-muted hover:bg-bg-muted hover:text-text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>{labels[item.labelKey] || item.labelKey}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
