'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  type QuoteItem,
  type Cotizacion,
  type TaxConfig,
  type CotizacionComputed,
  type CatalogItem,
  calculateQuoteTotals,
  createQuoteItemSnapshot,
  roundCurrency,
} from './quote.types';

interface QuoteContextType {
  cotizacion: Cotizacion;
  computed: CotizacionComputed;
  isDirty: boolean;
  setCotizacion: (cotizacion: Cotizacion) => void;
  addItem: (catalogItem: CatalogItem) => void;
  updateItem: (id: string, patch: Partial<QuoteItem>) => void;
  removeItem: (id: string) => void;
  reorderItems: (startIndex: number, endIndex: number) => void;
  toggleTax: (key: string) => void;
  updateTaxRate: (key: string, tasa: number) => void;
  setMoneda: (moneda: 'MXN' | 'USD') => void;
  resetQuote: () => void;
}

const DEFAULT_TAXES: TaxConfig[] = [
  { key: 'iva', nombre: 'IVA', tasa: 16, activo: true, es_retencion: false },
  { key: 'isr', nombre: 'ISR Ret.', tasa: 1.25, activo: true, es_retencion: true },
];

const DEFAULT_QUOTE: Cotizacion = {
  id: '',
  evento_id: '',
  tenant_id: '',
  folio: null,
  moneda: 'MXN',
  tipo_cambio: 1,
  estado: 'borrador',
  notas: '',
  items: [],
  impuestos: DEFAULT_TAXES,
  creado_en: new Date().toISOString(),
  actualizado_en: new Date().toISOString(),
};

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ 
  children, 
  initialQuote 
}: { 
  children: ReactNode;
  initialQuote?: Partial<Cotizacion>;
}) {
  const [cotizacion, setCotizacionState] = useState<Cotizacion>({
    ...DEFAULT_QUOTE,
    ...initialQuote,
    impuestos: initialQuote?.impuestos ?? DEFAULT_TAXES,
  });
  const [isDirty, setIsDirty] = useState(false);

  const computed = useMemo(() => {
    return calculateQuoteTotals(cotizacion.items, cotizacion.impuestos);
  }, [cotizacion.items, cotizacion.impuestos]);

  const setCotizacion = useCallback((newQuote: Cotizacion) => {
    setCotizacionState(newQuote);
    setIsDirty(false);
  }, []);

  const addItem = useCallback((catalogItem: CatalogItem) => {
    const newItem = createQuoteItemSnapshot(catalogItem);
    newItem.sort_order = cotizacion.items.length;
    
    setCotizacionState(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      actualizado_en: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, [cotizacion.items.length]);

  const updateItem = useCallback((id: string, patch: Partial<QuoteItem>) => {
    setCotizacionState(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        
        const updated = { ...item, ...patch };
        
        if ('precio_unitario' in patch || 'descuento_pct' in patch || 'cantidad' in patch) {
          updated.precio_unitario = roundCurrency(updated.precio_unitario);
          updated.descuento_pct = Math.max(0, Math.min(100, updated.descuento_pct));
          updated.cantidad = Math.max(1, Math.round(updated.cantidad));
        }
        
        return updated;
      }),
      actualizado_en: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setCotizacionState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
      actualizado_en: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const reorderItems = useCallback((startIndex: number, endIndex: number) => {
    setCotizacionState(prev => {
      const items = Array.from(prev.items);
      const [removed] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, removed);
      
      return {
        ...prev,
        items: items.map((item, index) => ({ ...item, sort_order: index })),
        actualizado_en: new Date().toISOString(),
      };
    });
    setIsDirty(true);
  }, []);

  const toggleTax = useCallback((key: string) => {
    setCotizacionState(prev => ({
      ...prev,
      impuestos: prev.impuestos.map(tax => 
        tax.key === key ? { ...tax, activo: !tax.activo } : tax
      ),
      actualizado_en: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const updateTaxRate = useCallback((key: string, tasa: number) => {
    setCotizacionState(prev => ({
      ...prev,
      impuestos: prev.impuestos.map(tax => 
        tax.key === key ? { ...tax, tasa: roundCurrency(tasa) } : tax
      ),
      actualizado_en: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const setMoneda = useCallback((moneda: 'MXN' | 'USD') => {
    setCotizacionState(prev => ({
      ...prev,
      moneda,
      tipo_cambio: moneda === 'MXN' ? 1 : 18.5,
    }));
    setIsDirty(true);
  }, []);

  const resetQuote = useCallback(() => {
    setCotizacionState(DEFAULT_QUOTE);
    setIsDirty(false);
  }, []);

  return (
    <QuoteContext.Provider value={{
      cotizacion,
      computed,
      isDirty,
      setCotizacion,
      addItem,
      updateItem,
      removeItem,
      reorderItems,
      toggleTax,
      updateTaxRate,
      setMoneda,
      resetQuote,
    }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) {
    throw new Error('useQuote must be used within QuoteProvider');
  }
  return ctx;
}
