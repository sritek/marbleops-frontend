/**
 * Mock Order Data for Order Management System
 * Realistic marble business orders with various scenarios
 */

import type {
  Order,
  OrderLineItem,
  DeliveryChallan,
  OrderPayment,
  OrderStats,
  OrderStatus,
  OrderType,
  CustomerSnapshot,
  ProductSnapshot,
  GSTAddress,
  ShippingAddress,
  DeliveryChallanItem,
  CustomerType,
} from "@/types";

// =============================================================================
// MOCK CUSTOMER SNAPSHOTS
// =============================================================================

const mockCustomers: Record<string, CustomerSnapshot & { id: string }> = {
  sharma: {
    id: "party-001",
    name: "Sharma Constructions Pvt. Ltd.",
    gstin: "24AADCS1234F1ZP",
    pan: "AADCS1234F",
    phone: "+91 79 2345 6789",
    email: "procurement@sharma.com",
    customerType: "B2B_REGISTERED" as CustomerType,
    creditLimit: 1000000,
    creditDays: 30,
  },
  mumbai: {
    id: "party-002",
    name: "Mumbai Interiors & Designs",
    gstin: "27AABFM5678G1ZK",
    pan: "AABFM5678G",
    phone: "+91 22 2456 7890",
    email: "orders@mumbaiinteriors.in",
    customerType: "B2B_REGISTERED" as CustomerType,
    creditLimit: 500000,
    creditDays: 45,
  },
  bangalore: {
    id: "party-003",
    name: "Bangalore Stone Works",
    gstin: "29AABCB9012H1ZJ",
    pan: "AABCB9012H",
    phone: "+91 80 2567 8901",
    email: "info@bangalorestones.com",
    customerType: "B2B_REGISTERED" as CustomerType,
    creditLimit: 750000,
    creditDays: 30,
  },
  patel: {
    id: "party-004",
    name: "Patel Home Decor",
    gstin: "24AAFPP3456K1ZM",
    pan: "AAFPP3456K",
    phone: "+91 98765 12345",
    email: "patel@homedecor.com",
    customerType: "B2B_REGISTERED" as CustomerType,
    creditLimit: 300000,
    creditDays: 15,
  },
  rajesh: {
    id: "party-005",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    customerType: "B2C" as CustomerType,
  },
  amit: {
    id: "party-006",
    name: "Amit Agarwal",
    phone: "+91 87654 32109",
    customerType: "B2C" as CustomerType,
  },
  elite: {
    id: "party-007",
    name: "Elite Designs Studio",
    gstin: "24AABCE7890L1ZN",
    pan: "AABCE7890L",
    phone: "+91 79 2678 9012",
    email: "studio@elitedesigns.in",
    customerType: "B2B_REGISTERED" as CustomerType,
    creditLimit: 400000,
    creditDays: 30,
  },
  royal: {
    id: "party-008",
    name: "Royal Marble Works",
    gstin: "27AACRM2345N1ZP",
    pan: "AACRM2345N",
    phone: "+91 22 2789 0123",
    email: "royal@marbleworks.com",
    customerType: "B2B_REGISTERED" as CustomerType,
    creditLimit: 600000,
    creditDays: 30,
  },
};

// =============================================================================
// MOCK ADDRESSES
// =============================================================================

const mockAddresses: Record<string, { billing: GSTAddress; shipping: ShippingAddress }> = {
  sharma: {
    billing: {
      line1: "45, Industrial Estate",
      line2: "Naroda GIDC",
      city: "Ahmedabad",
      state: "Gujarat",
      stateCode: "24",
      pincode: "380015",
    },
    shipping: {
      line1: "Site Office, Sarkhej Road",
      line2: "Near Bopal Circle",
      city: "Ahmedabad",
      state: "Gujarat",
      stateCode: "24",
      pincode: "380055",
      contactPerson: "Ramesh Sharma",
      contactPhone: "+91 98765 11111",
    },
  },
  mumbai: {
    billing: {
      line1: "Office 301, Trade Center",
      line2: "Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "400001",
    },
    shipping: {
      line1: "Warehouse Unit 5, Bhiwandi",
      line2: "Industrial Area",
      city: "Thane",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "421302",
      contactPerson: "Suresh Patil",
      contactPhone: "+91 98765 22222",
    },
  },
  bangalore: {
    billing: {
      line1: "12, Stone Market",
      line2: "Peenya Industrial Area",
      city: "Bangalore",
      state: "Karnataka",
      stateCode: "29",
      pincode: "560058",
    },
    shipping: {
      line1: "Plot 45, Phase 2",
      line2: "Peenya Industrial Area",
      city: "Bangalore",
      state: "Karnataka",
      stateCode: "29",
      pincode: "560058",
      contactPerson: "Manjunath",
      contactPhone: "+91 98765 33333",
    },
  },
  patel: {
    billing: {
      line1: "Shop 12, Marble Market",
      line2: "Ring Road",
      city: "Rajkot",
      state: "Gujarat",
      stateCode: "24",
      pincode: "360001",
    },
    shipping: {
      line1: "Shop 12, Marble Market",
      line2: "Ring Road",
      city: "Rajkot",
      state: "Gujarat",
      stateCode: "24",
      pincode: "360001",
      contactPerson: "Hitesh Patel",
      contactPhone: "+91 98765 44444",
    },
  },
  rajesh: {
    billing: {
      line1: "B-102, Shanti Apartments",
      city: "Rajkot",
      state: "Gujarat",
      stateCode: "24",
      pincode: "360005",
    },
    shipping: {
      line1: "B-102, Shanti Apartments",
      city: "Rajkot",
      state: "Gujarat",
      stateCode: "24",
      pincode: "360005",
      contactPerson: "Rajesh Kumar",
      contactPhone: "+91 98765 43210",
    },
  },
};

