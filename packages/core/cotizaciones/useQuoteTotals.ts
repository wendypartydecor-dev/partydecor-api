import type { QuoteItem, QuoteTotals } from './quote.types';

export function computeQuoteTotals(items: QuoteItem[]): QuoteTotals {
  const validItems = items.filter(i => i.stockStatus !== 'out_of_stock');
  
  const subtotal = items.reduce((sum, item) => sum + item.lineTotalOriginal, 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.lineTotalOriginal - item.lineTotal), 0);
  const total = subtotal - discountTotal;
  
  const hasOutOfStock = items.some(item => item.stockStatus === 'out_of_stock');
  const hasDiscounts = discountTotal > 0;
  const savingsPercentage = subtotal > 0 ? Math.round((discountTotal / subtotal) * 100) : 0;
  
  return {
    subtotal,
    discountTotal,
    total,
    itemCount: items.length,
    hasOutOfStock,
    hasDiscounts,
    savingsPercentage,
  };
}

export function formatCurrency(amount: number, locale: string = 'es-MX', currency: string = 'MXN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
