'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuote } from './QuoteProvider';
import { QuoteItemRow } from './QuoteItemRow';
import { FloatingSummary } from './FloatingSummary';
import { CatalogSearch } from './CatalogSearch';
import type { CatalogItem } from './quote.types';
import { FileText, Send, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';

interface SmartQuoteSidebarProps {
  cotizacionId: string | null;
  eventoId: string;
  tenantId: string;
  onClose: () => void;
  onSaved?: (cotizacionId: string) => void;
  onPdfRequested?: (cotizacionId: string) => void;
}

export function SmartQuoteSidebar({ 
  cotizacionId: initialCotizacionId, 
  eventoId, 
  tenantId,
  onClose 
}: SmartQuoteSidebarProps) {
  const { 
    cotizacion, 
    computed, 
    isDirty, 
    isLoading,
    isSaving,
    error,
    loadCotizacion,
    saveCotizacion,
    addItem,
    addLocalItem,
    cotizacionId 
  } = useQuote();

  const [searchQuery, setSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  useEffect(() => {
    if (eventoId && tenantId) {
      loadCotizacion(eventoId, tenantId);
    }
  }, [eventoId, tenantId, loadCotizacion]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const token = getTokenFromCookies();
          if (!token) return;

          const response = await fetch(
            `/api/catalogos/productos?tenant=${encodeURIComponent(tenantId)}&q=${encodeURIComponent(searchQuery)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setCatalogResults(data.productos || []);
          }
        } catch (err) {
          console.error('[SmartQuoteSidebar] Search error:', err);
        } finally {
          setIsSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCatalogResults([]);
    }
  }, [searchQuery, tenantId]);

  const handleSelectCatalogItem = useCallback((item: CatalogItem) => {
    addItem(item);
    setSearchQuery('');
    setCatalogResults([]);
  }, [addItem]);

  const handleAddLocalItem = useCallback(() => {
    if (newItemName.trim() && newItemPrice) {
      const precio = parseFloat(newItemPrice);
      if (!isNaN(precio) && precio > 0) {
        addLocalItem(newItemName.trim(), precio);
        setNewItemName('');
        setNewItemPrice('');
        setShowNewItemForm(false);
      }
    }
  }, [newItemName, newItemPrice, addLocalItem]);

  const handleSave = useCallback(async () => {
    const savedId = await saveCotizacion();
    if (savedId) {
      console.log('[SmartQuoteSidebar] Saved cotizacion:', savedId);
    }
  }, [saveCotizacion]);

  if (isLoading) {
    return (
      <aside
        className="h-screen flex flex-col border-l border-white/[0.06]"
        style={{
          width: '380px',
          background: 'oklch(0.11 0 0)',
        }}
      >
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'oklch(78% 0.12 75)' }} />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="h-screen flex flex-col border-l border-white/[0.06]"
      style={{
        width: '380px',
        background: 'oklch(0.11 0 0)',
      }}
    >
      <header className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(78% 0.12 75 / 0.15)' }}
          >
            <FileText className="w-5 h-5" style={{ color: 'oklch(78% 0.12 75)' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Cotización</h2>
            <p className="text-xs" style={{ color: 'oklch(0.55 0 0)' }}>
              {cotizacionId ? `ID: ${cotizacionId.substring(0, 8)}...` : 'Nueva cotización'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: 'oklch(0.55 0 0)' }} />
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="p-4">
        <CatalogSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelect={handleSelectCatalogItem}
          results={catalogResults}
          isLoading={isSearching}
        />
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-xs" style={{ color: 'oklch(0.55 0 0)' }}>
          {cotizacion.items.length} ítems
        </span>
        <button
          onClick={() => setShowNewItemForm(true)}
          className="text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'oklch(78% 0.12 75)' }}
        >
          + Item manual
        </button>
      </div>

      {showNewItemForm && (
        <div className="mx-4 mb-2 p-3 rounded-lg" style={{ background: 'oklch(0.15 0 0)' }}>
          <input
            type="text"
            placeholder="Nombre del item"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40 mb-2"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'oklch(0.55 0 0)' }}>$</span>
            <input
              type="number"
              placeholder="Precio"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleAddLocalItem}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'oklch(78% 0.12 75)', color: 'black' }}
            >
              Agregar
            </button>
            <button
              onClick={() => {
                setShowNewItemForm(false);
                setNewItemName('');
                setNewItemPrice('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'oklch(0.2 0 0)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {cotizacion.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'oklch(0.15 0 0)' }}
            >
              <FileText className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-sm mb-1" style={{ color: 'oklch(0.65 0 0)' }}>
              Sin ítems
            </p>
            <p className="text-xs" style={{ color: 'oklch(0.45 0 0)' }}>
              Busca en el catálogo o agrega un item manual
            </p>
          </div>
        ) : (
          cotizacion.items.map((item, index) => (
            <QuoteItemRow 
              key={item.id} 
              item={item} 
              index={index}
              currency={cotizacion.moneda}
            />
          ))
        )}
      </div>

      <FloatingSummary />

      <footer className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || cotizacion.items.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'oklch(78% 0.12 75)',
              color: 'black',
            }}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isDirty ? 'Guardar' : 'Guardado'}
              </>
            )}
          </button>
        </div>
      </footer>
    </aside>
  );
}

function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)aurea_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
