'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthTransition } from '@aurea/ui/src/auth-transition/AuthTransition';
import { TenantSelector } from '@aurea/ui/src/tenant-selector/TenantSelector';
import { useAuthFlow } from '../_hooks/useAuthFlow';
import { LoginCard } from './LoginCard';

export function LoginScreen() {
  const router = useRouter();
  const { state, handlePinComplete, handleTenantSelect, handleLogout, dispatch } = useAuthFlow();

  useEffect(() => {
    console.log('[ZONA-3] LoginScreen useEffect - step:', state.step, 'autoRedirectTenantId:', state.autoRedirectTenantId);
    if (state.step === 'ready' && state.autoRedirectTenantId) {
      console.log('[ZONA-3] Attempting router.push to /eventos?tenant=', state.autoRedirectTenantId);
      router.push(`/eventos?tenant=${state.autoRedirectTenantId}`);
    }
  }, [state.step, state.autoRedirectTenantId, router]);

  if (state.step === 'login') {
    return <LoginCard onPinComplete={handlePinComplete} error={state.error} />;
  }

  if (state.step === 'verifying' || state.step === 'loading_tenants') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div
          style={{
            background: 'var(--color-background-primary, oklch(0.13 0 0))',
            border: '0.5px solid var(--color-border-tertiary, oklch(0.28 0 0))',
            borderRadius: 20,
            overflow: 'hidden',
            width: '100%',
            maxWidth: 340,
          }}
        >
          <AuthTransition
            phase={state.step}
            userDisplayName={state.user?.displayName}
            userAvatarInitials={state.user?.avatarInitials}
            onReadyToMount={() => {
              if (state.autoRedirectTenantId) {
                dispatch({ type: 'SET_READY' });
              } else {
                dispatch({ type: 'TRANSITION_COMPLETE' });
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (state.step === 'tenant_select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <TenantSelector
          state={{
            status: 'ready',
            tenants: state.tenants,
            user: state.user ? {
              id: state.user.id,
              displayName: state.user.displayName,
              avatarInitials: state.user.avatarInitials,
            } : null,
            selectingId: null,
            error: null,
          }}
          onSelect={handleTenantSelect}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return null;
}
