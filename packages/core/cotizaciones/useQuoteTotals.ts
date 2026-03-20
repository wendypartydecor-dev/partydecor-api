import type { QuoteItem, QuoteTotals } from './quote.types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function computeQuoteTotals(items: QuoteItem[]): QuoteTotals {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotalOriginal ?? item.lineTotal, 0);
  const discount = items.reduce((sum, item) => {
    if (item.discountType === 'percentage') {
      return sum + (item.lineTotalOriginal ?? item.lineTotal) * (item.discountValue / 100);
    }
    if (item.discountType === 'fixed') {
      return sum + item.discountValue * item.quantity;
    }
    return sum;
  }, 0);
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * 0.16;
  const total = taxableAmount + tax;

  return {
    subtotal,
    discount,
    tax,
    total,
    itemCount: items.length,
  };
}
