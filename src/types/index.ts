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
export type StoneColor = 
  | "WHITE" 
  | "BLACK" 
  | "GREY" 
  | "BEIGE" 
  | "BROWN" 
  | "GREEN" 
  | "BLUE" 
  | "PINK" 
  | "RED" 
  | "YELLOW" 
  | "MULTI";

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
  // Color
  color: StoneColor | null;
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
// ORDER TYPES (Enhanced for GST-Compliant Order Management)
// =============================================================================

// Order status with full lifecycle support
export type OrderStatus = 
  | "DRAFT"              // Created but not confirmed
  | "CONFIRMED"          // Customer confirmed, ready for processing
  | "PROCESSING"         // Being picked/packed
  | "PARTIALLY_DELIVERED"// Some items delivered
  | "DELIVERED"          // All items delivered
  | "CLOSED"             // Fully delivered, invoiced, paid
  | "CANCELLED"          // Order cancelled
  | "ON_HOLD";           // Temporarily paused

// Order types for different business scenarios
export type OrderType = 
  | "STANDARD"           // Regular order
  | "COUNTER_SALE"       // Walk-in B2C sale
  | "PROJECT"            // Large project order
  | "SAMPLE"             // Sample request
  | "RETURN";            // Return order

// Delivery and payment status
export type DeliveryStatus = "PENDING" | "PARTIAL" | "COMPLETE";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";
export type TransportMode = "OWN" | "COURIER" | "CUSTOMER_PICKUP" | "THIRD_PARTY";
export type Priority = "NORMAL" | "URGENT" | "LOW";
export type LineItemDeliveryStatus = "PENDING" | "PARTIAL" | "COMPLETE" | "CANCELLED";

// Customer snapshot frozen at order time for audit
export interface CustomerSnapshot {
  name: string;
  gstin?: string;
  pan?: string;
  phone: string;
  email?: string;
  customerType: CustomerType;
  creditLimit?: number;
  creditDays?: number;
}

// Product snapshot frozen at order time
export interface ProductSnapshot {
  name: string;
  sku?: string;
  hsnCode: string;
  category: string;
  subcategory?: string;
  color?: string;
  finish?: string;
  grade?: string;
}

// Note: ItemDimensions is defined in Invoice Types section below

// Shipping address with contact person
export interface ShippingAddress extends GSTAddress {
  contactPerson?: string;
  contactPhone?: string;
}

// Enhanced Order interface
export interface Order {
  // System identifiers
  id: string;
  tenantId: string;
  storeId: string;
  orderNumber: string;              // ORD-2526-0001 format

  // Order metadata
  orderType: OrderType;
  orderDate: string;                // ISO date
  expectedDeliveryDate?: string;
  validUntil?: string;              // Quote validity for drafts
  priority: Priority;
  status: OrderStatus;

  // Customer details (denormalized)
  customerId: string;
  customerSnapshot: CustomerSnapshot;

  // Addresses
  billingAddress: GSTAddress;
  shippingAddress: ShippingAddress;
  placeOfSupply: string;            // 2-digit GST state code

  // Financial summary
  subtotal: number;
  discountAmount: number;
  discountPercent?: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;

  // Payment tracking
  paymentStatus: PaymentStatus;
  amountPaid: number;
  amountDue: number;
  advanceRequired?: number;

  // Delivery tracking
  deliveryStatus: DeliveryStatus;
  totalQuantityOrdered: number;
  totalQuantityDelivered: number;
  totalQuantityRemaining: number;

  // Linked documents
  quotationId?: string;
  linkedInvoiceIds: string[];
  linkedDeliveryIds: string[];
  linkedPaymentIds: string[];

  // Notes
  internalNotes?: string;
  customerNotes?: string;
  termsAndConditions?: string;

  // Audit trail
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // Relations
  party?: Party;
  items?: OrderLineItem[];
  deliveries?: DeliveryChallan[];
  payments?: OrderPayment[];
}

// Enhanced Order Line Item
export interface OrderLineItem {
  id: string;
  orderId: string;
  lineNumber: number;

  // Product reference
  inventoryId: string;
  productSnapshot: ProductSnapshot;

  // Dimensions (marble-specific)
  dimensions?: ItemDimensions;
  areaSqft?: number;                // Calculated area

  // Quantity & pricing
  unit: UnitOfMeasure;
  quantityOrdered: number;
  quantityDelivered: number;
  quantityRemaining: number;
  quantityCancelled: number;

  unitPrice: number;
  discountPercent?: number;
  discountAmount: number;
  taxableValue: number;

