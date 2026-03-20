'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Command, FileText, CheckCircle, FileDown, X } from 'lucide-react';
import type { CommandItem } from '../../types/space.types';

interface CommandPaletteProps {
  currentSpace: 'dashboard' | 'eventos' | 'clientes' | string;
  currentEntityId?: string;
}

interface CommandGroup {
  label: string;
  items: CommandItem[];
}

export function CommandPalette({ currentSpace, currentEntityId }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const commands: CommandGroup[] = [
    {
      label: 'Acciones rápidas',
      items: [
        {
          id: 'create-quote',
          label: 'Crear cotización',
          icon: 'FileText',
          shortcut: '⌘⇧C',
          action: () => console.log('Crear cotización'),
          keywords: ['cotiz', 'quote', 'presupuesto'],
        },
        {
          id: 'mark-paid',
          label: 'Registrar pago',
          icon: 'CheckCircle',
          shortcut: '⌘⇧P',
          action: () => console.log('Registrar pago'),
          keywords: ['pagad', 'cobr', 'pago'],
        },
        {
          id: 'generate-pdf',
          label: 'Generar y compartir PDF',
          icon: 'FileDown',
          shortcut: '⌘⇧E',
          action: () => console.log('Generar PDF'),
          keywords: ['pdf', 'imprimir', 'enviar'],
        },
      ],
    },
  ];

  const filteredCommands = commands
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords?.some((kw) => kw.toLowerCase().includes(query.toLowerCase()))
      ),
    }))
    .filter((group) => group.items.length > 0);

  const flatItems = filteredCommands.flatMap((g) => g.items);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: CommandItem) => {
    item.action();
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acciones, eventos, clientes..."
            className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded">
            <Command className="w-3 h-3" /> K
          </kbd>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              No se encontraron comandos
            </div>
          ) : (
            filteredCommands.map((group) => (
              <div key={group.label} className="px-2 py-1">
                <p className="px-3 py-1 text-xs font-semibold text-neutral-400 uppercase">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${flatItems[selectedIndex]?.id === item.id
                        ? 'bg-aurea-gold/10 text-aurea-gold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }
                    `}
                  >
                    {item.icon && <span className="text-lg">{getIcon(item.icon)}</span>}
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-500">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getIcon(iconName: string): string {
  const icons: Record<string, string> = {
    FileText: '📄',
    CheckCircle: '✅',
    FileDown: '📥',
    Search: '🔍',
  };
  return icons[iconName] || '•';
}
