'use client';

import { Maximize2, Minimize2 } from 'lucide-react';

interface FocusModeButtonProps {
  isActive: boolean;
  onToggle: () => void;
}

export function FocusModeButton({ isActive, onToggle }: FocusModeButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all
        ${isActive
          ? 'bg-aurea-gold text-white'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
        }
      `}
      title={isActive ? 'Salir del modo enfoque' : 'Modo enfoque'}
    >
      {isActive ? (
        <Minimize2 className="w-4 h-4" />
      ) : (
        <Maximize2 className="w-4 h-4" />
      )}
      {isActive ? 'Salir' : 'Enfoque'}
    </button>
  );
}
