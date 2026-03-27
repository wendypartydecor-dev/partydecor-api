'use client';

import { useMemo } from 'react';
import type { SpinnerAureaProps } from './auth-transition.types';

export function SpinnerAurea({ size = 64, showPulse = true }: SpinnerAureaProps) {
  const ringSize = size;
  const ringThickness = Math.max(2, Math.floor(size / 16));
  const pulseScale = size / 64;

  return (
    <div
      style={{
        position: 'relative',
        width: ringSize,
        height: ringSize,
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes aurea-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes aurea-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(${1 + 0.08 * pulseScale}); opacity: 0.2; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${ringThickness}px solid oklch(0.25 0 0)`,
          borderTopColor: 'oklch(0.85 0.2 95)',
          animation: 'aurea-spin 700ms linear infinite',
        }}
      />
      {showPulse && (
        <div
          style={{
            position: 'absolute',
            inset: -ringThickness,
            borderRadius: '50%',
            border: `${ringThickness}px solid oklch(0.85 0.2 95 / 0.2)`,
            animation: 'aurea-pulse 1.6s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
