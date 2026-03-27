export interface SpinnerAureaProps {
  size?: 20 | 48 | 64;
  showPulse?: boolean;
}

export interface StepIndicatorProps {
  total: 3;
  current: 0 | 1 | 2;
}

export type TransitionPhase =
  | 'verifying'
  | 'loading_tenants'
  | 'ready'
  | 'error';

export interface AuthTransitionProps {
  phase: TransitionPhase;
  userDisplayName?: string;
  userAvatarInitials?: string;
  messageDurationMs?: number;
  onReadyToMount?: () => void;
}

export const TRANSITION_STEP: Record<TransitionPhase, 0 | 1 | 2> = {
  verifying:       1,
  loading_tenants: 2,
  ready:           2,
  error:           1,
} as const;

export const TRANSITION_MESSAGES: Record<
  'verifying' | 'loading_tenants',
  Array<{ title: string; sub: string }>
> = {
  verifying: [
    { title: 'Verificando identidad', sub: 'Comprobando acceso' },
    { title: 'Cargando empresas', sub: 'Recuperando tus accesos' },
    { title: 'Casi listo', sub: 'Preparando tu espacio' },
  ],
  loading_tenants: [
    { title: 'Cargando empresas', sub: 'Un momento' },
  ],
} as const;
