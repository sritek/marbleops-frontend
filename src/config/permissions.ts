import type { Role, Permission } from "@/types";

/**
 * Permission descriptions for UI tooltips
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  TENANT_MANAGE: "Manage tenant settings and configuration",
  STORE_MANAGE: "Create and manage stores",
  USER_MANAGE: "Create users, assign roles and stores",
  INVENTORY_VIEW: "View inventory items and stock levels",
  INVENTORY_EDIT: "Add, edit, and adjust inventory",
  PARTY_VIEW: "View customers and suppliers",
  PARTY_EDIT: "Create and edit customers/suppliers",
  ORDER_VIEW: "View orders",
  ORDER_EDIT: "Create and edit orders",
  INVOICE_VIEW: "View invoices",
  INVOICE_EDIT: "Create and edit invoices",
  PAYMENT_VIEW: "View payment history",
  PAYMENT_RECORD: "Record incoming and outgoing payments",
  REPORTS_VIEW: "View business reports",
  SETTINGS_MANAGE: "Manage application settings",
};

/**
 * Role → Permissions mapping (mirrors backend)
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "TENANT_MANAGE",
    "STORE_MANAGE",
    "USER_MANAGE",
    "INVENTORY_VIEW",
    "INVENTORY_EDIT",
    "PARTY_VIEW",
    "PARTY_EDIT",
    "ORDER_VIEW",
    "ORDER_EDIT",
    "INVOICE_VIEW",
    "INVOICE_EDIT",
    "PAYMENT_VIEW",
    "PAYMENT_RECORD",
    "REPORTS_VIEW",
    "SETTINGS_MANAGE",
  ],
  MANAGER: [
    "USER_MANAGE",
    "INVENTORY_VIEW",
    "INVENTORY_EDIT",
    "PARTY_VIEW",
    "PARTY_EDIT",
    "ORDER_VIEW",
    "ORDER_EDIT",
    "INVOICE_VIEW",
    "INVOICE_EDIT",
    "PAYMENT_VIEW",
    "PAYMENT_RECORD",
    "REPORTS_VIEW",
  ],
  ACCOUNTANT: [
    "PARTY_VIEW",
    "PARTY_EDIT",
    "ORDER_VIEW",
    "INVOICE_VIEW",
    "INVOICE_EDIT",
    "PAYMENT_VIEW",
    "PAYMENT_RECORD",
    "REPORTS_VIEW",
  ],
  STAFF: ["INVENTORY_VIEW", "PARTY_VIEW", "ORDER_VIEW", "ORDER_EDIT"],
};

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Permission groups for common checks
 */
export const PermissionGroups = {
  canManageInventory: ["INVENTORY_EDIT"] as Permission[],
  canManageOrders: ["ORDER_EDIT"] as Permission[],
  canManageInvoices: ["INVOICE_EDIT"] as Permission[],
  canRecordPayments: ["PAYMENT_RECORD"] as Permission[],
  canManageParties: ["PARTY_EDIT"] as Permission[],
  canViewReports: ["REPORTS_VIEW"] as Permission[],
  canManageUsers: ["USER_MANAGE"] as Permission[],
  canManageSettings: ["SETTINGS_MANAGE", "TENANT_MANAGE"] as Permission[],
};
