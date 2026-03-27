'use client';

import { useWorkspace } from '@aurea/web/providers/WorkspaceProvider';
import {
  STATUS_COLORS,
  resolveEventStatus,
  formatCurrency,
  formatDate,
  type EventoResumen,
} from '@aurea/ui/src/workspace/workspace.types';
import { MapPin, User } from 'lucide-react';

interface EventCardProps {
  evento: EventoResumen;
  isSelected: boolean;
  onClick: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  urgent: 'Hoy',
  overdue: 'Vencido',
  pending: 'Prospecto',
  upcoming: 'Próximo',
  confirmed: 'Confirmado',
  past: 'Finalizado',
};

export function EventCard({ evento, isSelected, onClick }: EventCardProps) {
  const { accentColor } = useWorkspace();
  const status = resolveEventStatus(evento);
  const statusColor = STATUS_COLORS[status];
  const isPast = status === 'past';

  return (
    <article
      onClick={onClick}
      className="relative cursor-pointer rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'oklch(0.15 0 0)',
        border: '0.5px solid',
        borderColor: isSelected ? accentColor : 'rgba(255,255,255,0.06)',
        opacity: isPast ? 0.65 : 1,
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: statusColor }}
      />

      <div className="p-4 pl-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-medium truncate pr-2"
              style={{ color: 'oklch(0.95 0 0)' }}
            >
              {evento.nombre_evento}
            </h3>
            <div
              className="flex items-center gap-1.5 mt-1"
              style={{ color: 'oklch(0.65 0 0)' }}
            >
              <User className="w-3 h-3" />
              <span className="text-xs truncate">{evento.cliente?.nombre || 'Sin cliente'}</span>
            </div>
          </div>

          <span
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium shrink-0"
            style={{
              background: `${statusColor}20`,
              color: statusColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusColor }}
            />
            {STATUS_LABELS[status]}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div
              className="text-xs mb-1"
              style={{ color: 'oklch(0.50 0 0)' }}
            >
              {formatDate(evento.fecha_evento)}
            </div>
            {evento.lugar && (
              <div
                className="flex items-center gap-1 text-xs truncate"
                style={{ color: 'oklch(0.45 0 0)' }}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{evento.lugar}</span>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <div
              className="text-sm font-semibold"
              style={{ color: 'oklch(0.95 0 0)' }}
            >
              {formatCurrency(evento.monto_total)}
            </div>
            {evento.saldo_pendiente > 0 && (
              <div
                className="text-xs"
                style={{ color: evento.saldo_pendiente > 0 ? 'oklch(60% 0.20 25)' : 'oklch(0.55 0.15 175)' }}
              >
                {formatCurrency(evento.saldo_pendiente)} pendiente
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{
        background: 'oklch(0.15 0 0)',
        border: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div
              className="h-4 w-32 rounded mb-2"
              style={{ background: 'oklch(0.20 0 0)' }}
            />
            <div
              className="h-3 w-24 rounded"
              style={{ background: 'oklch(0.18 0 0)' }}
            />
          </div>
          <div
            className="h-6 w-16 rounded-full"
            style={{ background: 'oklch(0.20 0 0)' }}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div
              className="h-3 w-20 rounded mb-1"
              style={{ background: 'oklch(0.18 0 0)' }}
            />
            <div
              className="h-3 w-28 rounded"
              style={{ background: 'oklch(0.18 0 0)' }}
            />
          </div>
          <div className="text-right">
            <div
              className="h-4 w-20 rounded mb-1"
              style={{ background: 'oklch(0.20 0 0)' }}
            />
            <div
              className="h-3 w-16 rounded ml-auto"
              style={{ background: 'oklch(0.18 0 0)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
