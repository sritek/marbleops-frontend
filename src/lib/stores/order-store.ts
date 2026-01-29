/**
 * Order Management Store with Zustand + LocalStorage Persistence
 * 
 * @deprecated This store is being phased out in favor of backend API integration.
 * Main order operations (list, create, view, update status) now use React Query hooks from @/lib/api.
 * 
 * This store is still used by:
 * - /orders/[id]/payments/new - Payments feature (not yet in backend)
 * - /orders/[id]/deliveries/new - Deliveries feature (not yet in backend)
 * 
 * TODO: Remove this store once payments and deliveries are migrated to backend API.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Order,
  OrderStatus,
  DeliveryChallan,
  OrderPayment,
  DeliveryStatus,
  PaymentStatus,
  OrderLineItem,
  DeliveryChallanItem,
  PaymentMode,
} from "@/types";
import {
  mockOrders,
  mockDeliveryChallans,
  mockOrderPayments,
} from "@/lib/mock/orders";

// =============================================================================
// TYPES
// =============================================================================

interface OrderStoreState {
  // Data
  orders: Order[];
  deliveryChallans: DeliveryChallan[];
  payments: OrderPayment[];

  // Counters for generating IDs
  orderIdCounter: number;
  challanIdCounter: number;
  paymentIdCounter: number;
}

interface OrderStoreActions {
  // Order Actions
  addOrder: (orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus, reason?: string) => void;
  getOrderById: (id: string) => Order | undefined;

  // Delivery Actions
  addDeliveryChallan: (challanData: {
    orderId: string;
    challanDate: string;
    transportMode: DeliveryChallan["transportMode"];
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    transporterName?: string;
    lrNumber?: string;
    ewayBillNumber?: string;
    ewayBillDate?: string;
    notes?: string;
    items: Array<{
      orderLineId: string;
      productName: string;
      hsnCode: string;
      quantityToDeliver: number;
      unit: string;
    }>;
  }) => DeliveryChallan;
  updateChallanStatus: (
    challanId: string,
    status: DeliveryChallan["status"]
  ) => void;
  getDeliveriesByOrder: (orderId: string) => DeliveryChallan[];

  // Payment Actions
  addPayment: (paymentData: {
    orderId: string;
    paymentDate: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string;
    bankName?: string;
    chequeNumber?: string;
    chequeDate?: string;
    allocationType: "ADVANCE" | "AGAINST_ORDER" | "AGAINST_INVOICE";
    notes?: string;
  }) => OrderPayment;
  getPaymentsByOrder: (orderId: string) => OrderPayment[];

  // Utility
  resetToMockData: () => void;
}

type OrderStore = OrderStoreState & OrderStoreActions;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateOrderNumber(counter: number): string {
  return `ORD-2526-${String(counter).padStart(4, "0")}`;
}

function generateChallanNumber(counter: number): string {
  return `DC-2526-${String(counter).padStart(4, "0")}`;
}

function generateReceiptNumber(counter: number): string {
  return `RCP-2526-${String(counter).padStart(4, "0")}`;
}

function calculateDeliveryStatus(
  totalOrdered: number,
  totalDelivered: number
): DeliveryStatus {
  if (totalDelivered === 0) return "PENDING";
  if (totalDelivered >= totalOrdered) return "COMPLETE";
  return "PARTIAL";
}

function calculatePaymentStatus(
  grandTotal: number,
  amountPaid: number
): PaymentStatus {
  if (amountPaid === 0) return "UNPAID";
  if (amountPaid >= grandTotal) return "PAID";
  if (amountPaid > grandTotal) return "OVERPAID";
  return "PARTIAL";
}

function calculateOrderStatusFromDelivery(
  currentStatus: OrderStatus,
  deliveryStatus: DeliveryStatus
): OrderStatus {
  // Don't change status if cancelled, closed, or draft
  if (
    currentStatus === "CANCELLED" ||
    currentStatus === "CLOSED" ||
    currentStatus === "DRAFT" ||
    currentStatus === "ON_HOLD"
  ) {
    return currentStatus;
  }

  if (deliveryStatus === "COMPLETE") {
    return "DELIVERED";
  }
  if (deliveryStatus === "PARTIAL") {
    return "PARTIALLY_DELIVERED";
  }
  return currentStatus;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const getInitialState = (): OrderStoreState => ({
  orders: [...mockOrders],
  deliveryChallans: [...mockDeliveryChallans],
  payments: [...mockOrderPayments],
  orderIdCounter: 13, // Start after mock data (12 orders)
  challanIdCounter: 7, // Start after mock challans
  paymentIdCounter: 9, // Start after mock payments
});

// =============================================================================
// STORE
// =============================================================================

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...getInitialState(),

      // =========================================================================
      // ORDER ACTIONS
      // =========================================================================

      addOrder: (orderData) => {
        const state = get();
        const newCounter = state.orderIdCounter + 1;
        const now = new Date().toISOString();

        const newOrder: Order = {
          ...orderData,
          id: `order-${String(newCounter).padStart(3, "0")}`,
          orderNumber: generateOrderNumber(newCounter),
          createdAt: now,
          updatedAt: now,
          status: "DRAFT",
          paymentStatus: "UNPAID",
          deliveryStatus: "PENDING",
          amountPaid: 0,
          amountDue: orderData.grandTotal,
          totalQuantityDelivered: 0,
          linkedInvoiceIds: [],
          linkedDeliveryIds: [],
          linkedPaymentIds: [],
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          orderIdCounter: newCounter,
        }));

        return newOrder;
      },

      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id
              ? { ...order, ...updates, updatedAt: new Date().toISOString() }
              : order
          ),
        }));
      },

      updateOrderStatus: (id, status, reason) => {
        const now = new Date().toISOString();

        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== id) return order;

            const updates: Partial<Order> = {
              status,
              updatedAt: now,
            };

            // Handle specific status transitions
            if (status === "CONFIRMED" && order.status === "DRAFT") {
              updates.approvedAt = now;
              updates.approvedBy = "user-001"; // Current user in real app
            }

            if (status === "CANCELLED") {
              updates.cancelledAt = now;
              updates.cancelledBy = "user-001";
              updates.cancellationReason = reason;
            }

            return { ...order, ...updates };
          }),
        }));
      },

      getOrderById: (id) => {
        return get().orders.find((order) => order.id === id);
      },

      // =========================================================================
      // DELIVERY ACTIONS
      // =========================================================================

      addDeliveryChallan: (challanData) => {
        const state = get();
        const newCounter = state.challanIdCounter + 1;
        const now = new Date().toISOString();

        // Get the order
        const order = state.orders.find((o) => o.id === challanData.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Create challan items
        const challanItems: DeliveryChallanItem[] = challanData.items.map(
          (item) => ({
            orderLineId: item.orderLineId,
            productName: item.productName,
            hsnCode: item.hsnCode,
            quantityDispatched: item.quantityToDeliver,
            quantityDelivered: item.quantityToDeliver,
            unit: item.unit as DeliveryChallanItem["unit"],
          })
        );

        // Create the challan with DISPATCHED status
        const newChallan: DeliveryChallan = {
          id: `dc-${String(newCounter).padStart(3, "0")}`,
          challanNumber: generateChallanNumber(newCounter),
          orderId: challanData.orderId,
          orderNumber: order.orderNumber,
          challanDate: challanData.challanDate,
          vehicleNumber: challanData.vehicleNumber,
          driverName: challanData.driverName,
          driverPhone: challanData.driverPhone,
          transportMode: challanData.transportMode,
          transporterName: challanData.transporterName,
          lrNumber: challanData.lrNumber,
          ewayBillNumber: challanData.ewayBillNumber,
          ewayBillDate: challanData.ewayBillDate,
          deliveryAddress: order.shippingAddress,
          items: challanItems,
          status: "DISPATCHED", // Start as dispatched, update to DELIVERED when confirmed
          dispatchedAt: now,
          deliveredAt: undefined,
          createdBy: "user-001",
          createdAt: now,
        };

        // Note: Order delivery totals and status are NOT updated on dispatch.
        // They will be updated when challan is marked as DELIVERED via updateChallanStatus.

        set((state) => ({
          deliveryChallans: [newChallan, ...state.deliveryChallans],
          challanIdCounter: newCounter,
          orders: state.orders.map((o) =>
            o.id === challanData.orderId
              ? {
                  ...o,
                  linkedDeliveryIds: [...o.linkedDeliveryIds, newChallan.id],
                  updatedAt: now,
                }
              : o
          ),
        }));

        return newChallan;
      },

      getDeliveriesByOrder: (orderId) => {
        return get().deliveryChallans.filter(
          (challan) => challan.orderId === orderId
        );
      },

      updateChallanStatus: (challanId, status) => {
        const state = get();
        const now = new Date().toISOString();

        // Find the challan
        const challan = state.deliveryChallans.find((c) => c.id === challanId);
        if (!challan) {
          throw new Error("Challan not found");
        }

        // Find the order
        const order = state.orders.find((o) => o.id === challan.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Update challan with new status and appropriate timestamp
        const updatedChallan: DeliveryChallan = {
          ...challan,
          status,
          inTransitAt: status === "IN_TRANSIT" ? now : challan.inTransitAt,
          deliveredAt: status === "DELIVERED" ? now : challan.deliveredAt,
        };

        // If marking as DELIVERED, update order delivery totals and status
        if (status === "DELIVERED") {
          // Calculate quantities from this challan
          const deliveredInChallan = challan.items.reduce(
            (sum, item) => sum + item.quantityDispatched,
            0
          );
          const newTotalDelivered = order.totalQuantityDelivered + deliveredInChallan;
          const newTotalRemaining = order.totalQuantityOrdered - newTotalDelivered;

          // Update order line items
          const updatedItems = order.items?.map((item) => {
            const challanItem = challan.items.find(
              (ci) => ci.orderLineId === item.id
            );
            if (!challanItem) return item;

            const newDelivered = item.quantityDelivered + challanItem.quantityDispatched;
            const newRemaining = item.quantityOrdered - newDelivered;

            return {
              ...item,
              quantityDelivered: newDelivered,
              quantityRemaining: newRemaining,
              deliveryStatus:
                newRemaining === 0
                  ? "COMPLETE"
                  : newDelivered > 0
                  ? "PARTIAL"
                  : "PENDING",
            } as OrderLineItem;
          });

          // Calculate new delivery status
          const newDeliveryStatus = calculateDeliveryStatus(
            order.totalQuantityOrdered,
            newTotalDelivered
          );

          // Calculate new order status
          const newOrderStatus = calculateOrderStatusFromDelivery(
            order.status,
            newDeliveryStatus
          );

          set((state) => ({
            deliveryChallans: state.deliveryChallans.map((c) =>
              c.id === challanId ? updatedChallan : c
            ),
            orders: state.orders.map((o) =>
              o.id === challan.orderId
                ? {
                    ...o,
                    totalQuantityDelivered: newTotalDelivered,
                    totalQuantityRemaining: newTotalRemaining,
                    deliveryStatus: newDeliveryStatus,
                    status: newOrderStatus,
                    items: updatedItems,
                    updatedAt: now,
                  }
                : o
            ),
          }));
        } else {
          // Just update the challan status (IN_TRANSIT)
          set((state) => ({
            deliveryChallans: state.deliveryChallans.map((c) =>
              c.id === challanId ? updatedChallan : c
            ),
          }));
        }
      },

      // =========================================================================
      // PAYMENT ACTIONS
      // =========================================================================

      addPayment: (paymentData) => {
        const state = get();
        const newCounter = state.paymentIdCounter + 1;
        const now = new Date().toISOString();

        // Get the order
        const order = state.orders.find((o) => o.id === paymentData.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Create the payment
        const newPayment: OrderPayment = {
          id: `pay-${String(newCounter).padStart(3, "0")}`,
          receiptNumber: generateReceiptNumber(newCounter),
          orderId: paymentData.orderId,
          orderNumber: order.orderNumber,
          paymentDate: paymentData.paymentDate,
          amount: paymentData.amount,
          paymentMode: paymentData.paymentMode,
          referenceNumber: paymentData.referenceNumber,
          bankName: paymentData.bankName,
          chequeDate: paymentData.chequeDate,
          allocationType: paymentData.allocationType,
          notes: paymentData.notes,
          receivedBy: "user-001",
          createdAt: now,
        };

        // Calculate new payment totals
        const newAmountPaid = order.amountPaid + paymentData.amount;
        const newAmountDue = Math.max(0, order.grandTotal - newAmountPaid);
        const newPaymentStatus = calculatePaymentStatus(
          order.grandTotal,
          newAmountPaid
        );

        set((state) => ({
          payments: [newPayment, ...state.payments],
          paymentIdCounter: newCounter,
          orders: state.orders.map((o) =>
            o.id === paymentData.orderId
              ? {
                  ...o,
                  amountPaid: newAmountPaid,
                  amountDue: newAmountDue,
                  paymentStatus: newPaymentStatus,
                  linkedPaymentIds: [...o.linkedPaymentIds, newPayment.id],
                  updatedAt: now,
                }
              : o
          ),
        }));

        return newPayment;
      },

      getPaymentsByOrder: (orderId) => {
        return get().payments.filter((payment) => payment.orderId === orderId);
      },

      // =========================================================================
      // UTILITY ACTIONS
      // =========================================================================

      resetToMockData: () => {
        set(getInitialState());
      },
    }),
    {
      name: "order-store", // localStorage key
      version: 1,
      partialize: (state) => ({
        orders: state.orders,
        deliveryChallans: state.deliveryChallans,
        payments: state.payments,
        orderIdCounter: state.orderIdCounter,
        challanIdCounter: state.challanIdCounter,
        paymentIdCounter: state.paymentIdCounter,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS (for performance optimization)
// =============================================================================

export const useOrders = () => useOrderStore((state) => state.orders);
export const useOrderById = (id: string) =>
  useOrderStore((state) => state.orders.find((o) => o.id === id));
export const useDeliveriesByOrder = (orderId: string) =>
  useOrderStore((state) =>
    state.deliveryChallans.filter((c) => c.orderId === orderId)
  );
export const usePaymentsByOrder = (orderId: string) =>
  useOrderStore((state) =>
    state.payments.filter((p) => p.orderId === orderId)
  );

// =============================================================================
// STATS HELPER
// =============================================================================

export function getOrderStats(orders: Order[]) {
  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");

  return {
    totalOrders: orders.length,
    totalValue: activeOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    draftOrders: orders.filter((o) => o.status === "DRAFT").length,
    confirmedOrders: orders.filter((o) => o.status === "CONFIRMED").length,
    processingOrders: orders.filter((o) => o.status === "PROCESSING").length,
    partiallyDeliveredOrders: orders.filter(
      (o) => o.status === "PARTIALLY_DELIVERED"
    ).length,
    deliveredOrders: orders.filter(
      (o) => o.status === "DELIVERED" || o.status === "CLOSED"
    ).length,
    cancelledOrders: orders.filter((o) => o.status === "CANCELLED").length,
    paymentPending: activeOrders.reduce((sum, o) => sum + o.amountDue, 0),
    overdueDeliveries: orders.filter(
      (o) =>
        o.expectedDeliveryDate &&
        new Date(o.expectedDeliveryDate) < new Date() &&
        o.deliveryStatus !== "COMPLETE" &&
        o.status !== "CANCELLED" &&
        o.status !== "CLOSED"
    ).length,
  };
}
