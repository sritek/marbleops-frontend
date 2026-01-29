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
  | "EXPENSE_VIEW"
  | "EXPENSE_EDIT"
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
  // Seller details for GST compliance
  legalName?: string | null;
  tradeName?: string | null;
  gstin?: string | null;
  pan?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  pincode?: string | null;
  email?: string | null;
  // Bank details
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankUpiId?: string | null;
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
  color: string | null;
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
  storeId: string;
  partyId: string;
  partyName?: string; // From backend OrderResponse
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  notes: string | null;
  items: OrderItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  // Relations (optional, may be populated by backend)
  party?: Party;
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

export interface OrderEvent {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Display shape for order payment (receipt/success dialog). Backend Payment + orderNumber etc. */
export interface OrderPayment {
  id: string;
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  bankName?: string;
  chequeDate?: string;
  allocationType?: string;
  notes?: string;
  receivedBy?: string;
  createdAt: string;
}

export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "CREDIT";

// =============================================================================
// INVOICE TYPES
// =============================================================================

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export interface Invoice {
  id: string;
  tenantId: string;
  storeId: string;
  partyId: string;
  partyName?: string; // From backend InvoiceResponse
  orderId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  computedStatus?: "PARTIAL" | "OVERDUE"; // Computed status from backend
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
  dueDate?: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  party?: Party;
  items?: InvoiceItem[];
  payments?: InvoicePaymentDisplay[];
}

/** Payment shape from invoice response - supports createdAt or date for display */
export interface InvoicePaymentDisplay {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  createdAt?: string;
  date?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  inventoryId: string | null;
  name: string;
  description: string | null;
  hsnCode?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Compute invoice display status (PARTIAL or OVERDUE) based on payment and due date.
 * Returns the computed status if applicable, otherwise returns the base status.
 */
export function getInvoiceDisplayStatus(invoice: Invoice): InvoiceStatus | "PARTIAL" | "OVERDUE" {
  // Use computed status from backend if available
  if (invoice.computedStatus) {
    return invoice.computedStatus;
  }

  // Fallback: compute on frontend if backend didn't provide it
  if (invoice.status === "CANCELLED" || invoice.status === "PAID") {
    return invoice.status;
  }

  // Check for OVERDUE first (takes priority)
  if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID") {
    return "OVERDUE";
  }

  // Check for PARTIAL payment
  if (invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount) {
    return "PARTIAL";
  }

  return invoice.status;
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
  partyName?: string | null;
  orderId?: string | null;
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
// EXPENSE TYPES
// =============================================================================

export type ExpenseCategory =
  | "MATERIAL_PURCHASE"
  | "FREIGHT"
  | "LABOR"
  | "RENT"
  | "UTILITIES"
  | "EQUIPMENT"
  | "VEHICLE"
  | "PACKAGING"
  | "MARKETING"
  | "OFFICE"
  | "PROFESSIONAL"
  | "TAXES"
  | "INSURANCE"
  | "OTHER";

export type ExpenseStatus = "PENDING" | "PAID" | "CANCELLED";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface Expense {
  id: string;
  tenantId: string;
  storeId: string;
  expenseNumber: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  amount: number;
  gstAmount?: number;
  gstRate?: number;
  totalAmount: number;
  vendorId?: string;
  vendorName?: string;
  billNumber?: string;
  billDate?: string;
  status: ExpenseStatus;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  description: string;
  date: string;
  amount: number;
  gstAmount?: number;
  gstRate?: number;
  vendorId?: string;
  vendorName?: string;
  billNumber?: string;
  billDate?: string;
  status?: ExpenseStatus;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
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
// INDIAN STATES & UNION TERRITORIES (GST Codes)
// =============================================================================

export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh (New)" },
  { code: "38", name: "Ladakh" },
] as const;

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
  partyId?: string;
  quantity?: number;
  length?: number;
  height?: number;
  thickness?: number;
  totalSqft?: number;
  availableSqft?: number;
  quality?: StoneQuality;
  buyPrice?: number;
  sellPrice?: number;
  lowStockThreshold?: number;
  color?: string;
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
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discountAmount?: number;
  isGst?: boolean;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  dueDate?: string; // ISO date string
  notes?: string;
}

export interface CreateInvoiceFromOrderInput {
  orderId: string;
  dueDate?: string;
  notes?: string;
  isGst?: boolean;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  discountAmount?: number;
}

export interface RecordPaymentInput {
  partyId: string;
  orderId?: string;
  invoiceId?: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  notes?: string;
}

export interface CreateUserInput {
  name: string;
  phone: string;
  password: string;
  role: Role;
  storeId?: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  password?: string;
  role?: Role;
  storeId?: string;
  isActive?: boolean;
}

export interface CreateStoreInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateStoreInput {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}
