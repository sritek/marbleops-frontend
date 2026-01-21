"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("nav");

  // Filter navigation items based on permissions
  const visibleNavItems = navigationItems.filter((item) =>
    hasPermission(item.permission)
  );

  const visibleAdminItems = adminNavItems.filter((item) =>
    hasPermission(item.permission)
  );

  // Close on path change
  React.useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]);

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
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
        aria-hidden={!isOpen}
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
              const translationKey = item.labelKey.replace("nav.", "");

              // Coming soon items are disabled
              if (item.comingSoon) {
                return (
                  <li key={item.href}>
                    <div
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
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
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
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
            })}
          </ul>

          {/* Admin section */}
          {visibleAdminItems.length > 0 && (
            <>
              <div className="my-4 h-px bg-border-subtle" />
              <p className="px-3 mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                {t("settings")}
              </p>
              <ul className="space-y-1">
                {visibleAdminItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const translationKey = item.labelKey.replace("nav.", "");

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
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
                })}
              </ul>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
