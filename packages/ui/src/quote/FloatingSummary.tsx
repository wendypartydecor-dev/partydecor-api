'use client';

import { useQuote } from './QuoteProvider';
import { formatCurrency } from './quote.types';

export function FloatingSummary() {
  const { cotizacion, computed } = useQuote();

  return (
    <div
      className="sticky bottom-0 backdrop-blur-md border-t border-white/10"
      style={{
        background: 'oklch(0.13 0 0 / 0.85)',
      }}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'oklch(0.65 0 0)' }}>Subtotal</span>
          <span style={{ color: 'oklch(0.65 0 0)', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(computed.subtotal_neto, cotizacion.moneda)}
          </span>
        </div>

        {computed.total_descuentos > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'oklch(0.55 0.15 175)' }}>Descuentos</span>
            <span style={{ color: 'oklch(0.55 0.15 175)', fontVariantNumeric: 'tabular-nums' }}>
              -{formatCurrency(computed.total_descuentos, cotizacion.moneda)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'oklch(0.65 0 0)' }}>IVA (16%)</span>
          <span style={{ color: 'oklch(0.65 0 0)', fontVariantNumeric: 'tabular-nums' }}>
            +{formatCurrency(computed.total_iva, cotizacion.moneda)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'oklch(0.55 0.15 175)' }}>
            ISR Ret. (1.25%)
            <span className="ml-1 text-xs" style={{ color: 'oklch(0.45 0.15 175)' }}>(retención)</span>
          </span>
          <span style={{ color: 'oklch(0.55 0.15 175)', fontVariantNumeric: 'tabular-nums' }}>
            -{formatCurrency(computed.total_isr, cotizacion.moneda)}
          </span>
        </div>
        
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'oklch(0.95 0 0)' }}>
              Total
            </span>
            <span 
              className="text-lg font-semibold"
              style={{ color: 'oklch(78% 0.12 75)' }}
            >
              {formatCurrency(computed.total_final, cotizacion.moneda)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
