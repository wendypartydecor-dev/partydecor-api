export type LoginMode = 'password' | 'pin';

export type LoginError =
  | { type: 'invalid_credentials'; message: string }
  | { type: 'account_locked'; unlocksAt: string }
  | { type: 'network'; message: string }
  | { type: 'rate_limited'; retryAfterSeconds: number };

export interface LoginFormState {
  mode: LoginMode;
  email: string;
  password: string;
  pin: string;
  isSubmitting: boolean;
  error: LoginError | null;
  attempts: number;
}

export interface LoginResponse {
  tokenTemp: string;
  token?: string;
  user: AuthUser;
  tenants: TenantSummary[] | null;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarInitials: string;
  globalRole: 'super_admin' | 'admin' | 'user';
}

export interface TenantSummary {
  id: string;
  nombre: string;
  nombreCorto: string;
  logoUrl: string | null;
  iniciales: string;
  accentColor: string;
  rolEmpresa: 'admin' | 'empleado' | 'solo_lectura';
  meta: TenantMeta;
}

export interface TenantMeta {
  lastAccessAt: string | null;
  upcomingEventCount: number;
  isLastUsed: boolean;
}

export type TenantSelectorState =
  | { status: 'loading' }
  | { status: 'ready'; tenants: TenantSummary[]; user: AuthUser }
  | { status: 'selecting'; tenant: TenantSummary }
  | { status: 'error'; error: string };

export type AuthFlowState =
  | { step: 'login' }
  | { step: 'tenant_select'; user: AuthUser; tenants: TenantSummary[]; tokenTemp: string }
  | { step: 'workspace_redirect'; tenantId: string; token: string };

export type PinState =
  | { status: 'idle'; value: string }
  | { status: 'validating' }
  | { status: 'error'; message: string }
  | { status: 'success' };
