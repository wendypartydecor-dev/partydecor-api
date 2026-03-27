'use client';

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@aurea/core/supabase/client';
import type { TenantSummary } from '@aurea/ui/src/tenant-selector/tenant-selector.types';

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarInitials: string;
}

interface AuthFlowState {
  step: 'login' | 'verifying' | 'loading_tenants' | 'ready' | 'tenant_select';
  user: UserInfo | null;
  tenants: TenantSummary[];
  error: string | null;
  autoRedirectTenantId: string | null;
}

type AuthFlowAction =
  | { type: 'LOGIN_START' }
  | { type: 'TENANTS_LOADED'; user: UserInfo; tenants: TenantSummary[] }
  | { type: 'SET_READY' }
  | { type: 'TRANSITION_COMPLETE' }
  | { type: 'ERROR'; error: string }
  | { type: 'LOGOUT' };

function mapDbTenantToUi(row: Record<string, unknown>, lastUsedId: string | null): TenantSummary {
  return {
    id: row.empresa_id as string,
    nombre: row.empresa_nombre as string,
    iniciales: ((row.empresa_nombre_corto as string) || '').substring(0, 2).toUpperCase(),
    logoUrl: row.empresa_logo as string | null,
    accentColor: (row.empresa_accent_color as string | null) ?? (row.empresa_color as string | null) ?? 'oklch(0.55 0.08 260)',
    rolEmpresa: row.rol as 'admin' | 'empleado' | 'solo_lectura',
    isLastUsed: row.empresa_id === lastUsedId,
    meta: {
      lastAccessAt: null,
      upcomingEventCount: 0,
    },
  };
}

function authFlowReducer(state: AuthFlowState, action: AuthFlowAction): AuthFlowState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, step: 'verifying', error: null };
    case 'TENANTS_LOADED':
      return { 
        ...state, 
        step: 'loading_tenants', 
        user: action.user, 
        tenants: action.tenants,
        autoRedirectTenantId: action.tenants.length === 1 ? action.tenants[0].id : null,
      };
    case 'SET_READY':
      return { ...state, step: 'ready' };
    case 'TRANSITION_COMPLETE':
      return { ...state, step: 'tenant_select' };
    case 'ERROR':
      return { ...state, step: 'login', error: action.error };
    case 'LOGOUT':
      return { step: 'login', user: null, tenants: [], error: null, autoRedirectTenantId: null };
    default:
      return state;
  }
}

export function useAuthFlow() {
  const router = useRouter();
  const [state, dispatch] = useReducer(authFlowReducer, {
    step: 'login',
    user: null,
    tenants: [],
    error: null,
    autoRedirectTenantId: null,
  });

  const hasAutoRedirected = useRef(false);

  const handlePinComplete = useCallback(async (email: string, pin: string) => {
    hasAutoRedirected.current = false;
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), pin }),
      });

      const result = await response.json();

      if (!response.ok) {
        dispatch({ type: 'ERROR', error: result.error || 'Credenciales inválidas' });
        return;
      }

      const { token, user: userData } = result;

      console.log('[ZONA-1] Attempting supabase.auth.setSession...');
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      });
      
      if (sessionError) {
        console.error('[ZONA-1] setSession error:', sessionError.message);
        dispatch({ type: 'ERROR', error: 'Error de sesión. Intenta de nuevo.' });
        return;
      }
      console.log('[ZONA-1] setSession SUCCESS');

      const displayName = userData.email.split('@')[0];
      const userForStore: UserInfo = {
        id: userData.id,
        email: userData.email,
        displayName,
        avatarInitials: userData.email[0].toUpperCase(),
      };

      localStorage.setItem('aurea_auth_token', token);
      localStorage.setItem('aurea_user', JSON.stringify(userForStore));

      const lastUsedId = localStorage.getItem('aurea_last_tenant_id');
      console.log('[ZONA-1] Fetching tenants for user:', userData.id);
      const { data, error: tenantsError } = await supabase
        .from('v_usuarios_empresas')
        .select('*')
        .eq('usuario_id', userData.id);

      console.log('[ZONA-1] Tenants query result - data:', data?.length, 'error:', tenantsError?.message);
      
      const tenants = data?.map((row: Record<string, unknown>) => mapDbTenantToUi(row, lastUsedId)) ?? [];
      console.log('[ZONA-1] Mapped tenants:', tenants.map(t => t.id));
      
      localStorage.setItem('aurea_tenant_count', String(tenants.length));
      dispatch({ type: 'TENANTS_LOADED', user: userForStore, tenants });
    } catch {
      dispatch({ type: 'ERROR', error: 'Error de conexión' });
    }
  }, []);

  useEffect(() => {
    console.log('[ZONA-2] useEffect triggered - step:', state.step, 'autoRedirectTenantId:', state.autoRedirectTenantId, 'hasAutoRedirected:', hasAutoRedirected.current);
    if (state.step === 'loading_tenants' && state.autoRedirectTenantId && !hasAutoRedirected.current) {
      console.log('[ZONA-2] Starting 500ms delay for SET_READY...');
      hasAutoRedirected.current = true;
      localStorage.setItem('aurea_last_tenant_id', state.autoRedirectTenantId);
      const timer = setTimeout(() => {
        console.log('[ZONA-2] Dispatching SET_READY');
        dispatch({ type: 'SET_READY' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.step, state.autoRedirectTenantId]);

  const handleTenantSelect = useCallback((tenant: TenantSummary) => {
    localStorage.setItem('aurea_last_tenant_id', tenant.id);
    router.push(`/eventos?tenant=${tenant.id}`);
  }, [router]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('aurea_auth_token');
    localStorage.removeItem('aurea_user');
    localStorage.removeItem('aurea_last_tenant_id');
    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const dispatchAction = useCallback((action: AuthFlowAction) => {
    dispatch(action);
  }, []);

  return {
    state,
    handlePinComplete,
    handleTenantSelect,
    handleLogout,
    dispatch: dispatchAction,
  };
}