  // Tax breakdown
  gstRate: number;                  // 5, 12, 18, 28
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;

  lineTotal: number;                // Including tax

  // Delivery tracking
  deliveryStatus: LineItemDeliveryStatus;
  reservedQuantity?: number;

  // Notes
  lineNotes?: string;
}

// Delivery Challan
export interface DeliveryChallan {
  id: string;
  challanNumber: string;            // DC-2526-0001
  orderId: string;
  orderNumber: string;

  challanDate: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transportMode: TransportMode;
  transporterName?: string;
  lrNumber?: string;                // Lorry Receipt

  deliveryAddress: ShippingAddress;
  items: DeliveryChallanItem[];

  status: "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "PARTIAL_RETURN" | "FULL_RETURN";
  deliveredAt?: string;
  receivedBy?: string;

  // E-Way Bill
  ewayBillNumber?: string;
  ewayBillDate?: string;
  ewayBillValidUntil?: string;

  // Proof of delivery
  podImage?: string;
  podSignature?: string;

  // Audit
  createdBy: string;
  createdAt: string;
}

export interface DeliveryChallanItem {
  orderLineId: string;
  productName: string;
  hsnCode: string;
  quantityDispatched: number;
  quantityDelivered: number;
  quantityReturned?: number;
  returnReason?: string;
  unit: UnitOfMeasure;
}

// Order Payment Record
export interface OrderPayment {
  id: string;
  receiptNumber: string;            // RCP-2526-0001
  orderId: string;
  orderNumber: string;

  paymentDate: string;
  amount: number;
  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "CREDIT";

  // Mode-specific details
  referenceNumber?: string;         // UTR/Cheque No/Card Auth
  bankName?: string;
  chequeDate?: string;
  chequeStatus?: "PENDING" | "CLEARED" | "BOUNCED";

  // Allocation
  allocationType: "ADVANCE" | "AGAINST_INVOICE" | "AGAINST_ORDER";
  invoiceId?: string;

  notes?: string;

  // Audit
  receivedBy: string;
  createdAt: string;
}

// Order audit log entry
export interface OrderAuditLog {
  id: string;
  orderId: string;
  timestamp: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  userName: string;
  notes?: string;
}

// Order statistics for dashboard/reports
export interface OrderStats {
  totalOrders: number;
  totalValue: number;
  draftOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  partiallyDeliveredOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  paymentPending: number;
  overdueDeliveries: number;
}

// Legacy OrderItem type for backward compatibility
export interface OrderItem {
  id: string;
  orderId: string;
  inventoryId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Create order input
export interface CreateOrderInput {
  customerId: string;
  orderType?: OrderType;
  priority?: Priority;
  expectedDeliveryDate?: string;
  billingAddress?: GSTAddress;
  shippingAddress?: ShippingAddress;
  placeOfSupply?: string;
  items: {
    inventoryId: string;
    quantity: number;
    unitPrice: number;
    dimensions?: ItemDimensions;
    gstRate?: number;
    discountPercent?: number;
    lineNotes?: string;
  }[];
  discountPercent?: number;
  internalNotes?: string;
  customerNotes?: string;
  termsAndConditions?: string;
}

// =============================================================================
// INVOICE TYPES (GST-Compliant)
// =============================================================================

// Invoice classification types
export type InvoiceType = "TAX_INVOICE" | "BILL_OF_SUPPLY" | "CREDIT_NOTE" | "DEBIT_NOTE" | "PROFORMA";
export type SupplyType = "INTRA_STATE" | "INTER_STATE" | "EXPORT" | "SEZ";
export type CustomerType = "B2B_REGISTERED" | "B2B_UNREGISTERED" | "B2C" | "SEZ" | "EXPORT";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type UnitOfMeasure = "SQF" | "PCS" | "CFT" | "RFT" | "BOX" | "NOS" | "MTR" | "KG";

// Indian State Codes for GST
export interface StateCode {
  code: string; // 2-digit code like "24", "27", "29"
  name: string;
  shortName: string; // GJ, MH, KA, etc.
}

// Address with GST-required fields
export interface GSTAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  stateCode: string; // 2-digit GST state code
  pincode: string;
  country?: string;
}

// Bank details for payment collection
export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch?: string;
  upiId?: string;
}

// Seller/Business details
export interface SellerDetails {
  legalName: string;
  tradeName?: string;
  gstin: string; // 15-character GSTIN
  pan: string; // 10-character PAN
  address: GSTAddress;
  contact: {
    phone: string;
    email?: string;
  };
  bankDetails?: BankDetails;
  signatureImage?: string; // Base64
}

