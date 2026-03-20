export interface TenantSummary {
  id: string;
  nombre: string;
  slug: string;
  ultimaSesion: string | null;
}

export type AuthFlowStep = 
  | 'tenant_selection'
  | 'tenant_confirming'
  | 'login_method'
  | 'pin_entry'
  | 'password_entry'
  | 'loading'
  | 'workspace_redirect'
  | 'error';

export interface AuthFlowState {
  step: AuthFlowStep;
  tenants: TenantSummary[];
  selectedTenant: TenantSummary | null;
  userId: string | null;
  error: string | null;
}

export interface LoginCredentials {
  tenantId: string;
  method: 'pin' | 'password';
  pin?: string;
  password?: string;
}
