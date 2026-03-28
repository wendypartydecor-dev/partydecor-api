'use client';

import { useQuote } from './QuoteProvider';
import { formatCurrency } from './quote.types';

export function FloatingSummary() {
  const { cotizacion, computed } = useQuote();
  
  const activeTaxes = cotizacion.impuestos.filter(t => t.activo);

  return (
    <div
      className="sticky bottom-0 backdrop-blur-md border-t border-white/10"
      style={{
        background: 'oklch(0.13 0 0 / 0.85)',
      }}
    >
      <div className="p-4 space-y-3">
        {activeTaxes.map(tax => {
          const monto = tax.es_retencion 
            ? computed.total_retenciones 
            : computed.total_impuestos;
          const isRetencion = tax.key === 'isr';
          
          return (
            <div key={tax.key} className="flex items-center justify-between text-sm">
              <span style={{ color: 'oklch(0.65 0 0)' }}>
                {tax.nombre}
                {isRetencion && <span className="ml-1 text-xs" style={{ color: 'oklch(0.55 0.15 175)' }}>(retención)</span>}
              </span>
              <span 
                className={isRetencion ? 'text-[oklch(0.55_0.15_175)]' : ''}
                style={{ 
                  color: isRetencion ? 'oklch(0.55 0.15 175)' : 'oklch(0.65 0 0)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isRetencion ? '-' : ''}{formatCurrency(monto, cotizacion.moneda)}
              </span>
            </div>
          );
        })}
        
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