// Buyer details on invoice
export interface BuyerDetails {
  id: string;
  name: string;
  gstin?: string | null; // Required for B2B_REGISTERED
  customerType: CustomerType;
  billingAddress: GSTAddress;
  shippingAddress: GSTAddress;
  placeOfSupply: string; // State code determining IGST vs CGST+SGST
  contact: {
    phone?: string;
    email?: string;
  };
}

// Item dimensions (for slabs, tiles)
export interface ItemDimensions {
  length: number;
  width: number;
  thickness?: number;
  unit: "MM" | "CM" | "INCH" | "FT";
}

// Enhanced invoice line item with GST details
export interface InvoiceLineItem {
  id: string;
  slNo: number;
  invoiceId: string;
  inventoryId?: string | null;
  
  // Item details
  itemCode?: string;
  name: string;
  description?: string;
  hsnCode: string; // 4-8 digit HSN code (6802 for marble)
  
  // Dimensions (marble-specific)
  dimensions?: ItemDimensions;
  areaSqFt?: number; // Calculated from dimensions
  
  // Quantity and pricing
  quantity: number;
  unit: UnitOfMeasure;
  unitPrice: number;
  
  // Discount
  discount?: {
    type: "PERCENT" | "FLAT";
    value: number;
    amount: number; // Calculated discount amount
  };
  
  // Tax calculation
  taxableValue: number; // (qty × unitPrice) - discount
  gstRate: number; // 0, 5, 12, 18, 28
  
  // Tax amounts (either CGST+SGST or IGST)
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  cessRate?: number;
  cessAmount?: number;
  
  // Line total
  totalAmount: number;
}

// Tax summary by rate
export interface TaxBreakdown {
  gstRate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
}

// Invoice totals
export interface InvoiceTotals {
  subtotal: number; // Sum of taxable values
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalTax: number;
  roundOff: number; // Max ±0.50
  grandTotal: number;
  amountInWords: string; // "Rupees Fifty Thousand Only"
}

// Payment record for invoice
export interface InvoicePaymentRecord {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// E-invoice and compliance fields
export interface InvoiceCompliance {
  eInvoiceIrn?: string; // Invoice Reference Number from IRP
  eInvoiceAckNo?: string;
  eInvoiceAckDate?: string;
  eWayBillNo?: string;
  eWayBillDate?: string;
  qrCode?: string; // Base64 encoded QR
  declaration?: string;
  termsAndConditions?: string;
  authorizedSignatory?: string;
}

// Linked documents
export interface InvoiceLinks {
  orderId?: string;
  quotationId?: string;
  deliveryChallanId?: string;
  originalInvoiceId?: string; // For credit/debit notes
  creditNoteIds?: string[];
}

// Main Invoice interface (GST-Compliant)
export interface Invoice {
  id: string;
  tenantId: string;
  storeId: string;
  
  // Invoice identification
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  financialYear: string; // "2025-26"
  
  // Invoice classification
  invoiceType: InvoiceType;
  supplyType: SupplyType;
  reverseCharge: boolean;
  
  // Parties
  seller: SellerDetails;
  buyer: BuyerDetails;
  partyId: string; // Legacy reference to Party
  
  // Line items
  items: InvoiceLineItem[];
  
  // Tax summary
  taxSummary: TaxBreakdown[];
  
  // Totals
  totals: InvoiceTotals;
  
  // Legacy flat fields (for backward compatibility)
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
  
  // Payment tracking
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  paymentHistory: InvoicePaymentRecord[];
  
  // Compliance
  compliance?: InvoiceCompliance;
  
  // Links
  links?: InvoiceLinks;
  orderId: string | null;
  
  // Notes
  notes: string | null;
  internalNotes?: string;
  
  // Status and metadata
  status: InvoiceStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  
  // Relations (for API responses)
  party?: Party;
  payments?: Payment[];
}

// Simplified InvoiceItem for backward compatibility
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  inventoryId: string | null;
  name: string;
  description: string | null;
  hsnCode?: string;
  quantity: number;
  unit?: UnitOfMeasure;
  unitPrice: number;
  totalPrice: number;
  // Enhanced fields
  dimensions?: ItemDimensions;
  areaSqFt?: number;
  taxableValue?: number;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
}

