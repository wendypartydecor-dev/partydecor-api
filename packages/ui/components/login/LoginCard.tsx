'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { PinPad } from './PinPad';
import { LoginError } from './LoginError';
import type { LoginMode, LoginFormState, LoginError as LoginErrorType, PinState } from '../../../../packages/auth/types/auth.types';

interface LoginCardProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSubmitPin: (pin: string) => Promise<void>;
  formState: LoginFormState;
  onModeChange: (mode: LoginMode) => void;
}

export function LoginCard({ onSubmit, onSubmitPin, formState, onModeChange }: LoginCardProps) {
  const [email, setEmail] = useState(formState.email);
  const [password, setPassword] = useState(formState.password);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [pinState, setPinState] = useState<PinState>({ status: 'idle', value: '' });

  useEffect(() => {
    setEmail(formState.email);
    setPassword(formState.password);
  }, [formState.email, formState.password]);

  useEffect(() => {
    if (formState.error) {
      setShakeTrigger(prev => prev + 1);
      setPinState({ status: 'error', message: formState.error.message });
    }
  }, [formState.error]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || formState.isSubmitting) return;
    await onSubmit(email, password);
  }, [email, password, formState.isSubmitting, onSubmit]);

  const handlePinComplete = useCallback(async (pin: string) => {
    setPinState({ status: 'validating' });
    await onSubmitPin(pin);
  }, [onSubmitPin]);

  const handlePinReset = useCallback(() => {
    setPinState({ status: 'idle', value: '' });
  }, []);

  const isFormValid = email.length > 0 && password.length > 0;
  const showForgotPassword = formState.attempts >= 2;

  return (
    <div className="w-full max-w-[380px] p-[40px_32px] bg-white dark:bg-neutral-900 rounded-[20px] shadow-2xl">
      <div className="mb-8">
        <h1 className="text-[20px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100 mb-2">
          Iniciar sesión
        </h1>
        <p className="text-[14px] text-neutral-500">
          Accede a tu cuenta de Aurea
        </p>
      </div>

      <div className="mb-6">
        <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-[10px]">
          <button
            type="button"
            onClick={() => onModeChange('password')}
            className={`
              flex-1 py-2 px-4 text-[14px] font-medium rounded-[8px] transition-all duration-150
              ${formState.mode === 'password'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }
            `}
          >
            Contraseña
          </button>
          <button
            type="button"
            onClick={() => onModeChange('pin')}
            className={`
              flex-1 py-2 px-4 text-[14px] font-medium rounded-[8px] transition-all duration-150
              ${formState.mode === 'pin'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }
            `}
          >
            PIN
          </button>
        </div>
      </div>

      {formState.error && formState.mode === 'password' && (
        <div className="mb-6">
          <LoginError error={formState.error} shakeTrigger={shakeTrigger} />
        </div>
      )}

      {formState.mode === 'password' ? (
        <form onSubmit={handlePasswordSubmit} className="space-y-[14px]">
          <div>
            <label className="block text-[12px] font-medium text-neutral-500 uppercase tracking-[0.07em] mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-[14px] top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-[42px] pr-[14px] py-[11px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[10px] text-[14px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-all duration-150 focus:border-[oklch(78%_0.12_75)] focus:ring-2 focus:ring-[oklch(78%_0.12_75)_/0.2]"
                disabled={formState.isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-neutral-500 uppercase tracking-[0.07em] mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-[42px] pr-[42px] py-[11px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[10px] text-[14px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-all duration-150 focus:border-[oklch(78%_0.12_75)] focus:ring-2 focus:ring-[oklch(78%_0.12_75)_/0.2]"
                disabled={formState.isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[14px] top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || formState.isSubmitting}
            className={`
              w-full py-[12px] rounded-[12px] text-[14px] font-semibold transition-all duration-100
              ${isFormValid && !formState.isSubmitting
                ? 'bg-[oklch(78%_0.12_75)] text-[oklch(18%_0.06_75)] hover:bg-[oklch(82%_0.14_75)] active:scale-[0.98]'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              }
            `}
          >
            {formState.isSubmitting ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>

          {showForgotPassword && (
            <p className="text-center">
              <button type="button" className="text-[12px] text-[oklch(68%_0.15_255)] hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </p>
          )}
        </form>
      ) : (
        <div className="pt-4">
          <PinPad
            state={pinState}
            onComplete={handlePinComplete}
            onReset={handlePinReset}
          />
        </div>
      )}
    </div>
  );
}