// =============================================================================
// MOCK PRODUCT SNAPSHOTS
// =============================================================================

const mockProducts: Record<string, ProductSnapshot & { unitPrice: number; inventoryId: string }> = {
  whiteCarrara: {
    inventoryId: "inv-001",
    name: "Italian White Carrara Marble",
    sku: "IWC-001",
    hsnCode: "68022100",
    category: "Marble",
    subcategory: "Italian",
    color: "White",
    finish: "Polished",
    grade: "Premium",
    unitPrice: 850,
  },
  blackGalaxy: {
    inventoryId: "inv-002",
    name: "Black Galaxy Granite",
    sku: "BGG-001",
    hsnCode: "68022300",
    category: "Granite",
    subcategory: "Indian",
    color: "Black",
    finish: "Polished",
    grade: "Premium",
    unitPrice: 450,
  },
  rajasthanGreen: {
    inventoryId: "inv-003",
    name: "Rajasthan Green Marble",
    sku: "RGM-001",
    hsnCode: "68022100",
    category: "Marble",
    subcategory: "Indian",
    color: "Green",
    finish: "Polished",
    grade: "Standard",
    unitPrice: 380,
  },
  makranaWhite: {
    inventoryId: "inv-004",
    name: "Makrana White Marble",
    sku: "MWM-001",
    hsnCode: "68022100",
    category: "Marble",
    subcategory: "Indian",
    color: "White",
    finish: "Polished",
    grade: "Premium",
    unitPrice: 650,
  },
  tanBrown: {
    inventoryId: "inv-005",
    name: "Tan Brown Granite",
    sku: "TBG-001",
    hsnCode: "68022300",
    category: "Granite",
    subcategory: "Indian",
    color: "Brown",
    finish: "Polished",
    grade: "Standard",
    unitPrice: 320,
  },
  italianBeige: {
    inventoryId: "inv-006",
    name: "Italian Botticino Beige",
    sku: "IBB-001",
    hsnCode: "68022100",
    category: "Marble",
    subcategory: "Italian",
    color: "Beige",
    finish: "Honed",
    grade: "Premium",
    unitPrice: 780,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateOrderNumber(index: number): string {
  return `ORD-2526-${String(index).padStart(4, "0")}`;
}

function generateChallanNumber(index: number): string {
  return `DC-2526-${String(index).padStart(4, "0")}`;
}

function generateReceiptNumber(index: number): string {
  return `RCP-2526-${String(index).padStart(4, "0")}`;
}

function calculateLineItem(
  product: typeof mockProducts[string],
  quantity: number,
  gstRate: number,
  isInterState: boolean,
  discountPercent: number = 0
): Omit<OrderLineItem, "id" | "orderId" | "lineNumber" | "deliveryStatus" | "quantityDelivered" | "quantityRemaining" | "quantityCancelled"> {
  const taxableValue = quantity * product.unitPrice * (1 - discountPercent / 100);
  const discountAmount = quantity * product.unitPrice * discountPercent / 100;
  
  const cgstRate = isInterState ? 0 : gstRate / 2;
  const sgstRate = isInterState ? 0 : gstRate / 2;
  const igstRate = isInterState ? gstRate : 0;
  
  const cgstAmount = taxableValue * cgstRate / 100;
  const sgstAmount = taxableValue * sgstRate / 100;
  const igstAmount = taxableValue * igstRate / 100;
  
  return {
    inventoryId: product.inventoryId,
    productSnapshot: {
      name: product.name,
      sku: product.sku,
      hsnCode: product.hsnCode,
      category: product.category,
      subcategory: product.subcategory,
      color: product.color,
      finish: product.finish,
      grade: product.grade,
    },
    unit: "SQF",
    quantityOrdered: quantity,
    unitPrice: product.unitPrice,
    discountPercent,
    discountAmount,
    taxableValue,
    gstRate,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    lineTotal: taxableValue + cgstAmount + sgstAmount + igstAmount,
  };
}

// =============================================================================
// MOCK ORDERS
// =============================================================================

export const mockOrders: Order[] = [
  // Order 1: B2B Intra-state, Partially Delivered, Partial Payment
  {
    id: "order-001",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(1),
    orderType: "STANDARD",
    orderDate: "2025-01-10",
    expectedDeliveryDate: "2025-01-20",
    priority: "NORMAL",
    status: "PARTIALLY_DELIVERED",
    customerId: mockCustomers.sharma.id,
    customerSnapshot: mockCustomers.sharma,
    billingAddress: mockAddresses.sharma.billing,
    shippingAddress: mockAddresses.sharma.shipping,
    placeOfSupply: "24",
    subtotal: 297500,
    discountAmount: 14875,
    discountPercent: 5,
    taxableAmount: 282625,
    cgstAmount: 25436.25,
    sgstAmount: 25436.25,
    igstAmount: 0,
    totalTax: 50872.5,
    roundOff: 2.5,
    grandTotal: 333500,
    paymentStatus: "PARTIAL",
    amountPaid: 166750,
    amountDue: 166750,
    advanceRequired: 100000,
    deliveryStatus: "PARTIAL",
    totalQuantityOrdered: 350,
    totalQuantityDelivered: 200,
    totalQuantityRemaining: 150,
    linkedInvoiceIds: ["inv-001"],
    linkedDeliveryIds: ["dc-001"],
    linkedPaymentIds: ["pay-001", "pay-002"],
    internalNotes: "Priority customer - ensure quality check",
    customerNotes: "Deliver between 9 AM - 5 PM",
    createdBy: "user-001",
    createdAt: "2025-01-10T10:30:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-15T14:20:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-10T11:00:00Z",
    items: [
      {
        id: "item-001-1",
        orderId: "order-001",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.whiteCarrara, 200, 18, false, 5),
        quantityDelivered: 150,
        quantityRemaining: 50,
        quantityCancelled: 0,
        deliveryStatus: "PARTIAL",
        dimensions: { length: 6, width: 4, unit: "FT" },
        areaSqft: 24,
      },
      {
        id: "item-001-2",
        orderId: "order-001",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.blackGalaxy, 150, 18, false, 5),
        quantityDelivered: 50,
        quantityRemaining: 100,
        quantityCancelled: 0,
        deliveryStatus: "PARTIAL",
        dimensions: { length: 5, width: 3, unit: "FT" },
        areaSqft: 15,
      },
    ],
  },

  // Order 2: B2B Inter-state (Mumbai), Confirmed, Unpaid
  {
    id: "order-002",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(2),
    orderType: "PROJECT",
    orderDate: "2025-01-12",
    expectedDeliveryDate: "2025-01-25",
    priority: "URGENT",
    status: "CONFIRMED",
    customerId: mockCustomers.mumbai.id,
    customerSnapshot: mockCustomers.mumbai,
    billingAddress: mockAddresses.mumbai.billing,
    shippingAddress: mockAddresses.mumbai.shipping,
    placeOfSupply: "27",
    subtotal: 780000,
    discountAmount: 0,
    taxableAmount: 780000,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 140400,
    totalTax: 140400,
    roundOff: 0,
    grandTotal: 920400,
    paymentStatus: "UNPAID",
    amountPaid: 0,
    amountDue: 920400,
    advanceRequired: 300000,
    deliveryStatus: "PENDING",
    totalQuantityOrdered: 1200,
    totalQuantityDelivered: 0,
    totalQuantityRemaining: 1200,
    linkedInvoiceIds: [],
    linkedDeliveryIds: [],
    linkedPaymentIds: [],
    internalNotes: "Large project order - coordinate with warehouse",
    customerNotes: "Phase 1 delivery first",
    createdBy: "user-001",
    createdAt: "2025-01-12T09:15:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-12T09:15:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-12T10:00:00Z",
    items: [
      {
        id: "item-002-1",
        orderId: "order-002",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.makranaWhite, 500, 18, true),
        quantityDelivered: 0,
        quantityRemaining: 500,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
        dimensions: { length: 8, width: 4, unit: "FT" },
        areaSqft: 32,
      },
      {
        id: "item-002-2",
        orderId: "order-002",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.italianBeige, 400, 18, true),
        quantityDelivered: 0,
        quantityRemaining: 400,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
        dimensions: { length: 6, width: 4, unit: "FT" },
        areaSqft: 24,
      },
      {
        id: "item-002-3",
        orderId: "order-002",
        lineNumber: 3,
        ...calculateLineItem(mockProducts.blackGalaxy, 300, 18, true),
        quantityDelivered: 0,
        quantityRemaining: 300,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
        dimensions: { length: 5, width: 3, unit: "FT" },
        areaSqft: 15,
      },
    ],
  },

  // Order 3: B2B Inter-state (Bangalore), Delivered, Paid
  {
    id: "order-003",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(3),
    orderType: "STANDARD",
    orderDate: "2025-01-05",
    expectedDeliveryDate: "2025-01-12",
    priority: "NORMAL",
    status: "CLOSED",
    customerId: mockCustomers.bangalore.id,
    customerSnapshot: mockCustomers.bangalore,
    billingAddress: mockAddresses.bangalore.billing,
    shippingAddress: mockAddresses.bangalore.shipping,
    placeOfSupply: "29",
    subtotal: 257712,
    discountAmount: 12885.6,
    discountPercent: 5,
    taxableAmount: 244826.4,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 44068.75,
    totalTax: 44068.75,
    roundOff: 4.85,
    grandTotal: 288900,
    paymentStatus: "PAID",
    amountPaid: 288900,
    amountDue: 0,
    deliveryStatus: "COMPLETE",
    totalQuantityOrdered: 400,
    totalQuantityDelivered: 400,
    totalQuantityRemaining: 0,
    linkedInvoiceIds: ["inv-003"],
    linkedDeliveryIds: ["dc-002", "dc-003"],
    linkedPaymentIds: ["pay-003"],
    createdBy: "user-001",
    createdAt: "2025-01-05T11:00:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-15T16:30:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-05T11:30:00Z",
    items: [
      {
        id: "item-003-1",
        orderId: "order-003",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.rajasthanGreen, 250, 18, true, 5),
        quantityDelivered: 250,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
      {
        id: "item-003-2",
        orderId: "order-003",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.tanBrown, 150, 18, true, 5),
        quantityDelivered: 150,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
    ],
  },

  // Order 4: B2B Intra-state (Patel), Delivered, Paid
  {
    id: "order-004",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(4),
    orderType: "STANDARD",
    orderDate: "2025-01-08",
    expectedDeliveryDate: "2025-01-15",
    priority: "NORMAL",
    status: "CLOSED",
    customerId: mockCustomers.patel.id,
    customerSnapshot: mockCustomers.patel,
    billingAddress: mockAddresses.patel.billing,
    shippingAddress: mockAddresses.patel.shipping,
    placeOfSupply: "24",
    subtotal: 70800,
    discountAmount: 0,
    taxableAmount: 70800,
    cgstAmount: 6372,
    sgstAmount: 6372,
    igstAmount: 0,
    totalTax: 12744,
    roundOff: -44,
    grandTotal: 83500,
    paymentStatus: "PAID",
    amountPaid: 83500,
    amountDue: 0,
    deliveryStatus: "COMPLETE",
    totalQuantityOrdered: 100,
    totalQuantityDelivered: 100,
    totalQuantityRemaining: 0,
    linkedInvoiceIds: ["inv-004"],
    linkedDeliveryIds: ["dc-004"],
    linkedPaymentIds: ["pay-004"],
    createdBy: "user-001",
    createdAt: "2025-01-08T14:30:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-16T10:00:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-08T15:00:00Z",
    items: [
      {
        id: "item-004-1",
        orderId: "order-004",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.makranaWhite, 100, 18, false),
        quantityDelivered: 100,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
    ],
  },

  // Order 5: B2C Counter Sale, Delivered, Paid
  {
    id: "order-005",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(5),
    orderType: "COUNTER_SALE",
    orderDate: "2025-01-14",
    priority: "NORMAL",
    status: "CLOSED",
    customerId: mockCustomers.rajesh.id,
    customerSnapshot: mockCustomers.rajesh,
    billingAddress: mockAddresses.rajesh.billing,
    shippingAddress: mockAddresses.rajesh.shipping,
    placeOfSupply: "24",
    subtotal: 30680,
    discountAmount: 0,
    taxableAmount: 30680,
    cgstAmount: 2761.2,
    sgstAmount: 2761.2,
    igstAmount: 0,
    totalTax: 5522.4,
    roundOff: -2.4,
    grandTotal: 36200,
    paymentStatus: "PAID",
    amountPaid: 36200,
    amountDue: 0,
    deliveryStatus: "COMPLETE",
    totalQuantityOrdered: 80,
    totalQuantityDelivered: 80,
    totalQuantityRemaining: 0,
    linkedInvoiceIds: ["inv-005"],
    linkedDeliveryIds: [],
    linkedPaymentIds: ["pay-005"],
    customerNotes: "Customer pickup",
    createdBy: "user-001",
    createdAt: "2025-01-14T16:45:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-14T17:00:00Z",
    items: [
      {
        id: "item-005-1",
        orderId: "order-005",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.rajasthanGreen, 80, 18, false),
        quantityDelivered: 80,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
    ],
  },

  // Order 6: B2C Draft (Not yet confirmed)
  {
    id: "order-006",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(6),
    orderType: "STANDARD",
    orderDate: "2025-01-18",
    expectedDeliveryDate: "2025-01-28",
    validUntil: "2025-01-25",
    priority: "NORMAL",
    status: "DRAFT",
    customerId: mockCustomers.amit.id,
    customerSnapshot: mockCustomers.amit,
    billingAddress: mockAddresses.rajesh.billing, // Using same address for simplicity
    shippingAddress: mockAddresses.rajesh.shipping,
    placeOfSupply: "24",
    subtotal: 210276,
    discountAmount: 10513.8,
    discountPercent: 5,
    taxableAmount: 199762.2,
    cgstAmount: 17978.6,
    sgstAmount: 17978.6,
    igstAmount: 0,
    totalTax: 35957.2,
    roundOff: 0.6,
    grandTotal: 235720,
    paymentStatus: "UNPAID",
    amountPaid: 0,
    amountDue: 235720,
    deliveryStatus: "PENDING",
    totalQuantityOrdered: 360,
    totalQuantityDelivered: 0,
    totalQuantityRemaining: 360,
    linkedInvoiceIds: [],
    linkedDeliveryIds: [],
    linkedPaymentIds: [],
    internalNotes: "Awaiting customer confirmation",
    createdBy: "user-001",
    createdAt: "2025-01-18T10:00:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-18T10:00:00Z",
    items: [
      {
        id: "item-006-1",
        orderId: "order-006",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.whiteCarrara, 150, 18, false, 5),
        quantityDelivered: 0,
        quantityRemaining: 150,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
      },
      {
        id: "item-006-2",
        orderId: "order-006",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.blackGalaxy, 100, 18, false, 5),
        quantityDelivered: 0,
        quantityRemaining: 100,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
      },
      {
        id: "item-006-3",
        orderId: "order-006",
        lineNumber: 3,
        ...calculateLineItem(mockProducts.tanBrown, 110, 18, false, 5),
        quantityDelivered: 0,
        quantityRemaining: 110,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
      },
    ],
  },

  // Order 7: B2B Draft (Sharma - second order)
  {
    id: "order-007",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(7),
    orderType: "STANDARD",
    orderDate: "2025-01-19",
    expectedDeliveryDate: "2025-01-30",
    validUntil: "2025-01-26",
    priority: "LOW",
    status: "DRAFT",
    customerId: mockCustomers.sharma.id,
    customerSnapshot: mockCustomers.sharma,
    billingAddress: mockAddresses.sharma.billing,
    shippingAddress: mockAddresses.sharma.shipping,
    placeOfSupply: "24",
    subtotal: 135936,
    discountAmount: 0,
    taxableAmount: 135936,
    cgstAmount: 12234.24,
    sgstAmount: 12234.24,
    igstAmount: 0,
    totalTax: 24468.48,
    roundOff: -4.48,
    grandTotal: 160400,
    paymentStatus: "UNPAID",
    amountPaid: 0,
    amountDue: 160400,
    deliveryStatus: "PENDING",
    totalQuantityOrdered: 200,
    totalQuantityDelivered: 0,
    totalQuantityRemaining: 200,
    linkedInvoiceIds: [],
    linkedDeliveryIds: [],
    linkedPaymentIds: [],
    internalNotes: "Follow-up order from Sharma",
    createdBy: "user-001",
    createdAt: "2025-01-19T11:30:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-19T11:30:00Z",
    items: [
      {
        id: "item-007-1",
        orderId: "order-007",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.italianBeige, 200, 18, false),
        quantityDelivered: 0,
        quantityRemaining: 200,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
      },
    ],
  },

  // Order 8: B2B Confirmed, Processing (Mumbai - large order)
  {
    id: "order-008",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(8),
    orderType: "PROJECT",
    orderDate: "2025-01-15",
    expectedDeliveryDate: "2025-02-15",
    priority: "URGENT",
    status: "PROCESSING",
    customerId: mockCustomers.mumbai.id,
    customerSnapshot: mockCustomers.mumbai,
    billingAddress: mockAddresses.mumbai.billing,
    shippingAddress: mockAddresses.mumbai.shipping,
    placeOfSupply: "27",
    subtotal: 3829784,
    discountAmount: 191489.2,
    discountPercent: 5,
    taxableAmount: 3638294.8,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 654893.06,
    totalTax: 654893.06,
    roundOff: 11.94,
    grandTotal: 4293200,
    paymentStatus: "PARTIAL",
    amountPaid: 1500000,
    amountDue: 2793200,
    advanceRequired: 1500000,
    deliveryStatus: "PENDING",
    totalQuantityOrdered: 5000,
    totalQuantityDelivered: 0,
    totalQuantityRemaining: 5000,
    linkedInvoiceIds: [],
    linkedDeliveryIds: [],
    linkedPaymentIds: ["pay-006"],
    internalNotes: "Premium project - Hotel Lobby. CEO approval obtained.",
    customerNotes: "Phase-wise delivery over 4 weeks",
    createdBy: "user-001",
    createdAt: "2025-01-15T09:00:00Z",
    updatedBy: "user-002",
    updatedAt: "2025-01-17T14:00:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-15T10:00:00Z",
    items: [
      {
        id: "item-008-1",
        orderId: "order-008",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.whiteCarrara, 2000, 18, true, 5),
        quantityDelivered: 0,
        quantityRemaining: 2000,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
        lineNotes: "Lobby flooring",
      },
      {
        id: "item-008-2",
        orderId: "order-008",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.makranaWhite, 1500, 18, true, 5),
        quantityDelivered: 0,
        quantityRemaining: 1500,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
        lineNotes: "Reception counter",
      },
      {
        id: "item-008-3",
        orderId: "order-008",
        lineNumber: 3,
        ...calculateLineItem(mockProducts.blackGalaxy, 1000, 18, true, 5),
        quantityDelivered: 0,
        quantityRemaining: 1000,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
        lineNotes: "Accent walls",
      },
      {
        id: "item-008-4",
        orderId: "order-008",
        lineNumber: 4,
        ...calculateLineItem(mockProducts.italianBeige, 500, 18, true, 5),
        quantityDelivered: 0,
        quantityRemaining: 500,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
        lineNotes: "Bathroom flooring",
      },
    ],
  },

  // Order 9: Cancelled Order
  {
    id: "order-009",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(9),
    orderType: "STANDARD",
    orderDate: "2025-01-06",
    expectedDeliveryDate: "2025-01-16",
    priority: "NORMAL",
    status: "CANCELLED",
    customerId: mockCustomers.elite.id,
    customerSnapshot: mockCustomers.elite,
    billingAddress: mockAddresses.patel.billing, // Using similar address
    shippingAddress: mockAddresses.patel.shipping,
    placeOfSupply: "24",
    subtotal: 125000,
    discountAmount: 0,
    taxableAmount: 125000,
    cgstAmount: 11250,
    sgstAmount: 11250,
    igstAmount: 0,
    totalTax: 22500,
    roundOff: 0,
    grandTotal: 147500,
    paymentStatus: "UNPAID",
    amountPaid: 0,
    amountDue: 0,
    deliveryStatus: "PENDING",
    totalQuantityOrdered: 200,
    totalQuantityDelivered: 0,
    totalQuantityRemaining: 0,
    linkedInvoiceIds: [],
    linkedDeliveryIds: [],
    linkedPaymentIds: [],
    internalNotes: "Customer project got cancelled",
    createdBy: "user-001",
    createdAt: "2025-01-06T10:00:00Z",
    updatedBy: "user-002",
    updatedAt: "2025-01-10T09:00:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-06T10:30:00Z",
    cancelledBy: "user-002",
    cancelledAt: "2025-01-10T09:00:00Z",
    cancellationReason: "Customer project cancelled due to budget constraints",
    items: [
      {
        id: "item-009-1",
        orderId: "order-009",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.makranaWhite, 200, 18, false),
        quantityDelivered: 0,
        quantityRemaining: 0,
        quantityCancelled: 200,
        deliveryStatus: "CANCELLED",
      },
    ],
  },

  // Order 10: B2B Delivered, Paid (Royal Marble)
  {
    id: "order-010",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(10),
    orderType: "STANDARD",
    orderDate: "2025-01-03",
    expectedDeliveryDate: "2025-01-10",
    priority: "NORMAL",
    status: "CLOSED",
    customerId: mockCustomers.royal.id,
    customerSnapshot: mockCustomers.royal,
    billingAddress: mockAddresses.mumbai.billing,
    shippingAddress: mockAddresses.mumbai.shipping,
    placeOfSupply: "27",
    subtotal: 450000,
    discountAmount: 22500,
    discountPercent: 5,
    taxableAmount: 427500,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 76950,
    totalTax: 76950,
    roundOff: 50,
    grandTotal: 504500,
    paymentStatus: "PAID",
    amountPaid: 504500,
    amountDue: 0,
    deliveryStatus: "COMPLETE",
    totalQuantityOrdered: 600,
    totalQuantityDelivered: 600,
    totalQuantityRemaining: 0,
    linkedInvoiceIds: ["inv-010"],
    linkedDeliveryIds: ["dc-005"],
    linkedPaymentIds: ["pay-007"],
    createdBy: "user-001",
    createdAt: "2025-01-03T09:00:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-12T11:00:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-03T09:30:00Z",
    items: [
      {
        id: "item-010-1",
        orderId: "order-010",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.whiteCarrara, 300, 18, true, 5),
        quantityDelivered: 300,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
      {
        id: "item-010-2",
        orderId: "order-010",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.blackGalaxy, 300, 18, true, 5),
        quantityDelivered: 300,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
    ],
  },

  // Order 11: On Hold
  {
    id: "order-011",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(11),
    orderType: "PROJECT",
    orderDate: "2025-01-11",
    expectedDeliveryDate: "2025-02-01",
    priority: "NORMAL",
    status: "ON_HOLD",
    customerId: mockCustomers.bangalore.id,
    customerSnapshot: mockCustomers.bangalore,
    billingAddress: mockAddresses.bangalore.billing,
    shippingAddress: mockAddresses.bangalore.shipping,
    placeOfSupply: "29",
    subtotal: 320000,
    discountAmount: 16000,
    discountPercent: 5,
    taxableAmount: 304000,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 54720,
    totalTax: 54720,
    roundOff: -20,
    grandTotal: 358700,
    paymentStatus: "PARTIAL",
    amountPaid: 100000,
    amountDue: 258700,
    advanceRequired: 100000,
    deliveryStatus: "PENDING",
    totalQuantityOrdered: 500,
    totalQuantityDelivered: 0,
    totalQuantityRemaining: 500,
    linkedInvoiceIds: [],
    linkedDeliveryIds: [],
    linkedPaymentIds: ["pay-008"],
    internalNotes: "On hold - customer requested delay due to site preparation",
    createdBy: "user-001",
    createdAt: "2025-01-11T14:00:00Z",
    updatedBy: "user-002",
    updatedAt: "2025-01-16T10:00:00Z",
    approvedBy: "user-002",
    approvedAt: "2025-01-11T14:30:00Z",
    items: [
      {
        id: "item-011-1",
        orderId: "order-011",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.rajasthanGreen, 300, 18, true, 5),
        quantityDelivered: 0,
        quantityRemaining: 300,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
      },
      {
        id: "item-011-2",
        orderId: "order-011",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.tanBrown, 200, 18, true, 5),
        quantityDelivered: 0,
        quantityRemaining: 200,
        quantityCancelled: 0,
        deliveryStatus: "PENDING",
      },
    ],
  },

  // Order 12: Sample Order
  {
    id: "order-012",
    tenantId: "tenant-001",
    storeId: "store-001",
    orderNumber: generateOrderNumber(12),
    orderType: "SAMPLE",
    orderDate: "2025-01-17",
    expectedDeliveryDate: "2025-01-20",
    priority: "LOW",
    status: "DELIVERED",
    customerId: mockCustomers.elite.id,
    customerSnapshot: mockCustomers.elite,
    billingAddress: mockAddresses.patel.billing,
    shippingAddress: mockAddresses.patel.shipping,
    placeOfSupply: "24",
    subtotal: 5000,
    discountAmount: 5000,
    discountPercent: 100,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    roundOff: 0,
    grandTotal: 0,
    paymentStatus: "PAID",
    amountPaid: 0,
    amountDue: 0,
    deliveryStatus: "COMPLETE",
    totalQuantityOrdered: 10,
    totalQuantityDelivered: 10,
    totalQuantityRemaining: 0,
    linkedInvoiceIds: [],
    linkedDeliveryIds: ["dc-006"],
    linkedPaymentIds: [],
    internalNotes: "Free sample for potential large order",
    customerNotes: "Sample pieces for client presentation",
    createdBy: "user-001",
    createdAt: "2025-01-17T15:00:00Z",
    updatedBy: "user-001",
    updatedAt: "2025-01-19T11:00:00Z",
    items: [
      {
        id: "item-012-1",
        orderId: "order-012",
        lineNumber: 1,
        ...calculateLineItem(mockProducts.whiteCarrara, 5, 18, false, 100),
        quantityDelivered: 5,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
      {
        id: "item-012-2",
        orderId: "order-012",
        lineNumber: 2,
        ...calculateLineItem(mockProducts.makranaWhite, 5, 18, false, 100),
        quantityDelivered: 5,
        quantityRemaining: 0,
        quantityCancelled: 0,
        deliveryStatus: "COMPLETE",
      },
    ],
  },
];

