"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { config } from "@/config";
import { api, isApiError } from "@/lib/api";
import type { User, LoginInput, Permission } from "@/types";
import { ROLE_PERMISSIONS } from "@/config/permissions";

interface AuthContextValue {
  /** Current authenticated user */
  user: User | null;
  /** Whether auth is being checked */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Login with phone and password */
  login: (input: LoginInput) => Promise<void>;
  /** Sign out */
  signOut: () => void;
  /** Check if user has permission */
  hasPermission: (permission: Permission) => boolean;
  /** Check if user has any of the permissions */
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Initialize auth state from storage
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem(config.storage.userKey);
        const token = localStorage.getItem(config.storage.tokenKey);

        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser) as User;
          // Add permissions based on role
          parsedUser.permissions = ROLE_PERMISSIONS[parsedUser.role] || [];
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // Clear invalid data
        localStorage.removeItem(config.storage.tokenKey);
        localStorage.removeItem(config.storage.userKey);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login with phone and password
   */
  const login = async (input: LoginInput): Promise<void> => {
    try {
      const response = await api.post<{ token: string; user: User }>(
        "/auth/login",
        input,
        { skipAuth: true }
      );

      // Store token and user
      localStorage.setItem(config.storage.tokenKey, response.token);
      
      // Add permissions based on role
      const userWithPermissions: User = {
        ...response.user,
        permissions: ROLE_PERMISSIONS[response.user.role] || [],
      };
      
      localStorage.setItem(
        config.storage.userKey,
        JSON.stringify(userWithPermissions)
      );

      // Store default store ID if user has one
      if (response.user.storeId) {
        localStorage.setItem(config.storage.storeKey, response.user.storeId);
      }

      setUser(userWithPermissions);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      if (isApiError(error)) {
        throw new Error(error.message);
      }
      throw new Error("Login failed. Please try again.");
    }
  };

  /**
   * Sign out
   */
  const signOut = (): void => {
    localStorage.removeItem(config.storage.tokenKey);
    localStorage.removeItem(config.storage.userKey);
    localStorage.removeItem(config.storage.storeKey);
    setUser(null);
    router.push("/login");
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some((p) => user.permissions.includes(p));
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signOut,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user has permission
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook to check if user has any of the permissions
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(permissions);
}
