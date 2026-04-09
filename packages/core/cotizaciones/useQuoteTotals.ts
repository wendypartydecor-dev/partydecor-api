import type { QuoteItem, QuoteTotals } from './quote.types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function computeQuoteTotals(items: QuoteItem[]): QuoteTotals {
  let subtotal = 0;
  let discount = 0;
  let iva = 0;
  let isr = 0;

  for (const item of items) {
    const lineTotalOriginal = item.unitPrice * item.quantity;
    subtotal += lineTotalOriginal;

    let discountAmount = 0;
    switch (item.discountType) {
      case 'percentage':
        discountAmount = lineTotalOriginal * (item.discountValue / 100);
        break;
      case 'fixed':
        discountAmount = item.discountValue * item.quantity;
        break;
      case 'package':
        discountAmount = lineTotalOriginal - item.lineTotal;
        break;
    }
    discount += discountAmount;

    const lineTotal = lineTotalOriginal - discountAmount;

    if (item.incluyeIva) {
      iva += lineTotal * 0.16;
    }
    
    if (item.incluyeIsr) {
      isr += lineTotal * 0.0125;
    }
  }

  const total = subtotal - discount + iva - isr;

  return {
    subtotal,
    discount,
    iva,
    isr,
    total,
    itemCount: items.length,
  };
}
