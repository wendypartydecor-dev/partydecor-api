export interface QuoteItem {
  id: string;
  catalogItemId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  lineTotalOriginal?: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  stockStatus: ItemStockStatus;
  isNew?: boolean;
}

export type ItemStockStatus = 'available' | 'low' | 'out_of_stock' | 'on_demand';

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
  tax: number;
  total: number;
  itemCount: number;
}
