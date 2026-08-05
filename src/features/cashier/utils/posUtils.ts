import { ErpSettings } from '../../../types';

export interface SaleSummary {
  rawSubtotal: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  serviceFee: number;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
}

export function calculateSaleSummary(
  items: { qty: number; price: number }[],
  settings?: ErpSettings,
  shippingCostInput: number = 0,
  discountType: 'none' | 'percent' | 'nominal' | 'promo' = 'none',
  discountValue: number = 0,
  promoType: string = ''
): SaleSummary {
  const rawSubtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    const validPercent = Math.min(100, Math.max(0, discountValue));
    discountAmount = Math.round((rawSubtotal * validPercent) / 100);
  } else if (discountType === 'nominal') {
    discountAmount = Math.min(rawSubtotal, Math.max(0, discountValue));
  } else if (discountType === 'promo') {
    if (promoType === 'BUY6_GET1') {
      const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
      const freeCount = Math.floor(totalQty / 6);
      if (freeCount > 0 && items.length > 0) {
        const prices = items.flatMap((i) => Array(i.qty).fill(i.price)).sort((a, b) => a - b);
        discountAmount = prices.slice(0, freeCount).reduce((a, b) => a + b, 0);
      }
    } else if (promoType === 'BUY12_GET2') {
      const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
      const freeCount = Math.floor(totalQty / 12) * 2;
      if (freeCount > 0 && items.length > 0) {
        const prices = items.flatMap((i) => Array(i.qty).fill(i.price)).sort((a, b) => a - b);
        discountAmount = prices.slice(0, freeCount).reduce((a, b) => a + b, 0);
      }
    } else if (promoType === 'BUNDLE_DOZEN_80K') {
      const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
      if (totalQty >= 12) {
        discountAmount = Math.max(0, discountValue || 15000); // flat bundle discount
      }
    } else {
      discountAmount = Math.min(rawSubtotal, Math.max(0, discountValue));
    }
  }

  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);

  const serviceFee =
    settings && settings.servicePercent > 0
      ? Math.round((subtotalAfterDiscount * settings.servicePercent) / 100)
      : 0;

  const taxableAmount = subtotalAfterDiscount + serviceFee;
  const taxAmount =
    settings && settings.taxPercent > 0
      ? Math.round((taxableAmount * settings.taxPercent) / 100)
      : 0;

  const shippingCost = Math.max(0, shippingCostInput);
  const grandTotal = subtotalAfterDiscount + serviceFee + taxAmount + shippingCost;

  return {
    rawSubtotal,
    discountAmount,
    subtotalAfterDiscount,
    serviceFee,
    taxAmount,
    shippingCost,
    grandTotal,
  };
}
