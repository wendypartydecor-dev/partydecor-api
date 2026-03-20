'use client';

import { Building2, ChevronRight, Calendar } from 'lucide-react';
import type { TenantSummary } from '../../../../packages/auth/types/auth.types';

interface TenantCardProps {
  tenant: TenantSummary;
  isSelecting: boolean;
  onClick: (tenant: TenantSummary) => void;
}

export function TenantCard({ tenant, isSelecting, onClick }: TenantCardProps) {
  const { meta, rolEmpresa, logoUrl, iniciales, nombre, nombreCorto, accentColor } = tenant;

  const roleColors = {
    admin: {
      bg: 'bg-[oklch(95%_0.04_280_/0.7)]',
      text: 'text-[oklch(40%_0.10_280)]',
      label: 'Administrador',
    },
    empleado: {
      bg: 'bg-[oklch(78%_0.12_75_/0.15)]',
      text: 'text-[oklch(45%_0.14_75)]',
      label: 'Empleado',
    },
    solo_lectura: {
      bg: 'bg-[oklch(95%_0.06_75_/0.5)]',
      text: 'text-[oklch(42%_0.14_72)]',
      label: 'Solo lectura',
    },
  };

  const roleStyle = roleColors[rolEmpresa];

  return (
    <button
      onClick={() => onClick(tenant)}
      disabled={isSelecting}
      className={`
        w-full flex items-center gap-4 p-[16px] bg-white dark:bg-neutral-900 rounded-[12px] 
        border border-neutral-200 dark:border-neutral-800 transition-all duration-140
        hover:border-[oklch(78%_0.12_75)] hover:shadow-lg group
        disabled:opacity-50 disabled:cursor-wait
        ${isSelecting ? 'scale-[0.98]' : ''}
      `}
    >
      <div 
        className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: logoUrl ? 'transparent' : accentColor || 'oklch(78% 0.12 75 / 0.15)' }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={nombre} className="w-full h-full object-contain" />
        ) : (
          <span 
            className="text-[16px] font-semibold"
            style={{ color: accentColor || 'oklch(78% 0.12 75)' }}
          >
            {iniciales}
          </span>
        )}
      </div>

      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
            {nombreCorto || nombre}
          </p>
          {meta.isLastUsed && (
            <span className="px-[6px] py-[2px] text-[9px] font-medium bg-[oklch(78%_0.12_75_/0.15)] text-[oklch(45%_0.14_75)] rounded-full">
              Última sesión
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-1">
          <span className={`inline-block px-[6px] py-[2px] text-[10px] font-medium rounded ${roleStyle.bg} ${roleStyle.text}`}>
            {roleStyle.label}
          </span>
          
          {meta.upcomingEventCount > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-neutral-400">
              <Calendar className="w-3 h-3" />
              {meta.upcomingEventCount} evento{meta.upcomingEventCount !== 1 ? 's' : ''} esta semana
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-[oklch(78%_0.12_75)] transition-colors duration-180" />
    </button>
  );
}
