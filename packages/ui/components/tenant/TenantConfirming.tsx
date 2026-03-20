'use client';

import type { TenantSummary } from '../../../../packages/auth/types/auth.types';

interface TenantConfirmingProps {
  tenant: TenantSummary;
}

export function TenantConfirming({ tenant }: TenantConfirmingProps) {
  const { nombre, logoUrl, iniciales, accentColor } = tenant;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        <div 
          className="w-[72px] h-[72px] rounded-[16px] flex items-center justify-center overflow-hidden shadow-xl"
          style={{ backgroundColor: logoUrl ? 'transparent' : accentColor || 'oklch(78% 0.12 75 / 0.15)' }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={nombre} className="w-full h-full object-contain" />
          ) : (
            <span 
              className="text-[28px] font-bold"
              style={{ color: accentColor || 'oklch(78% 0.12 75)' }}
            >
              {iniciales}
            </span>
          )}
        </div>

        <div className="text-center">
          <p className="text-[16px] font-medium text-neutral-900 dark:text-neutral-100 mb-1">
            Entrando a {nombre}
          </p>
          <p className="text-[14px] text-neutral-500">
            Preparando tu espacio de trabajo...
          </p>
        </div>

        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-[3px] border-neutral-200 dark:border-neutral-700 rounded-full" />
          <div 
            className="absolute inset-0 border-[3px] border-transparent border-t-[oklch(78%_0.12_75)] rounded-full animate-spin"
            style={{ animationDuration: '700ms' }}
          />
        </div>
      </div>
    </div>
  );
}
