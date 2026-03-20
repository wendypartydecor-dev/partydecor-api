'use client';

import { useEffect } from 'react';
import { Package, FileText, Loader2 } from 'lucide-react';
import { SpaceTabBar } from '../components/SpaceTabBar';
import type { CanvasMode } from '../../types/space.types';

interface CanvasItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  tipo: string;
}

interface CenterCanvasProps {
  evento: {
    id: string;
    cli: string;
    tipo: string;
    f_ev: string | null;
    saldo: number;
    estado: string;
  };
  canvasState: {
    mode: CanvasMode;
    activeTab: string;
    isDirty: boolean;
    focusedItemId: string | null;
    scrollPosition: number;
  };
  onModeChange: (mode: CanvasMode) => void;
  onTabChange: (tab: string) => void;
  onMarkDirty: () => void;
  onMarkClean: () => void;
  onFocusItem: (id: string | null) => void;
  pluginTabs?: React.ReactNode;
}

export function CenterCanvas({
  evento,
  canvasState,
  onModeChange,
  onTabChange,
  onMarkDirty,
  onMarkClean,
  onFocusItem,
  pluginTabs,
}: CenterCanvasProps) {
  const { mode, activeTab, isDirty, focusedItemId } = canvasState;

  useEffect(() => {
    if (focusedItemId) {
      const element = document.getElementById(`item-${focusedItemId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedItemId]);

  const tabs = [
    { id: 'items', label: 'Items', icon: Package },
    { id: 'pdf', label: 'PDF', icon: FileText },
    ...(pluginTabs ? [{ id: 'plugin', label: 'Plugin', icon: Package }] : []),
  ];

  return (
    <main className="flex-1 flex flex-col min-w-[360px] max-w-[640px] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {evento.cli || 'Evento sin nombre'}
          </h2>
          {isDirty && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sin guardar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange(mode === 'edit' ? 'view' : 'edit')}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${mode === 'edit'
                ? 'bg-aurea-gold text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }
            `}
          >
            {mode === 'edit' ? 'Guardar' : 'Editar'}
          </button>
        </div>
      </div>

      <SpaceTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'items' && (
          <ItemsTab
            eventoId={evento.id}
            isEditing={mode === 'edit'}
            onMarkDirty={onMarkDirty}
            onMarkClean={onMarkClean}
          />
        )}

        {activeTab === 'pdf' && (
          <PDFTab eventoId={evento.id} />
        )}

        {activeTab === 'plugin' && pluginTabs}
      </div>
    </main>
  );
}

function ItemsTab({
  eventoId,
  isEditing,
  onMarkDirty,
  onMarkClean,
}: {
  eventoId: string;
  isEditing: boolean;
  onMarkDirty: () => void;
  onMarkClean: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Items del Evento</h3>
        {isEditing && (
          <button
            onClick={onMarkDirty}
            className="text-sm text-aurea-gold hover:text-aurea-gold-hover transition-colors"
          >
            + Agregar item
          </button>
        )}
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Conecta con tu API para cargar items...
      </p>
    </div>
  );
}

function PDFTab({ eventoId }: { eventoId: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Vista previa del PDF</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Genera la cotización para ver la preview
      </p>
    </div>
  );
}
