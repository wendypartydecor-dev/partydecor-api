'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Package, Sparkles } from 'lucide-react';
import type { CatalogItem } from './quote.types';
import { formatCurrency } from './quote.types';

interface CatalogSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (item: CatalogItem) => void;
  results: CatalogItem[];
  isLoading?: boolean;
}

export function CatalogSearch({ query, onQueryChange, onSelect, results, isLoading }: CatalogSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex] as HTMLElement;
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        onQueryChange('');
        break;
    }
  };

  const handleSelect = (item: CatalogItem) => {
    onSelect(item);
    setIsOpen(false);
    onQueryChange('');
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: 'oklch(0.18 0 0)',
          border: isOpen ? '0.5px solid oklch(78% 0.12 75)' : '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.45 0 0)' }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar en catálogo..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'oklch(0.95 0 0)' }}
        />
        {isLoading && (
          <Sparkles className="w-4 h-4 animate-pulse" style={{ color: 'oklch(78% 0.12 75)' }} />
        )}
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          style={{
            background: 'oklch(0.13 0 0)',
            border: '0.5px solid rgba(255,255,255,0.10)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 200ms ease-out',
          }}
        >
          {results.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm" style={{ color: 'oklch(0.50 0 0)' }}>
              Sin resultados para "{query}"
            </div>
          )}
          
          {results.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 p-3 text-left transition-all duration-150"
              style={{
                background: index === selectedIndex ? 'oklch(0.20 0 0)' : 'transparent',
                animation: index < 5 ? 'fadeIn 280ms ease-out' : 'none',
                animationDelay: `${index * 30}ms`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'oklch(0.25 0 0)' }}
              >
                <Package className="w-5 h-5" style={{ color: 'oklch(78% 0.12 75)' }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: 'oklch(0.95 0 0)' }}>
                    {item.nombre}
                  </span>
                  <span 
                    className="px-1.5 py-0.5 rounded text-[10px] shrink-0"
                    style={{ background: 'oklch(0.20 0 0)', color: 'oklch(0.55 0 0)' }}
                  >
                    {item.categoria}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.50 0 0)' }}>
                  {item.unidad}
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="text-sm font-medium" style={{ color: 'oklch(78% 0.12 75)' }}>
                  {formatCurrency(item.precio_sugerido)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
