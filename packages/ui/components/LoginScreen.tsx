'use client';

import { useState, useCallback } from 'react';
import type { TenantSummary } from '@aurea/auth/types/auth.types';

interface LoginScreenProps {
  onLoginSuccess?: (state: { step: string; tenantId: string }) => void;
  onError?: (error: string) => void;
  tenants?: TenantSummary[];
}

export function LoginScreen({ onLoginSuccess, onError, tenants = [] }: LoginScreenProps) {
  const [step, setStep] = useState<'tenant' | 'credentials' | 'loading'>('tenant');
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSelectTenant = useCallback((tenant: TenantSummary) => {
    setSelectedTenant(tenant);
    setStep('credentials');
  }, []);

  const handlePinSubmit = useCallback(() => {
    if (pin === '1234') {
      onLoginSuccess?.({ step: 'workspace_redirect', tenantId: selectedTenant?.id || '' });
    } else {
      setError('PIN incorrecto');
      setTimeout(() => setError(''), 3000);
    }
  }, [pin, selectedTenant, onLoginSuccess]);

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'credentials') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-full max-w-sm p-8 bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-xl font-semibold text-white">{selectedTenant?.nombre}</h1>
            <p className="text-sm text-neutral-400 mt-1">Ingresa tu PIN</p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  pin.length > i ? 'bg-amber-500 scale-110' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 text-red-400 text-sm rounded-lg text-center border border-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (key === 'del') {
                    setPin((p) => p.slice(0, -1));
                  } else if (key !== '' && pin.length < 4) {
                    const newPin = pin + key;
                    setPin(newPin);
                    if (newPin.length === 4) {
                      setTimeout(handlePinSubmit, 100);
                    }
                  }
                }}
                className={`h-14 rounded-xl text-lg font-medium transition-all active:scale-95 ${
                  key === ''
                    ? 'bg-transparent'
                    : key === 'del'
                    ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                }`}
              >
                {key === 'del' ? '⌫' : key}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep('tenant')}
            className="w-full mt-6 text-sm text-neutral-500 hover:text-neutral-300"
          >
            ← Cambiar empresa
          </button>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-full max-w-md p-8 bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Aurea</h1>
            <p className="text-neutral-400 mt-1">Cargando empresas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Aurea</h1>
          <p className="text-neutral-400 mt-1">Selecciona tu empresa</p>
        </div>

        <div className="space-y-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant)}
              className="w-full p-4 text-left rounded-xl border border-neutral-700 hover:border-amber-500 hover:bg-neutral-800 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white group-hover:text-amber-400">
                    {tenant.nombre}
                  </h3>
                  <p className="text-sm text-neutral-500">{tenant.slug}</p>
                </div>
                {tenant.ultimaSesion && (
                  <span className="text-xs text-neutral-600">
                    Última: {new Date(tenant.ultimaSesion).toLocaleDateString('es-MX')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
