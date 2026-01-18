"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { navigationItems, adminNavItems, appMeta } from "@/config/navigation";
import type { NavItem } from "@/config/navigation";
import { StoreSwitcher } from "./store-switcher";

/**
 * Sidebar navigation for desktop
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  // Filter navigation items based on permissions
  const visibleNavItems = navigationItems.filter((item) =>
    hasPermission(item.permission)
  );

  const visibleAdminItems = adminNavItems.filter((item) =>
    hasPermission(item.permission)
  );

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-sidebar lg:fixed lg:inset-y-0 lg:border-r lg:border-border-subtle lg:bg-bg-surface"
      data-sidebar
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-border-subtle">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">
              {appMeta.name}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => (
            <NavItemLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>

        {/* Admin section */}
        {visibleAdminItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="px-3 mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
              Settings
            </p>
            <ul className="space-y-1">
              {visibleAdminItems.map((item) => (
                <NavItemLink key={item.href} item={item} pathname={pathname} />
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Store switcher at bottom */}
      <div className="border-t border-border-subtle p-3">
        <StoreSwitcher />
      </div>
    </aside>
  );
}

/**
 * Individual nav item
 */
function NavItemLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  // Simple English labels (will be replaced with translations)
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

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
}

/**
 * Separator component for sidebar
 */
function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border-subtle", className)} />;
}
