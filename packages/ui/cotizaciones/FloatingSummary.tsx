'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Check, Loader2, AlertTriangle } from 'lucide-react';
import type { QuoteTotals } from '../../../../packages/core/cotizaciones/quote.types';
import { formatCurrency } from '../../../../packages/core/cotizaciones/useQuoteTotals';

interface FloatingSummaryProps {
  totals: QuoteTotals;
  isEmitting: boolean;
  emitStatus: 'idle' | 'loading' | 'success' | 'error';
  onEmit: () => void;
  outOfStockCount: number;
  anticipo?: number;
  onAnticipoChange?: (value: number) => void;
}

type FlipKey = 'subtotal' | 'discount' | 'total';

export function FloatingSummary({
  totals,
  isEmitting,
  emitStatus,
  onEmit,
  outOfStockCount,
  anticipo = 0,
  onAnticipoChange,
}: FloatingSummaryProps) {
  const [flipKeys, setFlipKeys] = useState<Set<FlipKey>>(new Set());
  const prevTotalsRef = useRef(totals);
  
  useEffect(() => {
    const newFlipKeys = new Set<FlipKey>();
    const prev = prevTotalsRef.current;
    
    if (prev.subtotal !== totals.subtotal) newFlipKeys.add('subtotal');
    if (prev.discountTotal !== totals.discountTotal) newFlipKeys.add('discount');
    if (prev.total !== totals.total) newFlipKeys.add('total');
    
    if (newFlipKeys.size > 0) {
      setFlipKeys(newFlipKeys);
      const timer = setTimeout(() => setFlipKeys(new Set()), 150);
      prevTotalsRef.current = totals;
      return () => clearTimeout(timer);
    }
  }, [totals]);

  const saldo = totals.total - anticipo;
  const isEmpty = totals.itemCount === 0;
  const hasWarning = outOfStockCount > 0;
  const canEmit = totals.itemCount > 0 && !isEmitting;

  const getEmitButtonContent = () => {
    if (emitStatus === 'loading') {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generando PDF...
        </>
      );
    }
    if (emitStatus === 'success') {
      return (
        <>
          <Check className="w-4 h-4" />
          PDF listo · Compartir
        </>
      );
    }
    if (emitStatus === 'error') {
      return 'Reintentar';
    }
    if (hasWarning) {
      return (
        <>
          <AlertTriangle className="w-4 h-4" />
          Emitir ({outOfStockCount} sin stock)
        </>
      );
    }
    return (
      <>
        <Send className="w-4 h-4" />
        Emitir Cotización
      </>
    );
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1 grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
              Subtotal
            </p>
            <p
              key={`subtotal-${flipKeys.has('subtotal')}`}
              className={`text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 transition-all ${
                flipKeys.has('subtotal') ? 'animate-flip-in' : ''
              }`}
            >
              {formatCurrency(totals.subtotal)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
              Descuento
            </p>
            <p
              key={`discount-${flipKeys.has('discount')}`}
              className={`text-lg font-semibold tabular-nums text-aurea-logistics-confirmed-text transition-all ${
                flipKeys.has('discount') ? 'animate-flip-in' : ''
              }`}
            >
              {totals.hasDiscounts ? `-${formatCurrency(totals.discountTotal)}` : '—'}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
              Total
            </p>
            <p
              key={`total-${flipKeys.has('total')}`}
              className={`text-xl font-bold tabular-nums transition-all ${
                flipKeys.has('total') ? 'animate-flip-in scale-105' : ''
              } ${hasWarning ? 'text-aurea-logistics-urgent-text' : 'text-aurea-gold'}`}
            >
              {formatCurrency(totals.total)}
            </p>
          </div>
        </div>

        <div className="ml-6">
          <button
            onClick={onEmit}
            disabled={!canEmit}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
              ${emitStatus === 'success'
                ? 'bg-aurea-logistics-confirmed-border text-white hover:bg-aurea-logistics-confirmed-border/80'
                : 'bg-aurea-gold text-white hover:bg-aurea-gold-hover'
              }
              ${!canEmit ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              disabled:cursor-not-allowed
            `}
          >
            {getEmitButtonContent()}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-6 pb-3 text-xs text-neutral-400">
        <span>{totals.itemCount} items</span>
        {totals.hasDiscounts && (
          <span className="text-aurea-logistics-confirmed-text">
            Ahorraste {totals.savingsPercentage}%
          </span>
        )}
        {hasWarning && (
          <span className="text-aurea-logistics-urgent-text">
            {outOfStockCount} sin stock
          </span>
        )}
      </div>
    </div>
  );
}
