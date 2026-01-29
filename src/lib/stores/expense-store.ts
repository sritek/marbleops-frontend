/**
 * Expense Management Store with Zustand + LocalStorage Persistence
 * Enables full expense tracking: create, update, mark paid, cancel
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  CreateExpenseInput,
} from "@/types";
import { mockExpenses } from "@/lib/mock/expenses";

// =============================================================================
// TYPES
// =============================================================================

interface ExpenseStoreState {
  // Data
  expenses: Expense[];

  // Counters for generating IDs
  expenseIdCounter: number;
}

interface ExpenseStoreActions {
  // Expense Actions
  addExpense: (data: CreateExpenseInput) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  markAsPaid: (id: string, paymentMethod: PaymentMethod, reference?: string) => void;
  cancelExpense: (id: string) => void;
  getExpenseById: (id: string) => Expense | undefined;
  getExpensesByCategory: (category: ExpenseCategory) => Expense[];
  getExpensesByVendor: (vendorId: string) => Expense[];
  getExpensesByStatus: (status: ExpenseStatus) => Expense[];
  getRecurringExpenses: () => Expense[];

  // Utility
  resetToMockData: () => void;
}

type ExpenseStore = ExpenseStoreState & ExpenseStoreActions;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateExpenseNumber(counter: number): string {
  return `EXP-2526-${String(counter).padStart(4, "0")}`;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const getInitialState = (): ExpenseStoreState => ({
  expenses: [...mockExpenses],
  expenseIdCounter: mockExpenses.length + 1,
});

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // =========================================================================
      // EXPENSE ACTIONS
      // =========================================================================

      addExpense: (data) => {
        const state = get();
        const newCounter = state.expenseIdCounter;
        const now = new Date().toISOString();

        // Calculate total amount
        const totalAmount = data.amount + (data.gstAmount || 0);

        // Create the expense
        const newExpense: Expense = {
          id: `exp-${String(newCounter).padStart(3, "0")}`,
          expenseNumber: generateExpenseNumber(newCounter),
          tenantId: "tenant-001",
          storeId: "store-001",
          
          // Core details
          category: data.category,
          description: data.description,
          date: data.date,
          
          // Amounts
          amount: data.amount,
          gstAmount: data.gstAmount,
          gstRate: data.gstRate,
          totalAmount,
          
          // Vendor
          vendorId: data.vendorId,
          vendorName: data.vendorName,
          
          // Bill details
          billNumber: data.billNumber,
          billDate: data.billDate,
          
          // Payment
          status: data.status || "PENDING",
          paidDate: data.paidDate,
          paymentMethod: data.paymentMethod,
          paymentReference: data.paymentReference,
          
          // Recurring
          isRecurring: data.isRecurring || false,
          recurringFrequency: data.recurringFrequency,
          recurringEndDate: data.recurringEndDate,
          
          // Audit
          createdBy: "user-001",
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          expenses: [newExpense, ...state.expenses],
          expenseIdCounter: newCounter + 1,
        }));

        return newExpense;
      },

      updateExpense: (id, updates) => {
        const now = new Date().toISOString();

        // If amount or gstAmount changed, recalculate total
        let totalAmount = updates.totalAmount;
        if (updates.amount !== undefined || updates.gstAmount !== undefined) {
          const expense = get().expenses.find((e) => e.id === id);
          if (expense) {
            const amount = updates.amount ?? expense.amount;
            const gstAmount = updates.gstAmount ?? expense.gstAmount ?? 0;
            totalAmount = amount + gstAmount;
          }
        }

        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id
              ? {
                  ...expense,
                  ...updates,
                  totalAmount: totalAmount ?? expense.totalAmount,
                  updatedAt: now,
                }
              : expense
          ),
        }));
      },

      markAsPaid: (id, paymentMethod, reference) => {
        const now = new Date().toISOString();

        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id
              ? {
                  ...expense,
                  status: "PAID" as ExpenseStatus,
                  paidDate: now,
                  paymentMethod,
                  paymentReference: reference,
                  updatedAt: now,
                }
              : expense
          ),
        }));
      },

      cancelExpense: (id) => {
        const now = new Date().toISOString();

        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id
              ? {
                  ...expense,
                  status: "CANCELLED" as ExpenseStatus,
                  updatedAt: now,
                }
              : expense
          ),
        }));
      },

      getExpenseById: (id) => {
        return get().expenses.find((expense) => expense.id === id);
      },

      getExpensesByCategory: (category) => {
        return get().expenses.filter((expense) => expense.category === category);
      },

      getExpensesByVendor: (vendorId) => {
        return get().expenses.filter((expense) => expense.vendorId === vendorId);
      },

      getExpensesByStatus: (status) => {
        return get().expenses.filter((expense) => expense.status === status);
      },

      getRecurringExpenses: () => {
        return get().expenses.filter((expense) => expense.isRecurring);
      },

      // =========================================================================
      // UTILITY ACTIONS
      // =========================================================================

      resetToMockData: () => {
        set(getInitialState());
      },
    }),
    {
      name: "expense-store",
      partialize: (state) => ({
        expenses: state.expenses,
        expenseIdCounter: state.expenseIdCounter,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Get all expenses with optional filtering
 */
export function useExpenses(filters?: {
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  vendorId?: string;
  search?: string;
}) {
  return useExpenseStore((state) => {
    let expenses = state.expenses;

    if (filters?.category) {
      expenses = expenses.filter((e) => e.category === filters.category);
    }

    if (filters?.status) {
      expenses = expenses.filter((e) => e.status === filters.status);
    }

    if (filters?.vendorId) {
      expenses = expenses.filter((e) => e.vendorId === filters.vendorId);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      expenses = expenses.filter(
        (e) =>
          e.description.toLowerCase().includes(searchLower) ||
          e.expenseNumber.toLowerCase().includes(searchLower) ||
          e.vendorName?.toLowerCase().includes(searchLower) ||
          e.billNumber?.toLowerCase().includes(searchLower)
      );
    }

    return expenses;
  });
}

/**
 * Get expense by ID
 */
export function useExpenseById(id: string) {
  return useExpenseStore((state) => state.expenses.find((e) => e.id === id));
}

/**
 * Get expense statistics
 */
export function getExpenseStats() {
  const expenses = useExpenseStore.getState().expenses;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const activeExpenses = expenses.filter((e) => e.status !== "CANCELLED");
  const thisMonthExpenses = activeExpenses.filter((e) => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  return {
    totalExpenses: activeExpenses.reduce((sum, e) => sum + e.totalAmount, 0),
    thisMonthTotal: thisMonthExpenses.reduce((sum, e) => sum + e.totalAmount, 0),
    gstClaimable: activeExpenses
      .filter((e) => e.status === "PAID" && e.gstAmount)
      .reduce((sum, e) => sum + (e.gstAmount || 0), 0),
    pendingPayment: activeExpenses
      .filter((e) => e.status === "PENDING")
      .reduce((sum, e) => sum + e.totalAmount, 0),
    expenseCount: activeExpenses.length,
    pendingCount: activeExpenses.filter((e) => e.status === "PENDING").length,
    recurringCount: activeExpenses.filter((e) => e.isRecurring).length,
  };
}