// Indian States for GST
export const INDIAN_STATES: StateCode[] = [
  { code: "01", name: "Jammu & Kashmir", shortName: "JK" },
  { code: "02", name: "Himachal Pradesh", shortName: "HP" },
  { code: "03", name: "Punjab", shortName: "PB" },
  { code: "04", name: "Chandigarh", shortName: "CH" },
  { code: "05", name: "Uttarakhand", shortName: "UK" },
  { code: "06", name: "Haryana", shortName: "HR" },
  { code: "07", name: "Delhi", shortName: "DL" },
  { code: "08", name: "Rajasthan", shortName: "RJ" },
  { code: "09", name: "Uttar Pradesh", shortName: "UP" },
  { code: "10", name: "Bihar", shortName: "BR" },
  { code: "11", name: "Sikkim", shortName: "SK" },
  { code: "12", name: "Arunachal Pradesh", shortName: "AR" },
  { code: "13", name: "Nagaland", shortName: "NL" },
  { code: "14", name: "Manipur", shortName: "MN" },
  { code: "15", name: "Mizoram", shortName: "MZ" },
  { code: "16", name: "Tripura", shortName: "TR" },
  { code: "17", name: "Meghalaya", shortName: "ML" },
  { code: "18", name: "Assam", shortName: "AS" },
  { code: "19", name: "West Bengal", shortName: "WB" },
  { code: "20", name: "Jharkhand", shortName: "JH" },
  { code: "21", name: "Odisha", shortName: "OD" },
  { code: "22", name: "Chhattisgarh", shortName: "CG" },
  { code: "23", name: "Madhya Pradesh", shortName: "MP" },
  { code: "24", name: "Gujarat", shortName: "GJ" },
  { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu", shortName: "DN" },
  { code: "27", name: "Maharashtra", shortName: "MH" },
  { code: "29", name: "Karnataka", shortName: "KA" },
  { code: "30", name: "Goa", shortName: "GA" },
  { code: "31", name: "Lakshadweep", shortName: "LD" },
  { code: "32", name: "Kerala", shortName: "KL" },
  { code: "33", name: "Tamil Nadu", shortName: "TN" },
  { code: "34", name: "Puducherry", shortName: "PY" },
  { code: "35", name: "Andaman & Nicobar Islands", shortName: "AN" },
  { code: "36", name: "Telangana", shortName: "TS" },
  { code: "37", name: "Andhra Pradesh", shortName: "AP" },
  { code: "38", name: "Ladakh", shortName: "LA" },
];

// HSN codes for marble business
export const MARBLE_HSN_CODES = {
  MARBLE_SLAB: "68022100",
  MARBLE_BLOCK: "25151100",
  GRANITE_SLAB: "68022300",
  GRANITE_BLOCK: "25161100",
  TILES_CERAMIC: "69072100",
  TILES_PORCELAIN: "69072200",
  CUTTING_SERVICE: "998599",
  TRANSPORT_SERVICE: "996511",
} as const;

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
// CHART TYPES
// =============================================================================

export interface StackedChartData {
  month: string;
  amount: number;
  returnAmount: number;
}

export interface StockCategoryData {
  name: string;
  value: number;
  color: string;
}

export interface StockMetric {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface StockParty {
  name: string;
  material: string;
  quantity: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  materialType: string;
  currentQty: number;
  threshold: number;
  unit?: string;
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardStats {
  // New stat cards with date filtering
  sales: {
    amount: number;
    count: number;
  };
  purchase: {
    amount: number;
    count: number;
  };
  paymentIn: {
    amount: number;
    count: number;
  };
  paymentOut: {
    amount: number;
    count: number;
  };
  // Legacy fields (kept for backward compatibility)
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

export interface DashboardStatsParams {
  startDate?: string;
  endDate?: string;
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

// Note: CreateOrderInput is defined in Order Types section above

export interface CreateInvoiceInput {
  partyId: string;
  orderId?: string;
  invoiceType?: InvoiceType;
  invoiceDate?: string;
  dueDate?: string;
  
  // Buyer details (auto-filled from party, can be overridden)
  buyerGstin?: string;
  customerType?: CustomerType;
  billingAddress?: Partial<GSTAddress>;
  shippingAddress?: Partial<GSTAddress>;
  placeOfSupply?: string; // State code
  
  // Line items
  items: Array<{
    inventoryId?: string;
    name: string;
    description?: string;
    hsnCode?: string;
    dimensions?: ItemDimensions;
    quantity: number;
    unit?: UnitOfMeasure;
    unitPrice: number;
    discount?: {
      type: "PERCENT" | "FLAT";
      value: number;
    };
    gstRate?: number;
  }>;
  
  // Totals
  discountAmount?: number;
  roundOff?: number;
  
  // Tax config
  isGst?: boolean;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  
  // Notes
  notes?: string;
  internalNotes?: string;
  termsAndConditions?: string;
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
