'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createAureaClient, getAureaTokenFromCookies, setAureaCookie, clearAureaCookie } from '@aurea/core/supabase/aurea-client';
import type { TenantSummary } from '@aurea/ui/src/tenant-selector/tenant-selector.types';

interface AuthContextType {
  user: { id: string; email: string; displayName: string; avatarInitials: string } | null;
  tenants: TenantSummary[];
  tenantStatus: 'loading' | 'ready' | 'selecting' | 'error';
  selectingTenantId: string | null;
  error: string | null;
  loginWithPin: (email: string, pin: string) => Promise<{ error: string | null }>;
  selectTenant: (tenant: TenantSummary) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface TenantFromDb {
  empresa_id: string;
  empresa_nombre: string;
  empresa_nombre_corto: string;
  empresa_logo: string | null;
  empresa_color: string | null;
  empresa_accent_color: string | null;
  rol: 'admin' | 'empleado' | 'solo_lectura';
}

function mapDbTenantToUi(row: TenantFromDb, lastUsedId: string | null): TenantSummary {
  return {
    id: row.empresa_id,
    nombre: row.empresa_nombre,
    iniciales: row.empresa_nombre_corto.substring(0, 2).toUpperCase(),
    logoUrl: row.empresa_logo,
    accentColor: row.empresa_accent_color ?? row.empresa_color ?? 'oklch(0.55 0.08 260)',
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
  const [tenantStatus, setTenantStatus] = useState<AuthContextType['tenantStatus']>('loading');
  const [selectingTenantId, setSelectingTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async (userId: string, token: string) => {
    setTenantStatus('loading');
    
    const lastUsedId = localStorage.getItem('aurea_last_tenant_id');
    const aureaClient = createAureaClient(token);

    const { data, error: fetchError } = await aureaClient
      .from('v_usuarios_empresas')
      .select('*')
      .eq('usuario_id', userId);

    if (fetchError) {
      setError('Error al cargar empresas');
      setTenantStatus('error');
      return;
    }

    if (data && data.length > 0) {
      const mapped = data.map((row) => mapDbTenantToUi(row, lastUsedId));
      setTenants(mapped);
      localStorage.setItem('aurea_tenant_count', String(data.length));
      
      if (data.length === 1) {
        localStorage.setItem('aurea_last_tenant_id', mapped[0].id);
        router.push(`/eventos?tenant=${mapped[0].id}`);
        return;
      }
    } else {
      setTenants([]);
    }
    
    setTenantStatus('ready');
  }, [router]);

  const loadStoredSession = useCallback(async () => {
    const token = getAureaTokenFromCookies();
    const storedUser = localStorage.getItem('aurea_user');

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          id: userData.id,
          email: userData.email,
          displayName: userData.email.split('@')[0],
          avatarInitials: userData.email[0].toUpperCase(),
        });
        
        await fetchTenants(userData.id, token);
        return;
      } catch (e) {
        clearAureaCookie();
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
      await fetchTenants(userData.id, token);

      return { error: null };
    } catch (err) {
      const msg = 'Error de conexión';
      setError(msg);
      setTenantStatus('error');
      return { error: msg };
    }
  }, [fetchTenants]);

  const selectTenant = useCallback((tenant: TenantSummary) => {
    setSelectingTenantId(tenant.id);
    setTenantStatus('selecting');
    localStorage.setItem('aurea_last_tenant_id', tenant.id);

    setTimeout(() => {
      router.push(`/eventos?tenant=${tenant.id}`);
    }, 1500);
  }, [router]);

  const logout = useCallback(async () => {
    localStorage.removeItem('aurea_auth_token');
    localStorage.removeItem('aurea_user');
    localStorage.removeItem('aurea_last_tenant_id');
    clearAureaCookie();
    
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
