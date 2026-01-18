import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Wallet,
  Users,
  BarChart3,
  Settings,
  Store,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/types";

/**
 * Navigation item configuration
 */
export interface NavItem {
  /** Route path */
  href: string;
  /** Display label (translation key) */
  labelKey: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Required permission to view this item */
  permission: Permission;
  /** Show badge with count (optional) */
  badgeKey?: string;
}

/**
 * Main navigation items
 * Items are filtered based on user permissions
 */
export const navigationItems: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    permission: "INVENTORY_VIEW", // Everyone with basic access sees dashboard
  },
  {
    href: "/inventory",
    labelKey: "nav.inventory",
    icon: Package,
    permission: "INVENTORY_VIEW",
  },
  {
    href: "/orders",
    labelKey: "nav.orders",
    icon: ShoppingCart,
    permission: "ORDER_VIEW",
  },
  {
    href: "/invoices",
    labelKey: "nav.invoices",
    icon: FileText,
    permission: "INVOICE_VIEW",
  },
  {
    href: "/payments",
    labelKey: "nav.payments",
    icon: Wallet,
    permission: "PAYMENT_VIEW",
  },
  {
    href: "/parties",
    labelKey: "nav.parties",
    icon: Users,
    permission: "PARTY_VIEW",
  },
  {
    href: "/reports",
    labelKey: "nav.reports",
    icon: BarChart3,
    permission: "REPORTS_VIEW",
  },
];

/**
 * Settings/admin navigation items
 * These appear in a separate section or dropdown
 */
export const adminNavItems: NavItem[] = [
  {
    href: "/users",
    labelKey: "nav.users",
    icon: UserCog,
    permission: "USER_MANAGE",
  },
  {
    href: "/stores",
    labelKey: "nav.stores",
    icon: Store,
    permission: "STORE_MANAGE",
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
    permission: "SETTINGS_MANAGE",
  },
];

/**
 * App metadata for branding
 */
export const appMeta = {
  name: "MarbleOps",
  tagline: "Stone Business Operations",
} as const;
