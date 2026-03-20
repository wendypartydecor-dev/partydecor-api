'use client';

import { useState, useCallback } from 'react';
import type { TenantSummary } from '@aurea/auth/types/auth.types';

interface LoginScreenProps {
  onLoginSuccess?: (state: { step: string; tenantId: string }) => void;
  onError?: (error: string) => void;
}

export function LoginScreen({ onLoginSuccess, onError }: LoginScreenProps) {
  const [step, setStep] = useState<'tenant' | 'credentials' | 'loading'>('tenant');
  const [tenants] = useState<TenantSummary[]>([
    { id: '1', nombre: 'Party Decor Tijuana', slug: 'pdtj', ultimaSesion: '2026-03-19' },
    { id: '2', nombre: 'Decoraciones Express', slug: 'de', ultimaSesion: null },
  ]);
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'credentials') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">{selectedTenant?.nombre}</h1>
            <p className="text-sm text-neutral-500 mt-1">Ingresa tu PIN</p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  pin.length > i ? 'bg-amber-500 scale-110' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
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
                    ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                }`}
              >
                {key === 'del' ? '⌫' : key}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep('tenant')}
            className="w-full mt-6 text-sm text-neutral-500 hover:text-neutral-700"
          >
            ← Cambiar empresa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Aurea</h1>
          <p className="text-neutral-500 mt-1">Selecciona tu empresa</p>
        </div>

        <div className="space-y-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant)}
              className="w-full p-4 text-left rounded-xl border border-neutral-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-neutral-900 group-hover:text-amber-700">
                    {tenant.nombre}
                  </h3>
                  <p className="text-sm text-neutral-500">{tenant.slug}</p>
                </div>
                {tenant.ultimaSesion && (
                  <span className="text-xs text-neutral-400">
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
