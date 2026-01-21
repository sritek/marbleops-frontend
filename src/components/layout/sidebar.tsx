"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
      className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 lg:border-r lg:border-border-subtle lg:bg-bg-surface"
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
          <AdminSection items={visibleAdminItems} pathname={pathname} />
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
  const t = useTranslations("nav");
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  // Extract the key from "nav.dashboard" -> "dashboard"
  const translationKey = item.labelKey.replace("nav.", "");

  // Coming soon items are disabled
  if (item.comingSoon) {
    return (
      <li>
        <div
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
            "text-text-muted opacity-60 cursor-not-allowed select-none"
          )}
        >
          <div className="absolute inset-0 rounded-lg bg-bg-app/50 backdrop-blur-[1px]" />
          <Icon className="h-5 w-5 shrink-0 relative z-10" aria-hidden="true" />
          <span className="relative z-10">{t(translationKey)}</span>
          <span className="relative z-10 ml-auto text-[10px] font-medium text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
            {t("comingSoon")}
          </span>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary-100 text-primary-700"
            : "text-text-muted hover:bg-bg-app hover:text-text-primary"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{t(translationKey)}</span>
      </Link>
    </li>
  );
}

/**
 * Admin section with settings header
 */
function AdminSection({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const t = useTranslations("nav");
  
  return (
    <>
      <Separator className="my-4" />
      <p className="px-3 mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
        {t("settings")}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <NavItemLink key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </>
  );
}

/**
 * Separator component for sidebar
 */
function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border-subtle", className)} />;
}
