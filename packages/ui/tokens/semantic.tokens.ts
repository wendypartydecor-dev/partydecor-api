export const semanticTokens = {
  financial: {
    pending: {
      surface: 'oklch(95% 0.06 75)',
      border: 'oklch(72% 0.14 72)',
      text: 'oklch(42% 0.14 72)',
      ambient: 'oklch(72% 0.14 72)',
    },
    paid: {
      surface: 'oklch(94% 0.05 180)',
      border: 'oklch(62% 0.12 180)',
      text: 'oklch(38% 0.12 180)',
      ambient: 'oklch(62% 0.12 180)',
    },
    overdue: {
      surface: 'oklch(94% 0.06 30)',
      border: 'oklch(62% 0.18 30)',
      text: 'oklch(38% 0.18 30)',
      ambient: 'oklch(62% 0.18 30)',
    },
  },
  logistics: {
    urgent: {
      surface: 'oklch(93% 0.07 25)',
      border: 'oklch(60% 0.20 25)',
      text: 'oklch(36% 0.20 25)',
      pulse: 'oklch(60% 0.20 25)',
      ambient: 'oklch(60% 0.20 25)',
    },
    upcoming: {
      surface: 'oklch(95% 0.04 280)',
      border: 'oklch(68% 0.10 280)',
      text: 'oklch(40% 0.10 280)',
      ambient: 'oklch(68% 0.10 280)',
    },
    confirmed: {
      surface: 'oklch(93% 0.06 175)',
      border: 'oklch(55% 0.15 175)',
      text: 'oklch(32% 0.15 175)',
    },
    past: {
      surface: 'oklch(94% 0.01 260)',
      border: 'oklch(70% 0.02 260)',
      text: 'oklch(50% 0.02 260)',
    },
  },
  system: {
    action: {
      dark: 'oklch(78% 0.12 75)',
      light: 'oklch(45% 0.14 75)',
      hover: 'oklch(82% 0.14 75)',
      muted: 'oklch(78% 0.12 75 / 0.15)',
    },
    danger: {
      dark: 'oklch(62% 0.20 25)',
      light: 'oklch(42% 0.22 25)',
    },
    info: {
      dark: 'oklch(68% 0.15 255)',
      light: 'oklch(45% 0.18 255)',
    },
  },
} as const;

export type SemanticStatus = 'urgent' | 'overdue' | 'pending' | 'upcoming' | 'confirmed' | 'past';

export function resolveEventStatus(evento: { f_ev: string | null; saldo: number }): SemanticStatus {
  if (!evento.f_ev) return 'pending';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(evento.f_ev);
  eventDate.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 1) return 'urgent';
  if (daysDiff < 0 && evento.saldo > 0) return 'overdue';
  if (evento.saldo > 0) return 'pending';
  if (daysDiff <= 7) return 'upcoming';
  if (daysDiff < 0) return 'past';
  return 'confirmed';
}
