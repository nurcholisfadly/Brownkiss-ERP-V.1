import React from 'react';
import { Recipe, ErpSettings } from '../../../types';
import { calculateSaleSummary } from '../utils/posUtils';
import { Minus, Plus, ShoppingCart, Trash2, Tag, Percent, Truck } from 'lucide-react';

interface CartItem {
  recipe: Recipe;
  qty: number;
}

interface CartPanelProps {
  cart: Record<string, CartItem>;
  donutInventory: Record<string, number>;
  settings?: ErpSettings;
  currencySymbol: string;
  customerName: string;
  shippingCostInput: number;
  discountType: 'none' | 'percent' | 'nominal' | 'promo';
  discountValue: number;
  promoType: string;
  paymentMethod: 'Tunai' | 'QRIS' | 'Split Payment';
  cashAmountInput: string;
  qrisAmountInput: string;
  setCustomerName: (val: string) => void;
  setShippingCostInput: (val: number) => void;
  setDiscountType: (val: 'none' | 'percent' | 'nominal' | 'promo') => void;
  setDiscountValue: (val: number) => void;
  setPromoType: (val: string) => void;
  setPaymentMethod: (val: 'Tunai' | 'QRIS' | 'Split Payment') => void;
  setCashAmountInput: (val: string) => void;
  setQrisAmountInput: (val: string) => void;
  onUpdateQty: (recipeId: string, delta: number) => void;
  onRemoveItem: (recipeId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export default function CartPanel({
  cart,
  donutInventory,
  settings,
  currencySymbol,
  customerName,
  shippingCostInput,
  discountType,
  discountValue,
  promoType,
  paymentMethod,
  cashAmountInput,
  qrisAmountInput,
  setCustomerName,
  setShippingCostInput,
  setDiscountType,
  setDiscountValue,
  setPromoType,
  setPaymentMethod,
  setCashAmountInput,
  setQrisAmountInput,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartPanelProps) {
  const cartItemsList = Object.values(cart);

  const saleItemsForSummary = cartItemsList.map((ci) => ({
    qty: ci.qty,
    price: ci.recipe.price,
  }));

  const summary = calculateSaleSummary(
    saleItemsForSummary,
    settings,
    shippingCostInput,
    discountType,
    discountValue,
    promoType
  );

  return (
    <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <h3 className="font-serif font-bold text-base text-[#2A2420] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#8B3350]" />
            <span>Keranjang Belanja POS</span>
          </h3>
          {cartItemsList.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-red-600 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {/* Customer & Delivery Input */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-[#8F8377] uppercase tracking-wider mb-1">
              Nama Pelanggan
            </label>
            <input
              type="text"
              className="w-full px-2.5 py-1.5 border border-[#E9E2D8] rounded-xl text-xs outline-none focus:border-[#8B3350]"
              placeholder="Pelanggan Umum"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8F8377] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Truck className="w-3 h-3 text-[#8B3350]" /> Ongkir (Rp)
            </label>
            <input
              type="number"
              min="0"
              className="w-full px-2.5 py-1.5 border border-[#E9E2D8] rounded-xl text-xs font-mono outline-none focus:border-[#8B3350]"
              placeholder="0"
              value={shippingCostInput || ''}
              onChange={(e) => setShippingCostInput(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Cart Items List */}
        {cartItemsList.length === 0 ? (
          <div className="py-12 text-center text-[#9A8E80] space-y-2 border border-dashed border-[#E9E2D8] rounded-xl">
            <ShoppingCart className="w-8 h-8 mx-auto opacity-50 text-[#8B3350]" />
            <p className="text-xs font-mono">Keranjang belanja masih kosong.</p>
            <p className="text-[10px] text-[#8F8377]">Klik produk di sebelah kiri untuk menambahkan.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {cartItemsList.map(({ recipe, qty }) => {
              const availableStock = donutInventory[recipe.name] || 0;
              const subtotal = qty * recipe.price;

              return (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between bg-[#FBF7F2] p-2.5 rounded-xl border border-[#E9E2D8] text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-bold text-[#2A2420] truncate block">
                      {recipe.emoji} {recipe.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#8F8377]">
                      {currencySymbol} {recipe.price.toLocaleString('id-ID')} / pcs
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#E9E2D8] rounded-lg bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(recipe.id, -1)}
                        className="px-2 py-1 text-[#5C5248] hover:bg-gray-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono font-bold text-xs">{qty}</span>
                      <button
                        type="button"
                        disabled={qty >= availableStock}
                        onClick={() => onUpdateQty(recipe.id, 1)}
                        className="px-2 py-1 text-[#5C5248] hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-[#8B3350] w-16 text-right">
                      {currencySymbol} {subtotal.toLocaleString('id-ID')}
                    </span>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(recipe.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Discount & Promo Options */}
        {cartItemsList.length > 0 && (
          <div className="p-3 bg-[#FBF7F2] rounded-xl border border-[#E9E2D8] space-y-2">
            <span className="text-[10px] font-bold text-[#8F8377] uppercase tracking-wider block flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#8B3350]" /> Diskon / Promo Khusus
            </span>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="px-2 py-1 border border-[#E9E2D8] rounded-lg text-xs bg-white outline-none cursor-pointer"
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value as any);
                  setDiscountValue(0);
                }}
              >
                <option value="none">Tanpa Diskon</option>
                <option value="percent">Diskon (%)</option>
                <option value="nominal">Diskon Nominal (Rp)</option>
                <option value="promo">🎁 Promo Paket (Beli 6 / Dozen)</option>
              </select>

              {discountType === 'percent' && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="px-2 py-1 border border-[#E9E2D8] rounded-lg text-xs font-mono bg-white outline-none"
                  placeholder="Persen (%)"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                />
              )}

              {discountType === 'nominal' && (
                <input
                  type="number"
                  min="0"
                  className="px-2 py-1 border border-[#E9E2D8] rounded-lg text-xs font-mono bg-white outline-none"
                  placeholder="Nominal (Rp)"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                />
              )}

              {discountType === 'promo' && (
                <select
                  className="px-2 py-1 border border-[#E9E2D8] rounded-lg text-xs bg-white outline-none cursor-pointer"
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value)}
                >
                  <option value="">-- Pilih Promo --</option>
                  <option value="BUY6_GET1">🍩 Beli 6 Gratis 1</option>
                  <option value="BUY12_GET2">📦 Beli 12 Gratis 2</option>
                  <option value="BUNDLE_DOZEN_80K">🎁 Paket 1 Lusin (Diskon Rp 15k)</option>
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Section */}
      {cartItemsList.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-[#E9E2D8]">
          {/* Summary Breakdown */}
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-[#8F8377]">
              <span>Subtotal Item</span>
              <span>
                {currencySymbol} {summary.rawSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {summary.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Diskon</span>
                <span>
                  - {currencySymbol} {summary.discountAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {summary.serviceFee > 0 && (
              <div className="flex justify-between text-[#8F8377]">
                <span>Biaya Layanan ({settings?.servicePercent}%)</span>
                <span>
                  + {currencySymbol} {summary.serviceFee.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {summary.taxAmount > 0 && (
              <div className="flex justify-between text-[#8F8377]">
                <span>PPN ({settings?.taxPercent}%)</span>
                <span>
                  + {currencySymbol} {summary.taxAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {summary.shippingCost > 0 && (
              <div className="flex justify-between text-[#8F8377]">
                <span>Ongkir Delivery</span>
                <span>
                  + {currencySymbol} {summary.shippingCost.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-[#8B3350] pt-2 border-t border-[#E9E2D8]">
              <span>TOTAL BAYAR</span>
              <span>
                {currencySymbol} {summary.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Method Controls */}
          <div>
            <label className="block text-[10px] font-bold text-[#8F8377] uppercase tracking-wider mb-1">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['QRIS', 'Tunai', 'Split Payment'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-[#8B3350] text-white shadow-xs'
                      : 'bg-[#FBF7F2] text-[#5C5248] border border-[#E9E2D8] hover:bg-[#E9E2D8]/40'
                  }`}
                >
                  {method === 'QRIS' ? '📱 QRIS' : method === 'Tunai' ? '💵 Tunai' : '🔀 Split'}
                </button>
              ))}
            </div>
          </div>

          {/* Split Payment inputs */}
          {paymentMethod === 'Split Payment' && (
            <div className="grid grid-cols-2 gap-2 p-2 bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl text-xs">
              <div>
                <label className="block text-[10px] text-[#8F8377]">Porsi Tunai (Rp)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border border-[#E9E2D8] rounded-lg font-mono bg-white"
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8F8377]">Porsi QRIS (Rp)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border border-[#E9E2D8] rounded-lg font-mono bg-white"
                  value={qrisAmountInput}
                  onChange={(e) => setQrisAmountInput(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            type="button"
            onClick={onCheckout}
            className="w-full py-3 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl font-bold text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <span>PROSES PEMBAYARAN</span>
            <span className="font-mono">({currencySymbol} {summary.grandTotal.toLocaleString('id-ID')})</span>
          </button>
        </div>
      )}
    </div>
  );
}
