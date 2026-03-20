'use client';

import { LoginScreen } from 'packages/ui';
import { useRouter } from 'next/navigation';
import type { AuthFlowState } from 'packages/auth/types/auth.types';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (state: AuthFlowState) => {
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
