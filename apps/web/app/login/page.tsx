'use client';

import { useState } from 'react';
import { useAuth } from '../../components/providers/AuthProvider';
import { TenantSelector } from '@aurea/ui/src/tenant-selector/TenantSelector';

function PinPad({ onSubmit }: { onSubmit: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleKey = (key: string) => {
    if (key === 'del') {
      setPin(p => p.slice(0, -1));
      setError(null);
    } else if (key !== '' && pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        onSubmit(newPin);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm p-8 bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Aurea</h1>
          <p className="text-sm text-neutral-400 mt-1">Ingresa tu PIN de acceso</p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                pin.length > i 
                  ? 'bg-amber-500 scale-125' 
                  : 'bg-neutral-700'
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
              onClick={() => handleKey(String(key))}
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

        <p className="text-center text-xs text-neutral-600 mt-6">
          Demo: PIN 1234
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, tenants, tenantStatus, selectingTenantId, error, loginWithPin, selectTenant, logout } = useAuth();

  const handlePinSubmit = async (pin: string) => {
    const email = 'admin@aurea.com';
    const result = await loginWithPin(email, pin);
    if (result.error) {
      // El error se maneja en el PinPad localmente
    }
  };

  const tenantSelectorState = {
    status: tenantStatus,
    tenants,
    user: user ? {
      id: user.id,
      displayName: user.displayName,
      avatarInitials: user.avatarInitials,
    } : null,
    selectingId: selectingTenantId,
    error,
  };

  if (!user || tenantStatus === 'ready' || tenantStatus === 'error') {
    console.warn('=== LOGIN PAGE DECISION ===');
    console.warn('Redirecting to PIN because:', {
      hasUser: !!user,
      tenantStatus,
      hasTenants: tenants.length,
      error
    });
    console.warn('========================');
    return <PinPad onSubmit={handlePinSubmit} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <TenantSelector
        state={tenantSelectorState}
        onSelect={selectTenant}
        onLogout={logout}
      />
    </div>
  );
}
