'use client';

import { ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { AmbientStatusIndicator } from '../components/AmbientStatusIndicator';
import type { LeftPanelProps, AmbientStatusConfig } from '../../types/space.types';

interface LeftPanelFullProps extends LeftPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function LeftPanel({
  eventoId,
  timeline,
  ambientStatus,
  isOpen,
  onToggle,
  checklistSlot,
}: LeftPanelFullProps) {
  return (
    <>
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-r-lg flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        aria-label={isOpen ? 'Colapsar panel izquierdo' : 'Expandir panel izquierdo'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <aside
        className={`
          relative h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800
          transition-all duration-200 ease-spring flex flex-col
          ${isOpen ? 'w-[280px] min-w-[280px]' : 'w-0 min-w-0 overflow-hidden'}
        `}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Timeline
              </h3>
            </div>

            <div className="space-y-1">
              {timeline.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`
                    relative pl-6 py-2 pr-3 rounded-lg text-sm
                    ${entry.isUrgent
                      ? 'bg-aurea-logistics-urgent-surface text-aurea-logistics-urgent-text border-l-2 border-aurea-logistics-urgent-border'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }
                  `}
                >
                  {index < timeline.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />
                  )}
                  
                  <div className="absolute left-2 top-3">
                    {entry.type === 'payment' ? (
                      <CheckCircle className="w-4 h-4 text-aurea-financial-paid-text" />
                    ) : entry.isUrgent ? (
                      <AlertCircle className="w-4 h-4 text-aurea-logistics-urgent-text" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    )}
                  </div>

                  <p className="font-medium">{entry.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {new Date(entry.timestamp).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}

              {timeline.length === 0 && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">
                  Sin actividad registrada
                </p>
              )}
            </div>
          </div>

          {checklistSlot && (
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                Checklist
              </h4>
              {checklistSlot}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <AmbientStatusIndicator status={ambientStatus} />
        </div>
      </aside>
    </>
  );
}
