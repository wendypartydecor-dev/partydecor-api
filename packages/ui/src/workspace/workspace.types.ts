export { STATUS_COLORS, resolveEventStatus, formatCurrency, formatDate, roundCurrency } from '../utils/currency';

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
