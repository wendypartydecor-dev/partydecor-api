'use client';

import { LoginScreen } from '@aurea/ui';
import { useRouter } from 'next/navigation';
import type { TenantSummary } from '@aurea/auth/types/auth.types';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (state: { step: string; tenantId: string }) => {
    if (state.step === 'workspace_redirect') {
      router.push(`/eventos?tenant=${state.tenantId}`);
    }
  };

  const handleError = (error: string) => {
    console.error('Auth error:', error);
  };

  return (
    <LoginScreen 
      onLoginSuccess={handleLoginSuccess}
      onError={handleError}
    />
  );
}
