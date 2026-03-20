'use client';

import { useState, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { LoginCard } from './login/LoginCard';
import { TenantSelector } from './tenant/TenantSelector';
import { useAuthStore } from '../../../../packages/auth/useAuth';
import type { AuthFlowState, LoginMode, TenantSummary, AuthUser } from '../../../../packages/auth/types/auth.types';

interface LoginScreenProps {
  onLoginSuccess: (state: AuthFlowState) => void;
  onError: (error: string) => void;
}

export function LoginScreen({ onLoginSuccess, onError }: LoginScreenProps) {
  const { setUser, setCompanies, selectTenant } = useAuthStore();
  
  const [flowState, setFlowState] = useState<AuthFlowState>({ step: 'login' });
  const [formState, setFormState] = useState({
    mode: 'password' as LoginMode,
    email: '',
    password: '',
    pin: '',
    isSubmitting: false,
    error: null as { type: string; message: string } | null,
    attempts: 0,
  });

  const handleLogin = useCallback(async (email: string, password: string) => {
    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const supabase = (window as unknown as { supabase: SupabaseClient }).supabase;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          error: { type: 'invalid_credentials', message: error.message },
          attempts: prev.attempts + 1,
        }));
        return;
      }

      if (data.user) {
        const { data: tenantsData } = await supabase.rpc('get_user_tenants', {
          user_id: data.user.id,
        });

        setUser(data.user.id, data.user.email || 'Usuario');

        const tenants = (tenantsData || []) as TenantSummary[];
        
        if (tenants.length === 0) {
          setFormState(prev => ({
            ...prev,
            isSubmitting: false,
            error: { type: 'invalid_credentials', message: 'Usuario sin empresa activa' },
          }));
          return;
        }

        setCompanies(tenants);

        if (tenants.length === 1) {
          selectTenant(tenants[0]);
          onLoginSuccess({
            step: 'workspace_redirect',
            tenantId: tenants[0].id,
            token: 'temp-token',
          });
        } else {
          const userInfo: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            displayName: data.user.email?.split('@')[0] || 'Usuario',
            avatarInitials: (data.user.email?.[0] || 'U').toUpperCase(),
            globalRole: 'user',
          };
          
          onLoginSuccess({
            step: 'tenant_select',
            user: userInfo,
            tenants,
            tokenTemp: 'temp-token',
          });
        }
      }
    } catch (err) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: { type: 'network', message: 'Error de conexión' },
      }));
    }
  }, [setUser, setCompanies, selectTenant, onLoginSuccess]);

  const handlePinLogin = useCallback(async (pin: string) => {
    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: { type: 'invalid_credentials', message: 'PIN incorrecto' },
      }));
    } catch {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: { type: 'network', message: 'Error de conexión' },
      }));
    }
  }, []);

  const handleTenantSelect = useCallback(async (tenant: TenantSummary) => {
    selectTenant(tenant);
    
    setFlowState({
      step: 'selecting',
      tenant,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onLoginSuccess({
      step: 'workspace_redirect',
      tenantId: tenant.id,
      token: 'final-token',
    });
  }, [selectTenant, onLoginSuccess]);

  const handleLogout = useCallback(() => {
    useAuthStore.getState().signOut();
    setFlowState({ step: 'login' });
  }, []);

  const handleModeChange = useCallback((mode: LoginMode) => {
    setFormState(prev => ({ ...prev, mode, error: null }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 p-4">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[oklch(78%_0.12_75)] flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <span className="text-[26px] font-medium tracking-[-0.03em] text-neutral-900 dark:text-neutral-100">
          Aurea
        </span>
      </div>

      {flowState.step === 'login' && (
        <LoginCard
          onSubmit={handleLogin}
          onSubmitPin={handlePinLogin}
          formState={formState}
          onModeChange={handleModeChange}
        />
      )}

      {flowState.step === 'tenant_select' && (
        <TenantSelector
          state={{
            status: 'ready',
            tenants: flowState.tenants,
            user: flowState.user,
          }}
          onSelect={handleTenantSelect}
          onLogout={handleLogout}
        />
      )}

      {flowState.step === 'selecting' && flowState.tenant && (
        <TenantSelector
          state={{
            status: 'selecting',
            tenant: flowState.tenant,
          }}
          onSelect={handleTenantSelect}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

interface SupabaseClient {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      data: { user: { id: string; email?: string } | null };
      error: { message: string } | null;
    }>;
    signOut: () => Promise<{ error: unknown }>;
  };
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}
