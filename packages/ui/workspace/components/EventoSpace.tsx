'use client';

import { usePanelState, useCanvasState } from '../hooks/usePanelState';
import { LeftPanel } from './panels/LeftPanel';
import { CenterCanvas } from './panels/CenterCanvas';
import { RightPanel } from './panels/RightPanel';
import { CommandPalette } from '../command-palette/CommandPalette';
import { AmbientStatusBar } from './components/AmbientStatusBar';
import type { EventoSpaceProps, AmbientStatusConfig, TimelineEntry, ClienteSummary } from '../types/space.types';

interface EventoSpaceFullProps extends EventoSpaceProps {
  evento: {
    id: string;
    cli: string;
    tipo: string;
    f_ev: string | null;
    saldo: number;
    estado: string;
  };
  timeline: TimelineEntry[];
  cliente: ClienteSummary | null;
  ambientStatus: AmbientStatusConfig;
  pluginTabs?: React.ReactNode;
  checklistSlot?: React.ReactNode;
  pluginSlot?: React.ReactNode;
  onViewFullClient: () => void;
  onMarkDirty: () => void;
  onMarkClean: () => void;
}

export function EventoSpace({
  eventoId,
  evento,
  timeline,
  cliente,
  ambientStatus,
  initialTab = 'items',
  initialMode = 'view',
  pluginTabs,
  checklistSlot,
  pluginSlot,
  onViewFullClient,
  onMarkDirty,
  onMarkClean,
}: EventoSpaceFullProps) {
  const { visibility, toggleLeft, toggleRight, isInitialized } = usePanelState({ eventoId });
  const { canvasState, setMode, setActiveTab, markDirty, markClean, setFocusedItem } = useCanvasState(initialTab, initialMode);

  if (!isInitialized) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-aurea-gold/30 border-t-aurea-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <AmbientStatusBar status={ambientStatus} />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          eventoId={eventoId}
          timeline={timeline}
          ambientStatus={ambientStatus}
          isOpen={visibility.left}
          onToggle={toggleLeft}
          checklistSlot={checklistSlot}
        />

        <CenterCanvas
          evento={evento}
          canvasState={canvasState}
          onModeChange={setMode}
          onTabChange={setActiveTab}
          onMarkDirty={() => { markDirty(); onMarkDirty(); }}
          onMarkClean={() => { markClean(); onMarkClean(); }}
          onFocusItem={setFocusedItem}
          pluginTabs={pluginTabs}
        />

        <RightPanel
          cliente={cliente}
          historialCount={timeline.length}
          isOpen={visibility.right}
          onToggle={toggleRight}
          pluginSlot={pluginSlot}
          onViewFullClient={onViewFullClient}
        />
      </div>

      <CommandPalette
        currentSpace="eventos"
        currentEntityId={eventoId}
      />
    </div>
  );
}