// =============================================================================
// MOCK DELIVERY CHALLANS
// =============================================================================

export const mockDeliveryChallans: DeliveryChallan[] = [
  {
    id: "dc-001",
    challanNumber: generateChallanNumber(1),
    orderId: "order-001",
    orderNumber: generateOrderNumber(1),
    challanDate: "2025-01-12",
    vehicleNumber: "GJ-03-AB-1234",
    driverName: "Ramesh Patel",
    driverPhone: "+91 98765 55555",
    transportMode: "OWN",
    deliveryAddress: mockAddresses.sharma.shipping,
    items: [
      {
        orderLineId: "item-001-1",
        productName: "Italian White Carrara Marble",
        hsnCode: "68022100",
        quantityDispatched: 150,
        quantityDelivered: 150,
        unit: "SQF",
      },
      {
        orderLineId: "item-001-2",
        productName: "Black Galaxy Granite",
        hsnCode: "68022300",
        quantityDispatched: 50,
        quantityDelivered: 50,
        unit: "SQF",
      },
    ],
    status: "DELIVERED",
    dispatchedAt: "2025-01-12T09:00:00Z",
    inTransitAt: "2025-01-12T10:30:00Z",
    deliveredAt: "2025-01-12T16:30:00Z",
    receivedBy: "Ramesh Sharma",
    ewayBillNumber: "321098765432",
    ewayBillDate: "2025-01-12",
    ewayBillValidUntil: "2025-01-14",
    createdBy: "user-001",
    createdAt: "2025-01-12T09:00:00Z",
  },
  {
    id: "dc-002",
    challanNumber: generateChallanNumber(2),
    orderId: "order-003",
    orderNumber: generateOrderNumber(3),
    challanDate: "2025-01-08",
    vehicleNumber: "GJ-03-CD-5678",
    driverName: "Suresh Kumar",
    driverPhone: "+91 98765 66666",
    transportMode: "THIRD_PARTY",
    transporterName: "Fast Logistics Pvt Ltd",
    lrNumber: "FL-2025-001234",
    deliveryAddress: mockAddresses.bangalore.shipping,
    items: [
      {
        orderLineId: "item-003-1",
        productName: "Rajasthan Green Marble",
        hsnCode: "68022100",
        quantityDispatched: 150,
        quantityDelivered: 150,
        unit: "SQF",
      },
    ],
    status: "DELIVERED",
    dispatchedAt: "2025-01-08T10:00:00Z",
    inTransitAt: "2025-01-08T12:00:00Z",
    deliveredAt: "2025-01-10T14:00:00Z",
    receivedBy: "Manjunath",
    ewayBillNumber: "321098765433",
    ewayBillDate: "2025-01-08",
    ewayBillValidUntil: "2025-01-12",
    createdBy: "user-001",
    createdAt: "2025-01-08T10:00:00Z",
  },
  {
    id: "dc-003",
    challanNumber: generateChallanNumber(3),
    orderId: "order-003",
    orderNumber: generateOrderNumber(3),
    challanDate: "2025-01-10",
    vehicleNumber: "GJ-03-EF-9012",
    driverName: "Mahesh Singh",
    driverPhone: "+91 98765 77777",
    transportMode: "THIRD_PARTY",
    transporterName: "Fast Logistics Pvt Ltd",
    lrNumber: "FL-2025-001235",
    deliveryAddress: mockAddresses.bangalore.shipping,
    items: [
      {
        orderLineId: "item-003-1",
        productName: "Rajasthan Green Marble",
        hsnCode: "68022100",
        quantityDispatched: 100,
        quantityDelivered: 100,
        unit: "SQF",
      },
      {
        orderLineId: "item-003-2",
        productName: "Tan Brown Granite",
        hsnCode: "68022300",
        quantityDispatched: 150,
        quantityDelivered: 150,
        unit: "SQF",
      },
    ],
    status: "DELIVERED",
    dispatchedAt: "2025-01-10T08:00:00Z",
    inTransitAt: "2025-01-10T11:00:00Z",
    deliveredAt: "2025-01-12T11:00:00Z",
    receivedBy: "Manjunath",
    ewayBillNumber: "321098765434",
    ewayBillDate: "2025-01-10",
    ewayBillValidUntil: "2025-01-14",
    createdBy: "user-001",
    createdAt: "2025-01-10T08:00:00Z",
  },
];

