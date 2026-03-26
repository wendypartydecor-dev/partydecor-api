'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/providers/AuthProvider';
import { TenantSelector } from '@aurea/ui/src/tenant-selector/TenantSelector';

function PinPad({ onSubmit, disabled }: { onSubmit: (pin: string) => void; disabled?: boolean }) {
  const [pin, setPin] = useState('');

  const handleKey = (key: string) => {
    if (disabled) return;
    if (key === 'del') {
      setPin(p => p.slice(0, -1));
    } else if (key !== '' && pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        onSubmit(newPin);
        setPin('');
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

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, idx) => (
            <button
              key={idx}
              onClick={() => handleKey(String(key))}
              disabled={disabled}
              className={`h-14 rounded-xl text-lg font-medium transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              } ${
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
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">A</span>
        </div>
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-amber-500 rounded-full animate-spin mx-auto" />
        <p className="text-neutral-400 mt-4 text-sm">Iniciando sesión...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, tenants, tenantStatus, selectingTenantId, error, loginWithPin, selectTenant, logout } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAuthenticating(false);
    }
  }, [user]);

  const handlePinSubmit = async (pin: string) => {
    setIsAuthenticating(true);
    const email = 'admin@aurea.com';
    const result = await loginWithPin(email, pin);
    if (result.error) {
      setIsAuthenticating(false);
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

  // Si estamos autenticando, mostrar loading
  if (isAuthenticating) {
    return <LoadingScreen />;
  }

  // Si NO hay usuario Y no estamos autenticando, mostrar PinPad
  if (!user) {
    return <PinPad onSubmit={handlePinSubmit} disabled={isAuthenticating} />;
  }

  // Si hay usuario, mostrar TenantSelector
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
