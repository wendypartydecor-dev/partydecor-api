import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  tenantId: string | null;
  tenantName: string | null;
  login: (userId: string, tenantId: string, tenantName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  tenantId: null,
  tenantName: null,
  login: (userId, tenantId, tenantName) =>
    set({ isAuthenticated: true, userId, tenantId, tenantName }),
  logout: () =>
    set({ isAuthenticated: false, userId: null, tenantId: null, tenantName: null }),
}));
