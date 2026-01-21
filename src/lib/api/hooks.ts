"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { api, isApiError } from "./client";
import { toast } from "sonner";
import type {
  Inventory,
  Party,
  Order,
  Invoice,
  Payment,
  Store,
  User,
  DashboardStats,
  DashboardStatsParams,
  CreateInventoryInput,
  CreatePartyInput,
  CreateOrderInput,
  CreateInvoiceInput,
  RecordPaymentInput,
  CreateUserInput,
  UpdateUserInput,
  CreateStoreInput,
  UpdateStoreInput,
} from "@/types";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const queryKeys = {
  // Dashboard
  dashboard: ["dashboard"] as const,
  dashboardStats: (params?: DashboardStatsParams) => ["dashboard", "stats", params] as const,

  // Stores
  stores: ["stores"] as const,
  store: (id: string) => ["stores", id] as const,

  // Users
  users: ["users"] as const,
  user: (id: string) => ["users", id] as const,

  // Inventory
  inventory: ["inventory"] as const,
  inventoryList: (filters?: Record<string, unknown>) => ["inventory", "list", filters] as const,
  inventoryItem: (id: string) => ["inventory", id] as const,

  // Parties
  parties: ["parties"] as const,
  partiesList: (filters?: Record<string, unknown>) => ["parties", "list", filters] as const,
  party: (id: string) => ["parties", id] as const,
  partyLedger: (id: string) => ["parties", id, "ledger"] as const,

  // Orders
  orders: ["orders"] as const,
  ordersList: (filters?: Record<string, unknown>) => ["orders", "list", filters] as const,
  order: (id: string) => ["orders", id] as const,

  // Invoices
  invoices: ["invoices"] as const,
  invoicesList: (filters?: Record<string, unknown>) => ["invoices", "list", filters] as const,
  invoice: (id: string) => ["invoices", id] as const,

  // Payments
  payments: ["payments"] as const,
  paymentsList: (filters?: Record<string, unknown>) => ["payments", "list", filters] as const,
  payment: (id: string) => ["payments", id] as const,

  // Reports
  reports: ["reports"] as const,
  salesReport: (params?: Record<string, unknown>) => ["reports", "sales", params] as const,
  stockReport: (params?: Record<string, unknown>) => ["reports", "stock", params] as const,
};

// =============================================================================
// DASHBOARD HOOKS
// =============================================================================

export function useDashboardStats(params?: DashboardStatsParams) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.set("startDate", params.startDate);
      if (params?.endDate) searchParams.set("endDate", params.endDate);
      
      const queryString = searchParams.toString();
      return api.get<DashboardStats>(`/reports/dashboard${queryString ? `?${queryString}` : ""}`);
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// =============================================================================
// STORE HOOKS
// =============================================================================

export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores,
    queryFn: () => api.get<Store[]>("/stores"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: queryKeys.store(id),
    queryFn: () => api.get<Store>(`/stores/${id}`),
    enabled: !!id,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoreInput) =>
      api.post<Store>("/stores", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores });
      toast.success("Store created successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to create store";
      toast.error(message);
    },
  });
}

export function useUpdateStore(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStoreInput) =>
      api.put<Store>(`/stores/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores });
      queryClient.invalidateQueries({ queryKey: queryKeys.store(id) });
      toast.success("Store updated successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to update store";
      toast.error(message);
    },
  });
}

// =============================================================================
// USER HOOKS
// =============================================================================

export function useUsers(filters?: {
  role?: string;
  storeId?: string;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ["users", "list", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.role) params.set("role", filters.role);
      if (filters?.storeId) params.set("storeId", filters.storeId);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.isActive !== undefined) params.set("isActive", String(filters.isActive));

      const queryString = params.toString();
      return api.get<User[]>(`/users${queryString ? `?${queryString}` : ""}`);
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      api.post<User>("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success("User created successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to create user";
      toast.error(message);
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserInput) =>
      api.put<User>(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
      toast.success("User updated successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to update user";
      toast.error(message);
    },
  });
}

// =============================================================================
// INVENTORY HOOKS
// =============================================================================

export function useInventoryList(filters?: {
  status?: string;
  materialType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.inventoryList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.materialType) params.set("materialType", filters.materialType);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      return api.get<Inventory[]>(`/inventory${queryString ? `?${queryString}` : ""}`);
    },
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: queryKeys.inventoryItem(id),
    queryFn: () => api.get<Inventory>(`/inventory/${id}`),
    enabled: !!id,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryInput) =>
      api.post<Inventory>("/inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      toast.success("Item added successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to add item";
      toast.error(message);
    },
  });
}

export function useUpdateInventory(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateInventoryInput>) =>
      api.put<Inventory>(`/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItem(id) });
      toast.success("Item updated successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to update item";
      toast.error(message);
    },
  });
}

// =============================================================================
// PARTY HOOKS
// =============================================================================

export function useParties(filters?: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.partiesList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      return api.get<Party[]>(`/parties${queryString ? `?${queryString}` : ""}`);
    },
  });
}

export function useParty(id: string) {
  return useQuery({
    queryKey: queryKeys.party(id),
    queryFn: () => api.get<Party>(`/parties/${id}`),
    enabled: !!id,
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePartyInput) => api.post<Party>("/parties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties });
      toast.success("Party added successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to add party";
      toast.error(message);
    },
  });
}

export function useUpdateParty(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreatePartyInput>) =>
      api.put<Party>(`/parties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties });
      queryClient.invalidateQueries({ queryKey: queryKeys.party(id) });
      toast.success("Party updated successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to update party";
      toast.error(message);
    },
  });
}

// =============================================================================
// ORDER HOOKS
// =============================================================================

export function useOrders(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.ordersList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      return api.get<Order[]>(`/orders${queryString ? `?${queryString}` : ""}`);
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => api.post<Order>("/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      toast.success("Order created successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to create order";
      toast.error(message);
    },
  });
}

export function useUpdateOrderStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: string) =>
      api.put<Order>(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      toast.success("Order status updated");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to update order";
      toast.error(message);
    },
  });
}

// =============================================================================
// INVOICE HOOKS
// =============================================================================

export function useInvoices(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.invoicesList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      return api.get<Invoice[]>(`/invoices${queryString ? `?${queryString}` : ""}`);
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: () => api.get<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) =>
      api.post<Invoice>("/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success("Invoice created successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to create invoice";
      toast.error(message);
    },
  });
}

// =============================================================================
// PAYMENT HOOKS
// =============================================================================

export function usePayments(filters?: {
  type?: string;
  method?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.paymentsList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.method) params.set("method", filters.method);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      return api.get<Payment[]>(`/payments${queryString ? `?${queryString}` : ""}`);
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payment(id),
    queryFn: () => api.get<Payment>(`/payments/${id}`),
    enabled: !!id,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentInput) =>
      api.post<Payment>("/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.parties });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success("Payment recorded successfully");
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Failed to record payment";
      toast.error(message);
    },
  });
}
