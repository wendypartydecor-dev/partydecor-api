export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatCurrency(amount: number, currency: 'MXN' | 'USD' = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
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

export const STATUS_COLORS = {
  urgent: 'oklch(60% 0.20 25)',
  overdue: 'oklch(62% 0.18 30)',
  pending: 'oklch(72% 0.14 72)',
  upcoming: 'oklch(68% 0.10 280)',
  confirmed: 'oklch(55% 0.15 175)',
  past: 'oklch(70% 0.02 260)',
} as const;

export type EventStatus = keyof typeof STATUS_COLORS;

interface EventoForStatus {
  estado: 'prospecto' | 'cotizado' | 'confirmado' | 'montaje' | 'finalizado';
  fecha_evento: string;
  saldo_pendiente: number;
}

export function resolveEventStatus(evento: EventoForStatus): EventStatus {
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
