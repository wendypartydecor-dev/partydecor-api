'use client';

import type { AmbientStatusConfig } from '../../types/space.types';

interface AmbientStatusBarProps {
  status: AmbientStatusConfig;
}

const statusColors: Record<AmbientStatusConfig['level'], string> = {
  clear: 'bg-aurea-logistics-confirmed-surface',
  pending: 'bg-aurea-financial-pending-border',
  urgent: 'bg-aurea-logistics-urgent-ambient',
  critical: 'bg-aurea-system-danger-dark',
};

export function AmbientStatusBar({ status }: AmbientStatusBarProps) {
  return (
    <div
      className={`
        h-[3px] w-full transition-colors duration-600 ease-out
        ${statusColors[status.level]}
      `}
      title={status.message}
      role="status"
      aria-label={status.message}
    />
  );
}
