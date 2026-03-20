'use client';

import { CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import type { AmbientStatusConfig } from '../../types/space.types';

interface AmbientStatusIndicatorProps {
  status: AmbientStatusConfig;
}

const statusConfig: Record<AmbientStatusConfig['level'], {
  icon: typeof CheckCircle;
  bgClass: string;
  textClass: string;
  label: string;
}> = {
  clear: {
    icon: CheckCircle,
    bgClass: 'bg-aurea-logistics-confirmed-surface',
    textClass: 'text-aurea-logistics-confirmed-text',
    label: 'Sin pendientes',
  },
  pending: {
    icon: Clock,
    bgClass: 'bg-aurea-financial-pending-surface',
    textClass: 'text-aurea-financial-pending-text',
    label: 'Pendiente de pago',
  },
  urgent: {
    icon: AlertTriangle,
    bgClass: 'bg-aurea-logistics-urgent-surface',
    textClass: 'text-aurea-logistics-urgent-text',
    label: 'Requiere atención',
  },
  critical: {
    icon: AlertCircle,
    bgClass: 'bg-aurea-system-danger-light/20',
    textClass: 'text-aurea-system-danger-light',
    label: 'Situación crítica',
  },
};

export function AmbientStatusIndicator({ status }: AmbientStatusIndicatorProps) {
  const config = statusConfig[status.level];
  const Icon = config.icon;

  return (
    <div className={`
      flex items-center gap-3 px-3 py-2 rounded-xl
      ${config.bgClass}
    `}>
      <Icon className={`w-5 h-5 ${config.textClass}`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${config.textClass}`}>
          {config.label}
        </p>
        <p className="text-xs opacity-70">
          {status.message}
        </p>
      </div>
      {status.ctaLabel && (
        <button className={`
          px-2 py-1 text-xs font-medium rounded-lg
          ${status.level === 'clear' ? 'bg-aurea-gold/20 text-aurea-gold' : ''}
          ${status.level === 'pending' ? 'bg-aurea-financial-pending-border/20 text-aurea-financial-pending-text' : ''}
          ${status.level === 'urgent' ? 'bg-aurea-logistics-urgent-border/20 text-aurea-logistics-urgent-text' : ''}
          ${status.level === 'critical' ? 'bg-aurea-system-danger-dark/20 text-aurea-system-danger-light' : ''}
        `}>
          {status.ctaLabel}
        </button>
      )}
    </div>
  );
}
