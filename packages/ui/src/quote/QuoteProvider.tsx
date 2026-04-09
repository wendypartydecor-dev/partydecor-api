'use client';

import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  type QuoteItem,
  type Cotizacion,
  type CotizacionComputed,
  type CatalogItem,
  type CotizacionApiResponse,
  type QuoteItemApiResponse,
  calculateQuoteTotals,
  createQuoteItemSnapshot,
  createLocalQuoteItem,
  roundCurrency,
  mapApiItemToQuoteItem,
  quoteItemToApiFormat,
} from './quote.types';

interface QuoteContextType {
  cotizacion: Cotizacion;
  computed: CotizacionComputed;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  cotizacionId: string | null;
  loadCotizacion: (eventoId: string, tenantId: string) => Promise<void>;
  saveCotizacion: () => Promise<string | null>;
  addItem: (catalogItem: CatalogItem) => void;
  addLocalItem: (name: string, precio: number) => void;
  updateItem: (id: string, patch: Partial<QuoteItem>) => void;
  removeItem: (id: string) => void;
  toggleIva: (id: string) => void;
  toggleIsr: (id: string) => void;
  reorderItems: (startIndex: number, endIndex: number) => void;
  setMoneda: (moneda: 'MXN' | 'USD') => void;
  resetQuote: () => void;
}

const DEFAULT_TAXES = [
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
  subtotal: 0,
  total: 0,
  anticipo: 0,
  saldo: 0,
  creado_en: new Date().toISOString(),
  actualizado_en: new Date().toISOString(),
};

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ 
  children, 
  initialQuote,
  tenantId,
}: { 
  children: ReactNode;
  initialQuote?: Partial<Cotizacion>;
  tenantId?: string;
}) {
  const [cotizacion, setCotizacionState] = useState<Cotizacion>({
    ...DEFAULT_QUOTE,
    ...initialQuote,
    tenant_id: tenantId || initialQuote?.tenant_id || '',
    impuestos: initialQuote?.impuestos ?? DEFAULT_TAXES,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cotizacionId, setCotizacionId] = useState<string | null>(null);
  const tenantIdRef = useRef<string | null>(tenantId || null);

  const computed = useMemo(() => {
    return calculateQuoteTotals(cotizacion.items, cotizacion.impuestos);
  }, [cotizacion.items, cotizacion.impuestos]);

  const loadCotizacion = useCallback(async (eventoId: string, tenant: string) => {
    setIsLoading(true);
    setError(null);
    tenantIdRef.current = tenant;

    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`/api/cotizaciones?evento=${eventoId}&tenant=${tenant}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar cotización');
      }

      const data = await response.json();
      const cotizaciones = data.cotizaciones || [];

      if (cotizaciones.length > 0) {
        const apiCotizacion: CotizacionApiResponse = cotizaciones[0];
        setCotizacionId(apiCotizacion.id);
        
        const itemsResponse = await fetch(`/api/cotizaciones/${apiCotizacion.id}/items`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let items: QuoteItem[] = [];
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          items = (itemsData.items || []).map(mapApiItemToQuoteItem);
        }

        setCotizacionState({
          id: apiCotizacion.id,
          evento_id: apiCotizacion.evento_id,
          tenant_id: apiCotizacion.tenant_id,
          folio: null,
          moneda: 'MXN',
          tipo_cambio: 1,
          estado: apiCotizacion.status as Cotizacion['estado'],
          notas: apiCotizacion.notes || '',
          items,
          impuestos: DEFAULT_TAXES,
          subtotal: apiCotizacion.subtotal,
          total: apiCotizacion.total,
          anticipo: apiCotizacion.anticipo,
          saldo: apiCotizacion.saldo,
          creado_en: apiCotizacion.created_at,
          actualizado_en: apiCotizacion.updated_at,
        });
      } else {
        setCotizacionId(null);
        setCotizacionState({
          ...DEFAULT_QUOTE,
          evento_id: eventoId,
          tenant_id: tenant,
        });
      }
    } catch (err) {
      console.error('[QuoteProvider] loadCotizacion error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCotizacion = useCallback(async (): Promise<string | null> => {
    if (!cotizacion.evento_id || !cotizacion.tenant_id) {
      setError('Falta información del evento o tenant');
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const itemsPayload = cotizacion.items.map(quoteItemToApiFormat);

      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          evento_id: cotizacion.evento_id,
          tenant_id: cotizacion.tenant_id,
          items: itemsPayload,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.details || 'Error al guardar');
      }

      const data = await response.json();
      
      if (data.cotizacion) {
        setCotizacionId(data.cotizacion.id);
      }
      
      setIsDirty(false);
      
      if (data.items) {
        const updatedItems = data.items.map(mapApiItemToQuoteItem);
        setCotizacionState(prev => ({
          ...prev,
          items: updatedItems,
          total: data.cotizacion?.total || computed.total_final,
        }));
      }

      return data.cotizacion?.id || cotizacionId;
    } catch (err) {
      console.error('[QuoteProvider] saveCotizacion error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [cotizacion, cotizacionId, computed.total_final]);

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

  const addLocalItem = useCallback((name: string, precio: number) => {
    const newItem = createLocalQuoteItem(name, precio);
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

  const toggleIva = useCallback((id: string) => {
    setCotizacionState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, incluye_iva: !item.incluye_iva } : item
      ),
      actualizado_en: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const toggleIsr = useCallback((id: string) => {
    setCotizacionState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, incluye_isr: !item.incluye_isr } : item
      ),
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
    setCotizacionId(null);
    setIsDirty(false);
    setError(null);
  }, []);

  return (
    <QuoteContext.Provider value={{
      cotizacion,
      computed,
      isDirty,
      isLoading,
      isSaving,
      error,
      cotizacionId,
      loadCotizacion,
      saveCotizacion,
      addItem,
      addLocalItem,
      updateItem,
      removeItem,
      toggleIva,
      toggleIsr,
      reorderItems,
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

function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)aurea_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
