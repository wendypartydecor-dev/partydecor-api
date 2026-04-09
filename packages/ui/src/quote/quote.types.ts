import { roundCurrency, formatCurrency } from '../utils/currency';

export { roundCurrency, formatCurrency };

export interface QuoteItem {
  id: string;
  cotizacion_id: string | null;
  catalogo_id: string | null;
  nombre: string;
  nombre_snapshot: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal_linea: number;
  categoria_tag: string;
  unidad: string;
  notas: string;
  sort_order: number;
  incluye_iva: boolean;
  incluye_isr: boolean;
}

export interface TaxConfig {
  key: string;
  nombre: string;
  tasa: number;
  activo: boolean;
  es_retencion: boolean;
}

export interface Cotizacion {
  id: string;
  evento_id: string;
  tenant_id: string;
  folio: string | null;
  moneda: 'MXN' | 'USD';
  tipo_cambio: number;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  notas: string;
  items: QuoteItem[];
  impuestos: TaxConfig[];
  subtotal: number;
  total: number;
  anticipo: number;
  saldo: number;
  creado_en: string;
  actualizado_en: string;
}

export interface CotizacionComputed {
  subtotal_bruto: number;
  total_descuentos: number;
  subtotal_neto: number;
  total_iva: number;
  total_isr: number;
  total_final: number;
}

export interface CatalogItem {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_sugerido: number;
  categoria: string;
  unidad: string;
  icono: string;
}

export interface CotizacionApiResponse {
  id: string;
  evento_id: string;
  tenant_id: string;
  estado: string;
  subtotal: number;
  discount_total: number;
  total: number;
  anticipo: number;
  saldo: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LineaCotizacionApiResponse {
  id: string;
  cotizacion_id: string;
  catalogo_id: string | null;
  nombre_personalizado: string;
  nombre_snapshot: string | null;
  precio_unitario_aplicado: number;
  descuento: number;
  subtotal_linea: number;
  incluye_iva: boolean;
  incluye_isr: boolean;
  cantidad: number;
  categoria: string;
  unidad: string;
  notas_item: string;
  sort_order: number;
}

export function mapApiItemToQuoteItem(apiItem: LineaCotizacionApiResponse): QuoteItem {
  return {
    id: apiItem.id,
    cotizacion_id: apiItem.cotizacion_id,
    catalogo_id: apiItem.catalogo_id,
    nombre: apiItem.nombre_personalizado,
    nombre_snapshot: apiItem.nombre_snapshot || apiItem.nombre_personalizado,
    cantidad: apiItem.cantidad,
    precio_unitario: apiItem.precio_unitario_aplicado,
    descuento: apiItem.descuento,
    subtotal_linea: apiItem.subtotal_linea,
    categoria_tag: apiItem.categoria,
    unidad: apiItem.unidad || 'pz',
    notas: apiItem.notas_item || '',
    sort_order: apiItem.sort_order,
    incluye_iva: apiItem.incluye_iva ?? true,
    incluye_isr: apiItem.incluye_isr ?? false,
  };
}

export function calculateLineaTotal(item: QuoteItem): {
  precioUnitarioEfectivo: number;
  lineaTotalOriginal: number;
  lineaTotalEfectiva: number;
  descuentoMonto: number;
} {
  const precioOriginal = roundCurrency(item.precio_unitario);
  const descuentoMonto = roundCurrency(item.descuento);
  const lineaTotalOriginal = roundCurrency(precioOriginal * item.cantidad);
  const lineaTotalEfectiva = roundCurrency(lineaTotalOriginal - descuentoMonto);
  const precioUnitarioEfectivo = item.cantidad > 0 ? roundCurrency(lineaTotalEfectiva / item.cantidad) : precioOriginal;
  
  return { precioUnitarioEfectivo, lineaTotalOriginal, lineaTotalEfectiva, descuentoMonto };
}

export function calculateQuoteTotals(items: QuoteItem[], _impuestos: TaxConfig[]): CotizacionComputed {
  let subtotal_bruto = 0;
  let total_descuentos = 0;
  let total_iva = 0;
  let total_isr = 0;
  
  for (const item of items) {
    const { lineaTotalOriginal, descuentoMonto, lineaTotalEfectiva } = calculateLineaTotal(item);
    subtotal_bruto += lineaTotalOriginal;
    total_descuentos += descuentoMonto;
    
    if (item.incluye_iva) {
      total_iva += lineaTotalEfectiva * 0.16;
    }
    if (item.incluye_isr) {
      total_isr += lineaTotalEfectiva * 0.0125;
    }
  }
  
  const subtotal_neto = roundCurrency(subtotal_bruto - total_descuentos);
  
  const total_final = roundCurrency(subtotal_neto + total_iva - total_isr);
  
  return {
    subtotal_bruto: roundCurrency(subtotal_bruto),
    total_descuentos: roundCurrency(total_descuentos),
    subtotal_neto,
    total_iva: roundCurrency(total_iva),
    total_isr: roundCurrency(total_isr),
    total_final,
  };
}

export function createQuoteItemSnapshot(catalogItem: CatalogItem): QuoteItem {
  return {
    id: crypto.randomUUID(),
    cotizacion_id: null,
    catalogo_id: catalogItem.id,
    nombre: catalogItem.nombre,
    nombre_snapshot: catalogItem.nombre,
    cantidad: 1,
    precio_unitario: roundCurrency(catalogItem.precio_sugerido),
    descuento: 0,
    subtotal_linea: roundCurrency(catalogItem.precio_sugerido),
    categoria_tag: catalogItem.categoria,
    unidad: catalogItem.unidad || 'pz',
    notas: '',
    sort_order: 0,
    incluye_iva: true,
    incluye_isr: false,
  };
}

export function createLocalQuoteItem(name: string, precio: number): QuoteItem {
  return {
    id: crypto.randomUUID(),
    cotizacion_id: null,
    catalogo_id: null,
    nombre: name,
    nombre_snapshot: name,
    cantidad: 1,
    precio_unitario: roundCurrency(precio),
    descuento: 0,
    subtotal_linea: roundCurrency(precio),
    categoria_tag: 'General',
    unidad: 'pz',
    notas: '',
    sort_order: 0,
    incluye_iva: true,
    incluye_isr: false,
  };
}

export function quoteItemToApiFormat(item: QuoteItem): Record<string, unknown> {
  return {
    catalogo_id: item.catalogo_id,
    nombre_personalizado: item.nombre,
    nombre_snapshot: item.nombre_snapshot,
    precio_unitario_aplicado: item.precio_unitario,
    descuento: item.descuento,
    cantidad: item.cantidad,
    categoria: item.categoria_tag,
    unidad: item.unidad,
    incluye_iva: item.incluye_iva,
    incluye_isr: item.incluye_isr,
    sort_order: item.sort_order,
    notas_item: item.notas,
  };
}
