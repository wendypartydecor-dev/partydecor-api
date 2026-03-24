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
  loginWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.email?.split('@')[0] || 'Usuario',
          avatarInitials: (session.user.email?.[0] || 'U').toUpperCase(),
        });
        fetchTenants(session.user.id);
      } else {
        setTenantStatus('ready');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.email?.split('@')[0] || 'Usuario',
          avatarInitials: (session.user.email?.[0] || 'U').toUpperCase(),
        });
        await fetchTenants(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTenants([]);
        setSelectingTenantId(null);
        setTenantStatus('ready');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchTenants]);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    setTenantStatus('loading');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setTenantStatus('error');
      return { error: authError.message };
    }

    return { error: null };
  }, []);

  const loginWithPin = useCallback(async (email: string, pin: string) => {
    setError(null);
    setTenantStatus('loading');

    const { data, error: rpcError } = await supabase.rpc('authenticate_with_pin', {
      user_email: email,
      user_pin: pin,
    });

    if (rpcError || !data || data.length === 0) {
      const msg = 'Credenciales inválidas';
      setError(msg);
      setTenantStatus('error');
      return { error: msg };
    }

    return { error: null };
  }, []);

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
    await supabase.auth.signOut();
    setUser(null);
    setTenants([]);
    setSelectingTenantId(null);
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
      loginWithPassword,
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
