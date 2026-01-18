/**
 * Core type definitions for MarbleOps Frontend
 * These types mirror the backend API contracts
 */

// =============================================================================
// USER & AUTH TYPES
// =============================================================================

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  permissions: Permission[];
  tenantId: string;
  storeId: string | null;
  storeName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Role = "OWNER" | "MANAGER" | "ACCOUNTANT" | "STAFF";

export type Permission =
  | "TENANT_MANAGE"
  | "STORE_MANAGE"
  | "USER_MANAGE"
  | "INVENTORY_VIEW"
  | "INVENTORY_EDIT"
  | "PARTY_VIEW"
  | "PARTY_EDIT"
  | "ORDER_VIEW"
  | "ORDER_EDIT"
  | "INVOICE_VIEW"
  | "INVOICE_EDIT"
  | "PAYMENT_VIEW"
  | "PAYMENT_RECORD"
  | "REPORTS_VIEW"
  | "SETTINGS_MANAGE";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// =============================================================================
// TENANT & STORE TYPES
// =============================================================================

export interface Tenant {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// INVENTORY TYPES
// =============================================================================

export type MaterialType = "MARBLE" | "GRANITE" | "TILE";
export type StoneForm = "SLAB" | "BLOCK" | "TILE";
export type StoneQuality = "NORMAL" | "CRACKED" | "DAMAGED";
export type InventoryStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export interface Inventory {
  id: string;
  tenantId: string;
  storeId: string;
  // Generic fields
  name: string | null;
  description: string | null;
  type: string | null;
  size: string | null;
  unit: string | null;
  quantity: number | null;
  unitPrice: number | null;
  lowStockThreshold: number | null;
  // Marble/Granite specific
  materialType: MaterialType | null;
  stoneName: string | null;
  form: StoneForm | null;
  finish: string | null;
  supplier: string | null;
  lotNumber: string | null;
  // Dimensions
  length: number | null;
  height: number | null;
  thickness: number | null;
  totalSqft: number | null;
  availableSqft: number | null;
  // Pricing
  buyPrice: number | null;
  sellPrice: number | null;
  // Quality & Status
  quality: StoneQuality | null;
  status: InventoryStatus;
  // Photos (to be added)
  photos?: string[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface InventoryMovement {
  id: string;
  tenantId: string;
  storeId: string;
  inventoryId: string;
  type: MovementType;
  sqft: number;
  invoiceId: string | null;
  orderId: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

// =============================================================================
// PARTY TYPES
// =============================================================================

export type PartyType = "CUSTOMER" | "SUPPLIER" | "BOTH";

export interface Party {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  type: PartyType;
  gstNumber: string | null;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ORDER TYPES
// =============================================================================

export type OrderStatus = "DRAFT" | "CONFIRMED" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  tenantId: string;
  storeId: string;
  partyId: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  party?: Party;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  inventoryId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// =============================================================================
// INVOICE TYPES
// =============================================================================

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export interface Invoice {
  id: string;
  tenantId: string;
  storeId: string;
  partyId: string;
  orderId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  discountAmount: number;
  isGst: boolean;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate?: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  party?: Party;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  inventoryId: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

export type PaymentType = "IN" | "OUT";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE" | "OTHER";

export interface Payment {
  id: string;
  tenantId: string;
  storeId: string;
  partyId: string;
  invoiceId: string | null;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  party?: Party;
  invoice?: Invoice;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
} as const;

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardStats {
  todaySales: {
    amount: number;
    count: number;
  };
  pendingPayments: {
    amount: number;
    count: number;
    overdueCount: number;
  };
  lowStockAlerts: {
    count: number;
    items: Array<{
      id: string;
      name: string;
      currentQty: number;
      threshold: number;
    }>;
  };
  activeOrders: {
    count: number;
    draftCount: number;
    confirmedCount: number;
  };
}

export interface ActionItem {
  id: string;
  type: "overdue_invoice" | "ready_for_delivery" | "low_stock";
  title: string;
  description: string;
  link: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

// =============================================================================
// REPORT TYPES
// =============================================================================

export interface SalesReport {
  period: string;
  totalSales: number;
  invoiceCount: number;
  averageOrderValue: number;
  topCustomers: Array<{
    partyId: string;
    partyName: string;
    totalAmount: number;
  }>;
}

export interface StockReport {
  totalItems: number;
  totalValue: number;
  byMaterial: Array<{
    materialType: MaterialType;
    count: number;
    value: number;
  }>;
  lowStockItems: Inventory[];
}

// =============================================================================
// FORM INPUT TYPES
// =============================================================================

export interface LoginInput {
  phone: string;
  password: string;
}

export interface CreateInventoryInput {
  name?: string;
  materialType?: MaterialType;
  stoneName?: string;
  form?: StoneForm;
  finish?: string;
  supplier?: string;
  lotNumber?: string;
  length?: number;
  height?: number;
  thickness?: number;
  totalSqft?: number;
  availableSqft?: number;
  quality?: StoneQuality;
  buyPrice?: number;
  sellPrice?: number;
  lowStockThreshold?: number;
}

export interface CreatePartyInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: PartyType;
  gstNumber?: string;
  openingBalance?: number;
}

export interface CreateOrderInput {
  partyId: string;
  items: Array<{
    inventoryId: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
}

export interface CreateInvoiceInput {
  partyId: string;
  orderId?: string;
  items: Array<{
    inventoryId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discountAmount?: number;
  isGst?: boolean;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  notes?: string;
}

export interface RecordPaymentInput {
  partyId: string;
  invoiceId?: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  notes?: string;
}
