'use client';

import { ChevronLeft, ChevronRight, Phone, Building2, User, History } from 'lucide-react';
import type { RightPanelProps } from '../../types/space.types';

interface RightPanelFullProps extends RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function RightPanel({
  cliente,
  historialCount,
  isOpen,
  onToggle,
  pluginSlot,
  onViewFullClient,
}: RightPanelFullProps) {
  return (
    <>
      <button
        onClick={onToggle}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-l-lg flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        aria-label={isOpen ? 'Colapsar panel derecho' : 'Expandir panel derecho'}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <aside
        className={`
          relative h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800
          transition-all duration-200 ease-spring flex flex-col
          ${isOpen ? 'w-[260px] min-w-[260px]' : 'w-0 min-w-0 overflow-hidden'}
        `}
      >
        <div className="p-6">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
            Cliente
          </h3>

          {cliente ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-aurea-gold/10 flex items-center justify-center">
                  {cliente.tipo === 'Empresa' ? (
                    <Building2 className="w-5 h-5 text-aurea-gold" />
                  ) : (
                    <User className="w-5 h-5 text-aurea-gold" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {cliente.nombre}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {cliente.tipo}
                  </p>
                </div>
              </div>

              {cliente.tel1 && (
                <a
                  href={`tel:${cliente.tel1}`}
                  className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-aurea-gold transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {cliente.tel1}
                </a>
              )}

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Eventos</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {cliente.eventosCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Total ventas</span>
                  <span className="font-medium text-aurea-financial-paid-text">
                    ${cliente.totalVentas.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>

              <button
                onClick={onViewFullClient}
                className="w-full py-2 px-3 text-sm font-medium text-aurea-gold bg-aurea-gold/10 rounded-lg hover:bg-aurea-gold/20 transition-colors"
              >
                Ver perfil completo
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Sin cliente asociado
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <History className="w-4 h-4" />
            <span>{historialCount} actividades</span>
          </div>
        </div>

        {pluginSlot && (
          <div className="flex-1 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 overflow-y-auto">
            {pluginSlot}
          </div>
        )}
      </aside>
    </>
  );
}
