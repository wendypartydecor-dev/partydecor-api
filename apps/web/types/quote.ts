export interface QuoteItem {
  id: string;
  cotizacion_id: string | null;
  catalogo_id: string | null;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  categoria_tag: string;
  notas: string;
  sort_order: number;
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
  creado_en: string;
  actualizado_en: string;
}

export interface CotizacionComputed {
  subtotal_bruto: number;
  total_descuentos: number;
  subtotal_neto: number;
  total_impuestos: number;
  total_retenciones: number;
  total_final: number;
}

export interface CatalogItem {
  id: string;
  nombre: string;
  precio_sugerido: number;
  categoria: string;
  unidad: string;
  icono: string;
}

export interface QuoteSnapshot {
  cotizacion: Cotizacion;
  computed: CotizacionComputed;
}

export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
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
  
  for (const item of items) {
    const { lineaTotalOriginal, lineaTotalEfectiva, descuentoMonto } = calculateLineaTotal(item);
    subtotal_bruto += lineaTotalOriginal;
    total_descuentos += descuentoMonto;
  }
  
  const subtotal_neto = roundCurrency(subtotal_bruto - total_descuentos);
  
  let total_impuestos = 0;
  let total_retenciones = 0;
  
  for (const tax of impuestos) {
    if (!tax.activo) continue;
    
    const monto = roundCurrency(subtotal_neto * (tax.tasa / 100));
    
    if (tax.es_retencion) {
      total_retenciones += monto;
    } else {
      total_impuestos += monto;
    }
  }
  
  const total_final = roundCurrency(subtotal_neto + total_impuestos - total_retenciones);
  
  return {
    subtotal_bruto: roundCurrency(subtotal_bruto),
    total_descuentos: roundCurrency(total_descuentos),
    subtotal_neto,
    total_impuestos: roundCurrency(total_impuestos),
    total_retenciones: roundCurrency(total_retenciones),
    total_final,
  };
}

export function createQuoteItemSnapshot(catalogItem: CatalogItem): QuoteItem {
  return {
    id: crypto.randomUUID(),
    cotizacion_id: null,
    catalogo_id: catalogItem.id,
    nombre: catalogItem.nombre,
    cantidad: 1,
    precio_unitario: roundCurrency(catalogItem.precio_sugerido),
    descuento_pct: 0,
    categoria_tag: catalogItem.categoria,
    notas: '',
    sort_order: 0,
  };
}

export function formatCurrency(amount: number, currency: 'MXN' | 'USD' = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount);
}
