'use client';

import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

interface AddItemBarProps {
  onOpenCatalog: () => void;
  onOpenCommandPalette: () => void;
}

export function AddItemBar({ onOpenCatalog, onOpenCommandPalette }: AddItemBarProps) {
  const [isSearchActive, setIsSearchActive] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      {isSearchActive ? (
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar en catálogo..."
            className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            autoFocus
          />
          <button
            onClick={() => setIsSearchActive(false)}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={onOpenCatalog}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-aurea-gold bg-aurea-gold/10 hover:bg-aurea-gold/20 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Añadir ítem
          </button>
          
          <button
            onClick={() => setIsSearchActive(true)}
            className="flex items-center justify-center w-10 h-10 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center justify-center w-10 h-10 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            title="Buscar en catálogo (⌘⇧A)"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h4" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
