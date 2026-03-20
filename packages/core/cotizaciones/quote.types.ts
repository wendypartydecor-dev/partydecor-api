export type ItemStockStatus = 'available' | 'low' | 'out_of_stock' | 'on_demand';

export type ItemDiscountType = 'none' | 'percentage' | 'fixed' | 'package';

export interface QuoteItem {
  id: string;
  catalogItemId: string | null;
  name: string;
  nameOriginal: string;
  category: string;
  description?: string;
  unitPrice: number;
  discountType: ItemDiscountType;
  discountValue: number;
  unitPriceEffective: number;
  quantity: number;
  unit: string;
  stockStatus: ItemStockStatus;
  stockQuantityAvailable: number;
  lineTotal: number;
  lineTotalOriginal: number;
  sortOrder: number;
  notes?: string;
  isNew?: boolean;
  requiresApproval?: boolean;
}

export type QuoteStatus = 'draft' | 'emitted' | 'accepted' | 'rejected' | 'superseded';

export interface Quote {
  id: string;
  eventoId: string;
  version: number;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  anticipo: number;
  saldo: number;
  notes: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface QuoteCanvasState {
  quoteId: string | null;
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
  originalIndex: number;
  currentIndex: number;
}

export interface QuoteTotals {
  subtotal: number;
  discountTotal: number;
  total: number;
  itemCount: number;
  hasOutOfStock: boolean;
  hasDiscounts: boolean;
  savingsPercentage: number;
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

export function createEmptyQuoteItem(overrides?: Partial<QuoteItem>): QuoteItem {
  return {
    id: crypto.randomUUID(),
    catalogItemId: null,
    name: '',
    nameOriginal: '',
    category: '',
    unitPrice: 0,
    discountType: 'none',
    discountValue: 0,
    unitPriceEffective: 0,
    quantity: 1,
    unit: 'pz',
    stockStatus: 'available',
    stockQuantityAvailable: 0,
    lineTotal: 0,
    lineTotalOriginal: 0,
    sortOrder: 0,
    ...overrides,
  };
}

export function calculateItemTotals(item: QuoteItem): Pick<QuoteItem, 'unitPriceEffective' | 'lineTotal' | 'lineTotalOriginal'> {
  const lineTotalOriginal = item.unitPrice * item.quantity;
  
  let unitPriceEffective = item.unitPrice;
  if (item.discountType === 'percentage') {
    unitPriceEffective = item.unitPrice * (1 - item.discountValue / 100);
  } else if (item.discountType === 'fixed') {
    unitPriceEffective = Math.max(0, item.unitPrice - item.discountValue);
  } else if (item.discountType === 'package') {
    unitPriceEffective = item.discountValue;
  }
  
  const lineTotal = unitPriceEffective * item.quantity;
  
  return {
    unitPriceEffective,
    lineTotal,
    lineTotalOriginal,
  };
}

export function createQuoteItemFromCatalog(catalogItem: CatalogItemPreview, quantity: number = 1): QuoteItem {
  const baseItem = createEmptyQuoteItem({
    catalogItemId: catalogItem.id,
    name: catalogItem.nombre,
    nameOriginal: catalogItem.nombre,
    category: catalogItem.categoria,
    unitPrice: catalogItem.precio,
    unit: catalogItem.unidad || 'pz',
    stockQuantityAvailable: catalogItem.stock ?? 0,
    isNew: true,
  });
  
  if (catalogItem.stock === 0) {
    baseItem.stockStatus = 'out_of_stock';
  } else if (catalogItem.stock !== undefined && catalogItem.stock <= quantity) {
    baseItem.stockStatus = 'low';
  }
  
  return {
    ...baseItem,
    ...calculateItemTotals(baseItem),
  };
}

export interface CatalogItemPreview {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  unidad?: string;
  stock?: number;
  permite_cambio: boolean;
}