// =============================================================================
// MOCK ORDER PAYMENTS
// =============================================================================

export const mockOrderPayments: OrderPayment[] = [
  {
    id: "pay-001",
    receiptNumber: generateReceiptNumber(1),
    orderId: "order-001",
    orderNumber: generateOrderNumber(1),
    paymentDate: "2025-01-10",
    amount: 100000,
    paymentMode: "BANK_TRANSFER",
    referenceNumber: "UTR123456789012",
    bankName: "HDFC Bank",
    allocationType: "ADVANCE",
    receivedBy: "user-001",
    createdAt: "2025-01-10T11:00:00Z",
  },
  {
    id: "pay-002",
    receiptNumber: generateReceiptNumber(2),
    orderId: "order-001",
    orderNumber: generateOrderNumber(1),
    paymentDate: "2025-01-15",
    amount: 66750,
    paymentMode: "UPI",
    referenceNumber: "UPI987654321098",
    allocationType: "AGAINST_ORDER",
    receivedBy: "user-001",
    createdAt: "2025-01-15T14:30:00Z",
  },
  {
    id: "pay-003",
    receiptNumber: generateReceiptNumber(3),
    orderId: "order-003",
    orderNumber: generateOrderNumber(3),
    paymentDate: "2025-01-15",
    amount: 288900,
    paymentMode: "BANK_TRANSFER",
    referenceNumber: "UTR234567890123",
    bankName: "ICICI Bank",
    allocationType: "AGAINST_INVOICE",
    invoiceId: "inv-003",
    receivedBy: "user-001",
    createdAt: "2025-01-15T16:00:00Z",
  },
  {
    id: "pay-004",
    receiptNumber: generateReceiptNumber(4),
    orderId: "order-004",
    orderNumber: generateOrderNumber(4),
    paymentDate: "2025-01-16",
    amount: 83500,
    paymentMode: "CHEQUE",
    referenceNumber: "CHQ-001234",
    bankName: "SBI",
    chequeDate: "2025-01-16",
    chequeStatus: "CLEARED",
    allocationType: "AGAINST_INVOICE",
    invoiceId: "inv-004",
    receivedBy: "user-001",
    createdAt: "2025-01-16T10:30:00Z",
  },
  {
    id: "pay-005",
    receiptNumber: generateReceiptNumber(5),
    orderId: "order-005",
    orderNumber: generateOrderNumber(5),
    paymentDate: "2025-01-14",
    amount: 36200,
    paymentMode: "CASH",
    allocationType: "AGAINST_ORDER",
    notes: "Counter sale - cash payment",
    receivedBy: "user-001",
    createdAt: "2025-01-14T17:00:00Z",
  },
  {
    id: "pay-006",
    receiptNumber: generateReceiptNumber(6),
    orderId: "order-008",
    orderNumber: generateOrderNumber(8),
    paymentDate: "2025-01-16",
    amount: 1500000,
    paymentMode: "BANK_TRANSFER",
    referenceNumber: "UTR345678901234",
    bankName: "Axis Bank",
    allocationType: "ADVANCE",
    notes: "Advance payment for hotel project",
    receivedBy: "user-002",
    createdAt: "2025-01-16T12:00:00Z",
  },
  {
    id: "pay-007",
    receiptNumber: generateReceiptNumber(7),
    orderId: "order-010",
    orderNumber: generateOrderNumber(10),
    paymentDate: "2025-01-12",
    amount: 504500,
    paymentMode: "BANK_TRANSFER",
    referenceNumber: "UTR456789012345",
    bankName: "Kotak Bank",
    allocationType: "AGAINST_INVOICE",
    invoiceId: "inv-010",
    receivedBy: "user-001",
    createdAt: "2025-01-12T11:30:00Z",
  },
  {
    id: "pay-008",
    receiptNumber: generateReceiptNumber(8),
    orderId: "order-011",
    orderNumber: generateOrderNumber(11),
    paymentDate: "2025-01-11",
    amount: 100000,
    paymentMode: "BANK_TRANSFER",
    referenceNumber: "UTR567890123456",
    bankName: "HDFC Bank",
    allocationType: "ADVANCE",
    receivedBy: "user-001",
    createdAt: "2025-01-11T15:00:00Z",
  },
];

