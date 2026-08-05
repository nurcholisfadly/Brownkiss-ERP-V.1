// Shared formatting utilities for Brownkiss ERP

/**
 * Formats quantity and unit into human-readable strings (e.g. 1500 Gram -> 1.5 KG)
 */
export function humanFormat(qty: number, unit: string): string {
  const normalizedUnit = (unit || '').trim().toLowerCase();
  if ((normalizedUnit === 'gram' || normalizedUnit === 'g') && qty >= 1000) {
    return `${qty / 1000} KG`;
  }
  if ((normalizedUnit === 'ml' || normalizedUnit === 'mili') && qty >= 1000) {
    return `${qty / 1000} Liter`;
  }
  return `${qty} ${unit}`;
}

/**
 * Returns formatted price and unit label for ingredient display (e.g. Rp 16.000 / KG instead of Rp 16 / Gram)
 */
export function getDisplayPriceUnit(costPerUnit: number, unit: string) {
  const norm = (unit || '').trim().toLowerCase();
  if (norm === 'gram' || norm === 'g') {
    return {
      priceFormatted: `Rp ${(costPerUnit * 1000).toLocaleString('id-ID')}`,
      unitLabel: 'KG',
      unitPriceNum: costPerUnit * 1000,
    };
  }
  if (norm === 'ml' || norm === 'mili') {
    return {
      priceFormatted: `Rp ${(costPerUnit * 1000).toLocaleString('id-ID')}`,
      unitLabel: 'Liter',
      unitPriceNum: costPerUnit * 1000,
    };
  }
  return {
    priceFormatted: `Rp ${costPerUnit.toLocaleString('id-ID')}`,
    unitLabel: unit,
    unitPriceNum: costPerUnit,
  };
}

/**
 * Format currency in IDR (Rp)
 */
export function formatRupiah(amount: number): string {
  return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
}
