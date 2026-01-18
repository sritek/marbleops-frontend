import { config } from "@/config";
import type { ApiError, ApiResponse } from "@/types";

/**
 * API Client for MarbleOps Backend
 * Handles authentication, error handling, and request/response formatting
 */

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody = unknown> {
  method?: RequestMethod;
  body?: TBody;
  headers?: Record<string, string>;
  /** Skip adding auth token */
  skipAuth?: boolean;
  /** Custom store ID override */
  storeId?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get auth token from storage
   */
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(config.storage.tokenKey);
  }

  /**
   * Get current store ID from storage
   */
  private getStoreId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(config.storage.storeKey);
  }

  /**
   * Build request headers
   */
  private buildHeaders(options: RequestOptions): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token
    if (!options.skipAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    // Add store ID
    const storeId = options.storeId || this.getStoreId();
    if (storeId) {
      headers["X-Store-Id"] = storeId;
    }

    return headers;
  }

  /**
   * Handle API errors
   * @param response - The fetch response
   * @param skipAuth - Whether this was a public request (no auth required)
   */
  private async handleError(response: Response, skipAuth?: boolean): Promise<never> {
    let errorData: Partial<ApiError>;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: response.statusText || "An error occurred",
      };
    }

    const error: ApiError = {
      message: errorData.message || "An error occurred",
      code: errorData.code,
      statusCode: response.status,
      requestId: errorData.requestId,
    };

    // Handle 401 - unauthorized (only for authenticated requests)
    if (response.status === 401 && typeof window !== "undefined") {
      // Don't redirect if:
      // 1. This was a public request (skipAuth = true, like login)
      // 2. Already on the login page
      const isLoginPage = window.location.pathname === "/login";
      
      if (!skipAuth && !isLoginPage) {
        // Clear auth data
        localStorage.removeItem(config.storage.tokenKey);
        localStorage.removeItem(config.storage.userKey);
        // Redirect to login
        window.location.href = "/login";
      }
    }

    throw error;
  }

  /**
   * Make an API request
   */
  async request<TResponse, TBody = unknown>(
    endpoint: string,
    options: RequestOptions<TBody> = {}
  ): Promise<TResponse> {
    const { method = "GET", body } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(options);

    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      await this.handleError(response, options.skipAuth);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as TResponse;
    }

    return response.json();
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  post<T, B = unknown>(endpoint: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T, B>(endpoint, { ...options, method: "POST", body });
  }

  /**
   * PUT request
   */
  put<T, B = unknown>(endpoint: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T, B>(endpoint, { ...options, method: "PUT", body });
  }

  /**
   * PATCH request
   */
  patch<T, B = unknown>(endpoint: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T, B>(endpoint, { ...options, method: "PATCH", body });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

/**
 * API client instance
 */
export const api = new ApiClient(config.api.baseUrl);

/**
 * Helper to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "statusCode" in error
  );
}
