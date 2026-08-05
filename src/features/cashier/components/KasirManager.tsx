import React from 'react';
import { Recipe, Sale, ErpSettings, ErpUser } from '../../../types';
import { ShoppingCart, History } from 'lucide-react';
import { useCashier } from '../hooks/useCashier';

import ProductCatalog from './ProductCatalog';
import CartPanel from './CartPanel';
import ThermalReceiptModal from './ThermalReceiptModal';
import SalesHistoryTab from './SalesHistoryTab';
import VoidAuthorizationModal from './VoidAuthorizationModal';

interface KasirManagerProps {
  recipes: Recipe[];
  sales: Sale[];
  donutInventory: Record<string, number>;
  settings?: ErpSettings;
  currentUser?: ErpUser | null;
  onProcessSale: (newSale: Sale) => void;
  onVoidSale: (id: string, meta: { voidedBy: string; voidedAt: string; voidReason: string }) => void;
  onUpdateSale?: (updatedSale: Sale) => void;
  onUpdateDonutInventory: (flavorOrAdjustments: string | Record<string, number>, addQty?: number) => void;
  onAddSecurityLog: (event: string, level: 'Aman' | 'Peringatan' | 'Bahaya') => void;
}

export default function KasirManager(props: KasirManagerProps) {
  const { recipes, sales, donutInventory, settings, currentUser } = props;

  const {
    activeTab,
    setActiveTab,
    cart,
    customerName,
    setCustomerName,
    shippingCostInput,
    setShippingCostInput,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    promoType,
    setPromoType,
    paymentMethod,
    setPaymentMethod,
    cashAmountInput,
    setCashAmountInput,
    qrisAmountInput,
    setQrisAmountInput,
    selectedSaleForReceipt,
    setSelectedSaleForReceipt,
    selectedSaleForVoid,
    setSelectedSaleForVoid,
    currencySymbol,
    handleAddToCart,
    handleUpdateQty,
    handleRemoveItem,
    handleClearCart,
    handleCheckout,
    handleConfirmVoid,
  } = useCashier(props);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2 border border-[#E9E2D8] rounded-2xl shadow-xxs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'transaksi'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>🛍️ Kasir &amp; Keranjang Belanja</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📜 Riwayat Penjualan ({sales.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KASIR POS TRANSAKSI */}
      {activeTab === 'transaksi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <ProductCatalog
              recipes={recipes}
              donutInventory={donutInventory}
              cart={cart}
              currencySymbol={currencySymbol}
              onAddToCart={handleAddToCart}
            />
          </div>

          <div className="lg:col-span-5 sticky top-4">
            <CartPanel
              cart={cart}
              donutInventory={donutInventory}
              settings={settings}
              currencySymbol={currencySymbol}
              customerName={customerName}
              shippingCostInput={shippingCostInput}
              discountType={discountType}
              discountValue={discountValue}
              promoType={promoType}
              paymentMethod={paymentMethod}
              cashAmountInput={cashAmountInput}
              qrisAmountInput={qrisAmountInput}
              setCustomerName={setCustomerName}
              setShippingCostInput={setShippingCostInput}
              setDiscountType={setDiscountType}
              setDiscountValue={setDiscountValue}
              setPromoType={setPromoType}
              setPaymentMethod={setPaymentMethod}
              setCashAmountInput={setCashAmountInput}
              setQrisAmountInput={setQrisAmountInput}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT PENJUALAN & VOID */}
      {activeTab === 'riwayat' && (
        <SalesHistoryTab
          sales={sales}
          settings={settings}
          currencySymbol={currencySymbol}
          onOpenReceiptModal={(sale) => setSelectedSaleForReceipt(sale)}
          onOpenVoidModal={(sale) => setSelectedSaleForVoid(sale)}
        />
      )}

      {/* MODAL 1: NOTA THERMAL RECEIPT */}
      {selectedSaleForReceipt && (
        <ThermalReceiptModal
          sale={selectedSaleForReceipt}
          settings={settings}
          currencySymbol={currencySymbol}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}

      {/* MODAL 2: OTORITAS VOID */}
      {selectedSaleForVoid && (
        <VoidAuthorizationModal
          targetSale={selectedSaleForVoid}
          currentUser={currentUser}
          settings={settings}
          currencySymbol={currencySymbol}
          onClose={() => setSelectedSaleForVoid(null)}
          onConfirmVoid={handleConfirmVoid}
        />
      )}
    </div>
  );
}