// =============================================================================
// HELPER FUNCTIONS FOR COMPONENTS
// =============================================================================

/**
 * Get a single order by ID
 */
export function getMockOrderById(id: string): Order | undefined {
  return mockOrders.find((order) => order.id === id);
}

/**
 * Get orders filtered by status
 */
export function getMockOrdersByStatus(status: OrderStatus): Order[] {
  return mockOrders.filter((order) => order.status === status);
}

/**
 * Get orders for a specific customer
 */
export function getMockOrdersByCustomer(customerId: string): Order[] {
  return mockOrders.filter((order) => order.customerId === customerId);
}

/**
 * Get delivery challans for an order
 */
export function getMockDeliveryChallansByOrder(orderId: string): DeliveryChallan[] {
  return mockDeliveryChallans.filter((challan) => challan.orderId === orderId);
}

/**
 * Get payments for an order
 */
export function getMockPaymentsByOrder(orderId: string): OrderPayment[] {
  return mockOrderPayments.filter((payment) => payment.orderId === orderId);
}

/**
 * Calculate order statistics
 */
export function getMockOrderStats(): OrderStats {
  const activeOrders = mockOrders.filter((o) => o.status !== "CANCELLED");
  
  return {
    totalOrders: mockOrders.length,
    totalValue: activeOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    draftOrders: mockOrders.filter((o) => o.status === "DRAFT").length,
    confirmedOrders: mockOrders.filter((o) => o.status === "CONFIRMED").length,
    processingOrders: mockOrders.filter((o) => o.status === "PROCESSING").length,
    partiallyDeliveredOrders: mockOrders.filter((o) => o.status === "PARTIALLY_DELIVERED").length,
    deliveredOrders: mockOrders.filter((o) => o.status === "DELIVERED" || o.status === "CLOSED").length,
    cancelledOrders: mockOrders.filter((o) => o.status === "CANCELLED").length,
    paymentPending: activeOrders.reduce((sum, o) => sum + o.amountDue, 0),
    overdueDeliveries: mockOrders.filter(
      (o) =>
        o.expectedDeliveryDate &&
        new Date(o.expectedDeliveryDate) < new Date() &&
        o.deliveryStatus !== "COMPLETE" &&
        o.status !== "CANCELLED" &&
        o.status !== "CLOSED"
    ).length,
  };
}

