export const STATUS_COLORS = {
  urgent: 'oklch(60% 0.20 25)',
  overdue: 'oklch(62% 0.18 30)',
  pending: 'oklch(72% 0.14 72)',
  upcoming: 'oklch(68% 0.10 280)',
  confirmed: 'oklch(55% 0.15 175)',
  past: 'oklch(70% 0.02 260)',
} as const;

export type EventStatus = keyof typeof STATUS_COLORS;

export interface EventoResumen {
  id: string;
  nombre_evento: string;
  fecha_evento: string;
  estado: 'prospecto' | 'cotizado' | 'confirmado' | 'montaje' | 'finalizado';
  cliente: {
    id: string;
    nombre: string;
    telefono?: string;
  };
  monto_total: number;
  anticipo: number;
  saldo_pendiente: number;
  lugar?: string;
  capacidad?: number;
  tags?: string[];
  id_tenant: string;
}

export interface WorkspaceState {
  tenantId: string | null;
  tenantName: string;
  accentColor: string;
  selectedEventId: string | null;
  isSidebarCollapsed: boolean;
  isDetailOpen: boolean;
}

export function resolveEventStatus(evento: EventoResumen): EventStatus {
  const today = new Date();
  const eventDate = new Date(evento.fecha_evento);
  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (evento.estado === 'finalizado') return 'past';
  if (evento.estado === 'prospecto') return 'pending';
  if (evento.saldo_pendiente > 0 && diffDays < 0) return 'overdue';
  if (diffDays <= 1) return 'urgent';
  if (diffDays <= 7) return 'upcoming';
  if (evento.estado === 'confirmado') return 'confirmed';
  return 'confirmed';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
