export interface QuoteItem {
  id: string;
  catalogItemId: string | null;
  name: string;
  nameOriginal: string | null;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  lineTotalOriginal?: number;
  discountType: ItemDiscountType;
  discountValue: number;
  stockStatus: ItemStockStatus;
  stockQuantityAvailable: number;
  description: string;
  notes: string;
  sortOrder: number;
  incluyeIva: boolean;
  incluyeIsr: boolean;
  isNew?: boolean;
}

export type ItemStockStatus = 'available' | 'low' | 'out_of_stock' | 'on_demand';
export type ItemDiscountType = 'none' | 'percentage' | 'fixed' | 'package';

export interface Quote {
  id: string;
  eventoId: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  iva: number;
  isr: number;
  total: number;
  itemCount: number;
}

export interface QuoteCanvasState {
  quoteId: string | null;
  eventoId: string | null;
  version: number;
  items: QuoteItem[];
  isDirty: boolean;
  isSaving: boolean;
  focusMode: boolean;
  activeItemId: string | null;
  dragState: DragState | null;
  previewMode: 'canvas' | 'pdf';
}

export interface DragState {
  itemId: string;
  fromIndex: number;
  toIndex: number;
  position: { x: number; y: number };
}

export type QuoteCanvasAction =
  | { type: 'ADD_ITEM'; item: QuoteItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
  | { type: 'UPDATE_PRICE'; itemId: string; unitPrice: number }
  | { type: 'UPDATE_DISCOUNT'; itemId: string; discountType: ItemDiscountType; discountValue: number }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'SET_FOCUS_MODE'; active: boolean }
  | { type: 'SET_PREVIEW_MODE'; mode: 'canvas' | 'pdf' }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_ACTIVE_ITEM'; itemId: string | null }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_SAVING'; isSaving: boolean }
  | { type: 'MARK_SAVED'; quoteId: string; version: number }
  | { type: 'LOAD_QUOTE'; quote: Quote }
  | { type: 'SET_DRAG_STATE'; state: DragState | null }
  | { type: 'REMOVE_NEW_FLAG'; itemId: string };

export function calculateItemTotals(item: QuoteItem): { lineTotal: number; lineTotalOriginal: number; discountAmount: number } {
  const lineTotalOriginal = item.unitPrice * item.quantity;
  
  let discountAmount = 0;
  switch (item.discountType) {
    case 'percentage':
      discountAmount = lineTotalOriginal * (item.discountValue / 100);
      break;
    case 'fixed':
      discountAmount = item.discountValue;
      break;
    case 'package':
      discountAmount = lineTotalOriginal - item.lineTotal;
      break;
  }
  
  const lineTotal = lineTotalOriginal - discountAmount;
  
  return {
    lineTotal,
    lineTotalOriginal,
    discountAmount,
  };
}

export function createQuoteItemFromCatalog(
  catalogItem: { id: string; nombre: string; categoria: string; precio: number; unidad?: string; permite_cambio: boolean },
  quantity: number = 1
): QuoteItem {
  return {
    id: crypto.randomUUID(),
    catalogItemId: catalogItem.id,
    name: catalogItem.nombre,
    nameOriginal: catalogItem.nombre,
    category: catalogItem.categoria,
    quantity,
    unit: catalogItem.unidad || 'pz',
    unitPrice: catalogItem.precio,
    lineTotal: catalogItem.precio * quantity,
    lineTotalOriginal: catalogItem.precio * quantity,
    discountType: 'none',
    discountValue: 0,
    stockStatus: 'available',
    stockQuantityAvailable: 0,
    description: '',
    notes: '',
    sortOrder: 0,
    incluyeIva: true,
    incluyeIsr: false,
    isNew: true,
  };
}