/**
 * Get orders with overdue delivery
 */
export function getMockOverdueOrders(): Order[] {
  const today = new Date();
  return mockOrders.filter(
    (order) =>
      order.expectedDeliveryDate &&
      new Date(order.expectedDeliveryDate) < today &&
      order.deliveryStatus !== "COMPLETE" &&
      order.status !== "CANCELLED" &&
      order.status !== "CLOSED"
  );
}

/**
 * Get orders requiring action (draft, confirmed, overdue)
 */
export function getMockActionableOrders(): Order[] {
  return mockOrders.filter(
    (order) =>
      order.status === "DRAFT" ||
      order.status === "CONFIRMED" ||
      order.status === "PROCESSING"
  );
}

/**
 * Get top customers by order value
 */
export function getMockTopCustomers(limit: number = 5): Array<{
  customerId: string;
  customerName: string;
  orderCount: number;
  totalValue: number;
}> {
  const customerMap: Record<string, { name: string; count: number; value: number }> = {};

  mockOrders
    .filter((o) => o.status !== "CANCELLED")
    .forEach((order) => {
      if (!customerMap[order.customerId]) {
        customerMap[order.customerId] = {
          name: order.customerSnapshot.name,
          count: 0,
          value: 0,
        };
      }
      customerMap[order.customerId].count += 1;
      customerMap[order.customerId].value += order.grandTotal;
    });

  return Object.entries(customerMap)
    .map(([id, data]) => ({
      customerId: id,
      customerName: data.name,
      orderCount: data.count,
      totalValue: data.value,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);
}
