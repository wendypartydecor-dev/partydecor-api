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
  descuento_pct: number;
  categoria_tag: string;
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
  status: string;
  subtotal: number;
  discount_total: number;
  total: number;
  anticipo: number;
  saldo: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItemApiResponse {
  id: string;
  cotizacion_id: string;
  catalog_item_id: string | null;
  name: string;
  nombre_snapshot: string;
  category: string;
  description: string;
  unit: string;
  unit_price: number;
  discount_type: string;
  discount_value: number;
  unit_price_effective: number;
  quantity: number;
  line_total_original: number;
  line_total: number;
  incluye_iva: boolean;
  incluye_isr: boolean;
  sort_order: number;
  notes: string;
}

export function mapApiItemToQuoteItem(apiItem: QuoteItemApiResponse): QuoteItem {
  return {
    id: apiItem.id,
    cotizacion_id: apiItem.cotizacion_id,
    catalogo_id: apiItem.catalog_item_id,
    nombre: apiItem.name,
    nombre_snapshot: apiItem.nombre_snapshot || apiItem.name,
    cantidad: apiItem.quantity,
    precio_unitario: apiItem.unit_price,
    descuento_pct: apiItem.discount_type === 'percentage' ? apiItem.discount_value : 
                  apiItem.discount_type === 'fixed' ? (apiItem.discount_value / apiItem.unit_price) * 100 : 0,
    categoria_tag: apiItem.category,
    notas: apiItem.notes || '',
    sort_order: apiItem.sort_order,
    incluye_iva: apiItem.incluye_iva ?? true,
    incluye_isr: apiItem.incluye_isr ?? true,
  };
}

export function calculateLineaTotal(item: QuoteItem): {
  precioUnitarioEfectivo: number;
  lineaTotalOriginal: number;
  lineaTotalEfectiva: number;
  descuentoMonto: number;
} {
  const precioOriginal = roundCurrency(item.precio_unitario);
  const precioUnitarioEfectivo = roundCurrency(precioOriginal * (1 - item.descuento_pct / 100));
  const lineaTotalOriginal = roundCurrency(precioOriginal * item.cantidad);
  const lineaTotalEfectiva = roundCurrency(precioUnitarioEfectivo * item.cantidad);
  const descuentoMonto = roundCurrency(lineaTotalOriginal - lineaTotalEfectiva);
  
  return { precioUnitarioEfectivo, lineaTotalOriginal, lineaTotalEfectiva, descuentoMonto };
}

export function calculateQuoteTotals(items: QuoteItem[], impuestos: TaxConfig[]): CotizacionComputed {
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
    descuento_pct: 0,
    categoria_tag: catalogItem.categoria,
    notas: '',
    sort_order: 0,
    incluye_iva: true,
    incluye_isr: true,
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
    descuento_pct: 0,
    categoria_tag: 'General',
    notas: '',
    sort_order: 0,
    incluye_iva: true,
    incluye_isr: true,
  };
}

export function quoteItemToApiFormat(item: QuoteItem): Record<string, unknown> {
  return {
    catalog_item_id: item.catalogo_id,
    name: item.nombre,
    nombre_snapshot: item.nombre_snapshot,
    category: item.categoria_tag,
    unit: 'pz',
    unit_price: item.precio_unitario,
    quantity: item.cantidad,
    incluye_iva: item.incluye_iva,
    incluye_isr: item.incluye_isr,
    sort_order: item.sort_order,
    notes: item.notas,
  };
}
