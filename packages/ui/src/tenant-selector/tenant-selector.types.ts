export type TenantRole = 'admin' | 'empleado' | 'solo_lectura';

export interface TenantSummary {
  id: string;
  nombre: string;
  iniciales: string;
  logoUrl: string | null;
  accentColor: string;
  rolEmpresa: TenantRole;
  isLastUsed: boolean;
  meta: {
    lastAccessAt: string | null;
    upcomingEventCount: number;
  };
}

export interface AuthUser {
  id: string;
  displayName: string;
  avatarInitials: string;
}

export type TenantSelectorStatus =
  | 'loading'
  | 'ready'
  | 'selecting'
  | 'error';

export interface TenantSelectorState {
  status: TenantSelectorStatus;
  tenants: TenantSummary[];
  user: AuthUser | null;
  selectingId: string | null;
  error: string | null;
}

export interface TenantSelectorProps {
  state: TenantSelectorState;
  onSelect: (tenant: TenantSummary) => void;
  onLogout: () => void;
}

export interface TenantCardProps {
  tenant: TenantSummary;
  isSelecting: boolean;
  isAnySelecting: boolean;
  onClick: () => void;
}

export interface TenantSkeletonProps {
  count?: number;
}
