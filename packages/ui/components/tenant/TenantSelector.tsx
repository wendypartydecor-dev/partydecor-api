'use client';

import { useEffect } from 'react';
import { LogOut, HelpCircle } from 'lucide-react';
import { TenantSkeleton } from './TenantSkeleton';
import { TenantCard } from './TenantCard';
import { TenantConfirming } from './TenantConfirming';
import type { TenantSelectorState, TenantSummary, AuthUser } from '../../../../packages/auth/types/auth.types';

interface TenantSelectorProps {
  state: TenantSelectorState;
  onSelect: (tenant: TenantSummary) => Promise<void>;
  onLogout: () => void;
}

export function TenantSelector({ state, onSelect, onLogout }: TenantSelectorProps) {
  if (state.status === 'selecting') {
    return <TenantConfirming tenant={state.tenant} />;
  }

  if (state.status === 'loading') {
    return (
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[oklch(78%_0.12_75_/0.1)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[oklch(78%_0.12_75)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-[20px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100 mb-2">
            Cargando empresas...
          </h1>
        </div>
        <TenantSkeleton count={3} />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-[20px] font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          Error al cargar
        </h1>
        <p className="text-[14px] text-neutral-500 mb-8">
          {state.error}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold rounded-[12px] hover:opacity-90 transition-opacity"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
          <button
            onClick={() => window.open('mailto:soporte@aurea.app', '_blank')}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-[oklch(78%_0.12_75_/0.1)] text-[oklch(45%_0.14_75)] font-semibold rounded-[12px] hover:bg-[oklch(78%_0.12_75_/0.15)] transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            Contactar soporte
          </button>
        </div>
      </div>
    );
  }

  const { tenants, user } = state;

  return (
    <div className="w-full max-w-md p-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[oklch(78%_0.12_75_/0.1)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[oklch(78%_0.12_75)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-[20px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100 mb-2">
          Selecciona tu empresa
        </h1>
        <p className="text-[14px] text-neutral-500">
          Hola, <span className="font-medium">{user.displayName}</span>
        </p>
        <p className="text-[12px] text-neutral-400 mt-1">
          Tienes acceso a {tenants.length} empresa{tenants.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-[12px]">
        {tenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            isSelecting={false}
            onClick={onSelect}
          />
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 mx-auto text-[14px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
