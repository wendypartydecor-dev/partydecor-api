'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TenantFromDb } from '@aurea/core/supabase/client';
import type { TenantSummary, TenantSelectorStatus } from '@aurea/ui/src/tenant-selector/tenant-selector.types';

interface AuthContextType {
  user: { id: string; email: string; displayName: string; avatarInitials: string } | null;
  tenants: TenantSummary[];
  tenantStatus: TenantSelectorStatus;
  selectingTenantId: string | null;
  error: string | null;
  loginWithPin: (email: string, pin: string) => Promise<{ error: string | null }>;
  selectTenant: (tenant: TenantSummary) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapDbTenantToUi(row: TenantFromDb, lastUsedId: string | null): TenantSummary {
  return {
    id: row.empresa_id,
    nombre: row.empresa_nombre,
    iniciales: row.empresa_nombre_corto.substring(0, 2).toUpperCase(),
    logoUrl: row.empresa_logo,
    accentColor: row.empresa_color ?? 'oklch(55% 0.08 260)',
    rolEmpresa: row.rol,
    isLastUsed: row.empresa_id === lastUsedId,
    meta: {
      lastAccessAt: null,
      upcomingEventCount: 0,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [tenantStatus, setTenantStatus] = useState<TenantSelectorStatus>('loading');
  const [selectingTenantId, setSelectingTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async (userId: string) => {
    setTenantStatus('loading');
    
    const lastUsedId = typeof window !== 'undefined'
      ? localStorage.getItem('aurea_last_tenant_id')
      : null;

    const { data, error: fetchError } = await supabase
      .from('v_usuarios_empresas')
      .select('*')
      .eq('usuario_id', userId);

    if (fetchError) {
      console.error('Fetch tenants error:', fetchError);
      setError('Error al cargar empresas');
      setTenantStatus('error');
      return;
    }

    if (data && data.length > 0) {
      const mapped = data.map((row) => mapDbTenantToUi(row, lastUsedId));
      setTenants(mapped);
      localStorage.setItem('aurea_tenant_count', String(data.length));
    } else {
      setTenants([]);
    }
    
    setTenantStatus('ready');
  }, []);

  const loadStoredSession = useCallback(async () => {
    const storedToken = localStorage.getItem('aurea_auth_token');
    const storedUser = localStorage.getItem('aurea_user');

    if (storedToken && storedUser) {
      try {
        await supabase.auth.setSession({
          access_token: storedToken,
          refresh_token: '',
        });
        
        const userData = JSON.parse(storedUser);
        setUser({
          id: userData.id,
          email: userData.email,
          displayName: userData.email.split('@')[0],
          avatarInitials: userData.email[0].toUpperCase(),
        });
        
        await fetchTenants(userData.id);
        return;
      } catch (e) {
        console.error('Error loading stored session:', e);
      }
    }
    
    setTenantStatus('ready');
  }, [fetchTenants]);

  useEffect(() => {
    loadStoredSession();
  }, [loadStoredSession]);

  const loginWithPin = useCallback(async (email: string, pin: string) => {
    setError(null);
    setTenantStatus('loading');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), pin }),
      });

      const result = await response.json();

      if (!response.ok) {
        const msg = result.error || 'Credenciales inválidas';
        setError(msg);
        setTenantStatus('error');
        return { error: msg };
      }

      const { token, user: userData } = result;

      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });

      const displayName = userData.email.split('@')[0];
      const userForStore = {
        id: userData.id,
        email: userData.email,
        displayName,
        avatarInitials: userData.email[0].toUpperCase(),
      };

      localStorage.setItem('aurea_auth_token', token);
      localStorage.setItem('aurea_user', JSON.stringify(userForStore));

      setUser(userForStore);
      await fetchTenants(userData.id);

      return { error: null };
    } catch (err) {
      console.error('Login error:', err);
      const msg = 'Error de conexión';
      setError(msg);
      setTenantStatus('error');
      return { error: msg };
    }
  }, [fetchTenants]);

  const selectTenant = useCallback((tenant: TenantSummary) => {
    setSelectingTenantId(tenant.id);
    setTenantStatus('selecting');

    if (typeof window !== 'undefined') {
      localStorage.setItem('aurea_last_tenant_id', tenant.id);
    }

    setTimeout(() => {
      router.push(`/eventos?tenant=${tenant.id}`);
    }, 1500);
  }, [router]);

  const logout = useCallback(async () => {
    localStorage.removeItem('aurea_auth_token');
    localStorage.removeItem('aurea_user');
    localStorage.removeItem('aurea_last_tenant_id');
    
    await supabase.auth.signOut();
    
    setUser(null);
    setTenants([]);
    setSelectingTenantId(null);
    setTenantStatus('ready');
    router.push('/login');
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      tenants,
      tenantStatus,
      selectingTenantId,
      error,
      loginWithPin,
      selectTenant,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
