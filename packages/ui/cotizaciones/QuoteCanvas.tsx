'use client';

import { useEffect, useCallback, useState } from 'react';
import { Loader2, Eye } from 'lucide-react';
import { QuoteItemRow } from './QuoteItemRow';
import { FloatingSummary } from './FloatingSummary';
import { AddItemBar } from './AddItemBar';
import { FocusModeButton } from './FocusModeButton';
import { useQuoteCanvas } from '../../../../packages/core/cotizaciones/useQuoteCanvas';
import { computeQuoteTotals } from '../../../../packages/core/cotizaciones/useQuoteTotals';
import type { QuoteItem, Quote } from '../../../../packages/core/cotizaciones/quote.types';

interface QuoteCanvasProps {
  eventoId: string;
  initialQuote?: Quote;
  onOpenCatalog: () => void;
  onOpenCommandPalette: () => void;
}

export function QuoteCanvas({
  eventoId,
  initialQuote,
  onOpenCatalog,
  onOpenCommandPalette,
}: QuoteCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [emitStatus, setEmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    items,
    isDirty,
    isSaving,
    focusMode,
    activeItemId,
    version,
    loadQuote,
    loadFromStorage,
    addItem,
    removeItem,
    updateQuantity,
    reorderItems,
    setFocusMode,
    setActiveItem,
    getTotals,
    saveToSupabase,
  } = useQuoteCanvas();

  useEffect(() => {
    if (initialQuote) {
      loadQuote(initialQuote);
    } else if (!loadFromStorage(eventoId)) {
      // No draft found, start fresh
    }
    setIsInitialized(true);
  }, [eventoId, initialQuote, loadQuote, loadFromStorage]);

  const totals = computeQuoteTotals(items);
  const outOfStockCount = items.filter(i => i.stockStatus === 'out_of_stock').length;

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex) {
      reorderItems(fromIndex, toIndex);
    }
    setDragOverIndex(null);
  }, [reorderItems]);

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleEmit = useCallback(async () => {
    if (items.length === 0) return;
    
    setEmitStatus('loading');
    
    try {
      await saveToSupabase();
      setEmitStatus('success');
      setTimeout(() => setEmitStatus('idle'), 3000);
    } catch {
      setEmitStatus('error');
    }
  }, [items.length, saveToSupabase]);

  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  }, [updateQuantity]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-aurea-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Cotización
          </h2>
          {version > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded">
              v{version}
            </span>
          )}
          {isDirty && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sin guardar
            </span>
          )}
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Guardando...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FocusModeButton
            isActive={focusMode}
            onToggle={() => setFocusMode(!focusMode)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-[160px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Comienza tu cotización
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mb-6">
              Añade ítems desde el catálogo o usa ⌘K para buscar rápidamente
            </p>
            <button
              onClick={onOpenCatalog}
              className="px-4 py-2 text-sm font-medium text-aurea-gold bg-aurea-gold/10 hover:bg-aurea-gold/20 rounded-xl transition-colors"
            >
              Añadir primer ítem
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`transition-all ${
                  dragOverIndex === index ? 'translate-y-2 border-t-2 border-aurea-gold' : ''
                }`}
              >
                <QuoteItemRow
                  item={item}
                  isActive={activeItemId === item.id}
                  onSelect={() => setActiveItem(item.id)}
                  onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                  onRemove={() => removeItem(item.id)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AddItemBar
        onOpenCatalog={onOpenCatalog}
        onOpenCommandPalette={onOpenCommandPalette}
      />

      <FloatingSummary
        totals={totals}
        isEmitting={emitStatus === 'loading'}
        emitStatus={emitStatus}
        onEmit={handleEmit}
        outOfStockCount={outOfStockCount}
      />
    </div>
  );
}
