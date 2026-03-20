'use client';

import { useEffect, useState } from 'react';
import type { LoginError } from '../../../../packages/auth/types/auth.types';

interface LoginErrorProps {
  error: LoginError;
  shakeTrigger: boolean;
}

export function LoginError({ error, shakeTrigger }: LoginErrorProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (shakeTrigger) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 320);
      return () => clearTimeout(timer);
    }
  }, [shakeTrigger]);

  const getErrorMessage = () => {
    switch (error.type) {
      case 'invalid_credentials':
        return 'Credenciales incorrectas. Verifica tu email y contraseña.';
      case 'account_locked':
        return `Cuenta bloqueada. Intenta de nuevo después de las ${new Date(error.unlocksAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}.`;
      case 'network':
        return 'Error de conexión. Verifica tu internet.';
      case 'rate_limited':
        return `Demasiados intentos. Espera ${error.retryAfterSeconds} segundos.`;
      default:
        return 'Ocurrió un error. Intenta de nuevo.';
    }
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-[12px] bg-[oklch(94%_0.06_30)] border border-[oklch(62%_0.18_30)]
        ${isShaking ? 'animate-shake' : ''}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-[oklch(45%_0.18_25)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm text-[oklch(38%_0.18_30)]">
          {getErrorMessage()}
        </p>
      </div>
    </div>
  );
}
