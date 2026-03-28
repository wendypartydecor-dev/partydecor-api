'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuote } from './QuoteProvider';
import { QuoteItemRow } from './QuoteItemRow';
import { FloatingSummary } from './FloatingSummary';
import { CatalogSearch } from './CatalogSearch';
import type { CatalogItem } from './quote.types';
import { X, FileText, Send, Loader2, ChevronLeft } from 'lucide-react';

interface SmartQuoteSidebarProps {
  cotizacionId: string | null;
  eventoId: string;
  onClose: () => void;
  onSaved?: (cotizacion: any) => void;
  onPdfRequested?: (cotizacionId: string) => void;
}

const MOCK_CATALOG: CatalogItem[] = [
  { id: '1', nombre: 'Silla Tiffany Blanca', precio_sugerido: 150, categoria: 'Mobiliario', unidad: 'por pieza', icono: 'chair' },
  { id: '2', nombre: 'Mesa Redonda 150cm', precio_sugerido: 450, categoria: 'Mobiliario', unidad: 'por pieza', icono: 'table' },
  { id: '3', nombre: 'Mantel Blanco 300x150', precio_sugerido: 200, categoria: 'Textil', unidad: 'por pieza', icono: 'cloth' },
  { id: '4', nombre: 'Arreglo Floral Premium', precio_sugerido: 850, categoria: 'Floral', unidad: 'por arreglo', icono: 'flower' },
  { id: '5', nombre: 'Iluminación LED RGB', precio_sugerido: 1200, categoria: 'Iluminación', unidad: 'por paquete', icono: 'light' },
  { id: '6', nombre: 'DJ + Equipamiento', precio_sugerido: 3500, categoria: 'Audio', unidad: 'por evento', icono: 'music' },
  { id: '7', nombre: 'Catering Basic p/persona', precio_sugerido: 280, categoria: 'Catering', unidad: 'por persona', icono: 'food' },
  { id: '8', nombre: 'Carpa 10x20m', precio_sugerido: 8500, categoria: 'Instalación', unidad: 'por evento', icono: 'tent' },
];

export function SmartQuoteSidebar({ cotizacionId, eventoId, onClose }: SmartQuoteSidebarProps) {
  const { cotizacion, computed, isDirty, addItem } = useQuote();
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const results = MOCK_CATALOG.filter(item =>
          item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.categoria.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setCatalogResults(results);
        setIsSearching(false);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setCatalogResults([]);
    }
  }, [searchQuery]);

  const handleSelectCatalogItem = useCallback((item: CatalogItem) => {
    addItem(item);
  }, [addItem]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
  }, []);

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
              {cotizacion.folio || 'Nueva cotización'}
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

      <div className="p-4">
        <CatalogSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelect={handleSelectCatalogItem}
          results={catalogResults}
          isLoading={isSearching}
        />
      </div>

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
              Busca en el catálogo para agregar productos
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
