import type { ComponentType, ReactNode } from 'react';
import type { z } from 'zod';

export type SlotType =
  | 'sidebar-nav-item'
  | 'sidebar-section'
  | 'evento-space-tab'
  | 'evento-space-action'
  | 'evento-left-panel-section'
  | 'cliente-space-tab'
  | 'dashboard-widget'
  | 'command-palette-items'
  | 'settings-section';

export type AureaPermission =
  | 'eventos:read'
  | 'eventos:write'
  | 'clientes:read'
  | 'clientes:write'
  | 'cotizaciones:read'
  | 'cotizaciones:write'
  | 'storage:own'
  | 'storage:shared'
  | 'settings:read'
  | 'admin';

export type AureaEventType =
  | 'evento.created'
  | 'evento.updated'
  | 'evento.deleted'
  | 'cotizacion.created'
  | 'cotizacion.updated'
  | 'cliente.created'
  | 'cliente.updated'
  | 'payment.registered';

export interface PluginContext {
  tenantId: string;
  userId: string;
  permissions: AureaPermission[];
  storage: PluginStorage;
  coreApi: PluginCoreAPI;
}

export interface PluginStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<Array<{ key: string; value: unknown }>>;
}

export interface PluginCoreAPI {
  eventos: {
    getById(id: string): Promise<Evento | null>;
    list(filters?: EventoFilters): Promise<Evento[]>;
    update(id: string, data: Partial<Evento>): Promise<Evento>;
  };
  clientes: {
    getById(id: string): Promise<Cliente | null>;
    list(filters?: ClienteFilters): Promise<Cliente[]>;
    update(id: string, data: Partial<Cliente>): Promise<Cliente>;
  };
  cotizaciones: {
    create(data: CreateCotizacionInput): Promise<Cotizacion>;
    getByEventoId(eventoId: string): Promise<CotizacionItem[]>;
    update(id: string, data: Partial<CotizacionItem>): Promise<CotizacionItem>;
    delete(id: string): Promise<void>;
  };
}

export interface Evento {
  id: string;
  tenantId: string;
  f_reg: string;
  f_ev: string | null;
  id_cli: string | null;
  cli: string;
  tipo: string;
  dir: string;
  estado: string;
  total: number;
  anticipo: number;
  saldo: number;
  e_pago: string;
  obs: string;
  pdf_url: string;
  iva: string;
  isr: string;
  created_at: string;
  updated_at: string;
}

export interface EventoFilters {
  estado?: string;
  hasPendingBalance?: boolean;
  upcoming?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface Cliente {
  id: string;
  tenantId: string;
  nombre: string;
  tel1: string;
  tel2: string;
  tipo: string;
  fuente: string;
  obs: string;
  activo: boolean;
  dir: string;
  created_at: string;
  updated_at: string;
}

export interface ClienteFilters {
  tipo?: string;
  activo?: boolean;
  search?: string;
}

export interface Cotizacion {
  id: string;
  eventoId: string;
  tenantId: string;
}

export interface CotizacionItem {
  id: string;
  id_ev: string;
  id_item: string;
  nombre: string;
  tipo: string;
  cantidad: number;
  precio: number;
  costo: number;
  total: number;
  proveedor: string;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCotizacionInput {
  eventoId: string;
  items: Array<{
    id_item: string;
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
}

export interface SidebarNavItemProps {
  isActive: boolean;
  isCollapsed: boolean;
}

export interface EventoTabProps {
  eventoId: string;
  canvasMode: CanvasMode;
  coreApi: PluginCoreAPI;
  storage: PluginStorage;
}

export interface EventoTabBadgeProps {
  eventoId: string;
}

export type CanvasMode = 'view' | 'edit' | 'pdf-preview' | 'focus';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: (ctx: PluginContext) => void | Promise<void>;
  children?: () => CommandItem[];
  keywords?: string[];
}

export interface SlotCondition {
  permission?: AureaPermission;
  minPlan?: 'starter' | 'pro' | 'enterprise';
  custom?: (ctx: PluginContext) => boolean;
}

export interface SidebarNavItemSlot {
  type: 'sidebar-nav-item';
  component: ComponentType<SidebarNavItemProps>;
  order: number;
  href?: string;
  condition?: SlotCondition;
}

export interface EventoSpaceTabSlot {
  type: 'evento-space-tab';
  tabId: string;
  label: string;
  icon: string;
  component: ComponentType<EventoTabProps>;
  order: number;
  badge?: ComponentType<EventoTabBadgeProps>;
  condition?: SlotCondition;
}

export interface CommandPaletteItemsSlot {
  type: 'command-palette-items';
  resolver: (query: string, ctx: PluginContext) => CommandItem[] | Promise<CommandItem[]>;
}

export interface AureaPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly aureaVersion: string;
  readonly permissions: AureaPermission[];
  readonly slots: ReadonlyArray<SidebarNavItemSlot | EventoSpaceTabSlot | CommandPaletteItemsSlot>;
  readonly events?: {
    subscribe?: AureaEventType[];
    emit?: AureaEventType[];
  };
  readonly settingsSchema?: z.ZodObject<z.ZodRawShape>;
  onInstall?: (ctx: PluginContext) => Promise<void>;
  onUninstall?: (ctx: PluginContext) => Promise<void>;
  onTenantActivate?: (ctx: PluginContext) => Promise<void>;
}
