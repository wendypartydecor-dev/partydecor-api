'use client';

import type { StepIndicatorProps } from './auth-transition.types';

const DONE_COLOR = 'oklch(0.68 0.08 75)';
const ACTIVE_COLOR = 'oklch(0.78 0.12 75)';
const PENDING_COLOR = 'var(--color-border-secondary, oklch(0.35 0 0))';

export function StepIndicator({ total, current }: StepIndicatorProps) {
  if (total !== 3) {
    console.warn('StepIndicator: total must be 3 for Aurea auth flow');
  }

  const dots = [
    { index: 0, label: 'PIN' },
    { index: 1, label: 'Verificando' },
    { index: 2, label: 'Empresas' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 0 0',
      }}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-label={`Paso ${current + 1} de 3`}
    >
      {dots.map((dot) => {
        const isDone = dot.index < current;
        const isActive = dot.index === current;
        const isPending = dot.index > current;

        const width = isActive ? 14 : 5;
        const height = 5;
        const borderRadius = 99;
        const transition = 'all 300ms ease';

        const backgroundColor = isDone
          ? DONE_COLOR
          : isActive
          ? ACTIVE_COLOR
          : PENDING_COLOR;

        return (
          <div
            key={dot.index}
            title={dot.label}
            style={{
              width,
              height,
              borderRadius,
              backgroundColor,
              transition,
            }}
          />
        );
      })}
    </div>
  );
}
