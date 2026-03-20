export type PanelMode = 'default' | 'collapsed' | 'expanded' | 'hidden';
export type CanvasMode = 'view' | 'edit' | 'pdf-preview' | 'focus';

export interface PanelConfig {
  width: number;
  tabletBehavior: 'sheet' | 'split' | 'hidden';
  collapsible: boolean;
  sheetPriority: number;
}

export const PANEL_DEFAULTS: Record<'left' | 'center' | 'right', PanelConfig> = {
  left: {
    width: 280,
    tabletBehavior: 'sheet',
    collapsible: true,
    sheetPriority: 1,
  },
  center: {
    width: 480,
    tabletBehavior: 'split',
    collapsible: false,
    sheetPriority: 0,
  },
  right: {
    width: 260,
    tabletBehavior: 'sheet',
    collapsible: true,
    sheetPriority: 2,
  },
};

export interface CanvasState {
  mode: CanvasMode;
  activeTab: string;
  isDirty: boolean;
  focusedItemId: string | null;
  scrollPosition: number;
}

export type AmbientStatusLevel = 'clear' | 'pending' | 'urgent' | 'critical';

export interface AmbientStatusConfig {
  level: AmbientStatusLevel;
  message: string;
  ctaLabel?: string;
}

export interface TimelineEntry {
  id: string;
  type: 'created' | 'payment' | 'edit' | 'note' | 'plugin_event';
  label: string;
  timestamp: string;
  userId: string;
  meta?: Record<string, unknown>;
  isUrgent: boolean;
}

export interface ClienteSummary {
  id: string;
  nombre: string;
  tel1: string;
  tipo: string;
  eventosCount: number;
  totalVentas: number;
}

export interface EventoSpaceProps {
  eventoId: string;
  initialTab?: string;
  initialMode?: CanvasMode;
}

export interface LeftPanelProps {
  eventoId: string;
  timeline: TimelineEntry[];
  ambientStatus: AmbientStatusConfig;
  checklistSlot?: React.ReactNode;
}

export interface RightPanelProps {
  cliente: ClienteSummary | null;
  historialCount: number;
  pluginSlot?: React.ReactNode;
  onViewFullClient: () => void;
}
