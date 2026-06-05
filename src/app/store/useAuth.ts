import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string | string[];
  permissions?: string[];
  department?: string;
  employeeId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (token: string | null) =>
        set({
          token,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      hasRole: (role: string) => {
        const state = get();
        if (!state.user) return false;
        const userRoles = Array.isArray(state.user.role)
          ? state.user.role
          : [state.user.role];
        return userRoles.includes(role);
      },

      hasPermission: (permission: string) => {
        const state = get();
        if (!state.user) return false;
        return (state.user.permissions || []).includes(permission);
      },

      hasAnyRole: (roles: string[]) => {
        const state = get();
        if (!state.user) return false;
        const userRoles = Array.isArray(state.user.role)
          ? state.user.role
          : [state.user.role];
        return roles.some((role) => userRoles.includes(role));
      },

      hasAllPermissions: (permissions: string[]) => {
        const state = get();
        if (!state.user) return false;
        return permissions.every((perm) => (state.user?.permissions || []).includes(perm));
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
