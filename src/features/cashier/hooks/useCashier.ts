import { useState } from 'react';
import { Recipe, Sale, ErpSettings, ErpUser } from '../../../types';
import { calculateSaleSummary } from '../utils/posUtils';

export interface CartItem {
  recipe: Recipe;
  qty: number;
}

export interface UseCashierOptions {
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

export function useCashier({
  recipes,
  sales,
  donutInventory,
  settings,
  currentUser,
  onProcessSale,
  onVoidSale,
  onUpdateSale,
  onUpdateDonutInventory,
  onAddSecurityLog,
}: UseCashierOptions) {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'riwayat'>('transaksi');
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  // Checkout Form States
  const [customerName, setCustomerName] = useState<string>('');
  const [shippingCostInput, setShippingCostInput] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'nominal' | 'promo'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [promoType, setPromoType] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Split Payment'>('QRIS');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [qrisAmountInput, setQrisAmountInput] = useState<string>('');

  // Modals
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForVoid, setSelectedSaleForVoid] = useState<Sale | null>(null);

  const currencySymbol = settings?.currency || 'Rp';

  // Add Item to Cart
  const handleAddToCart = (recipe: Recipe) => {
    const currentQty = cart[recipe.id]?.qty || 0;
    const availableStock = donutInventory[recipe.name] || 0;

    if (currentQty + 1 > availableStock) {
      alert(`Stok display ${recipe.name} hanya tersisa ${availableStock} pcs!`);
      return;
    }

    setCart({
      ...cart,
      [recipe.id]: {
        recipe,
        qty: currentQty + 1,
      },
    });
  };

  // Update Cart Qty
  const handleUpdateQty = (recipeId: string, delta: number) => {
    const item = cart[recipeId];
    if (!item) return;

    const recipe = item.recipe;
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      handleRemoveItem(recipeId);
      return;
    }

    const availableStock = donutInventory[recipe.name] || 0;
    if (newQty > availableStock) {
      alert(`Stok display ${recipe.name} hanya tersisa ${availableStock} pcs!`);
      return;
    }

    setCart({
      ...cart,
      [recipeId]: {
        ...item,
        qty: newQty,
      },
    });
  };

  // Remove Item
  const handleRemoveItem = (recipeId: string) => {
    const updated = { ...cart };
    delete updated[recipeId];
    setCart(updated);
  };

  // Clear Cart
  const handleClearCart = () => {
    setCart({});
  };

  // Process Checkout
  const handleCheckout = () => {
    const itemsList = Object.values(cart) as CartItem[];
    if (itemsList.length === 0) return;

    const saleItems = itemsList.map((ci) => ({
      name: ci.recipe.name,
      qty: ci.qty,
      price: ci.recipe.price,
    }));

    const summary = calculateSaleSummary(
      saleItems,
      settings,
      shippingCostInput,
      discountType,
      discountValue,
      promoType
    );

    const now = new Date();
    const dateStr =
      now.toLocaleDateString('id-ID') +
      ' ' +
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNo,
      date: dateStr,
      items: saleItems,
      total: summary.grandTotal,
      paymentMethod,
      customerName: customerName.trim() || 'Pelanggan Umum',
      shippingCost: summary.shippingCost,
      status: 'Selesai',
    };

    // Deduct stock
    const stockAdjustments: Record<string, number> = {};
    itemsList.forEach((ci) => {
      stockAdjustments[ci.recipe.name] = -ci.qty;
    });

    onUpdateDonutInventory(stockAdjustments);
    onProcessSale(newSale);

    onAddSecurityLog(
      `Transaksi POS #${invoiceNo} Berhasil: Total ${currencySymbol} ${summary.grandTotal.toLocaleString('id-ID')} (${paymentMethod})`,
      'Aman'
    );

    // Show thermal receipt
    setSelectedSaleForReceipt(newSale);

    // Reset Form
    setCart({});
    setCustomerName('');
    setShippingCostInput(0);
    setDiscountType('none');
    setDiscountValue(0);
    setPromoType('');
    setCashAmountInput('');
    setQrisAmountInput('');
  };

  // Confirm Void Transaction
  const handleConfirmVoid = (saleId: string, voidedBy: string, voidReason: string) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    const now = new Date();
    const voidedAt =
      now.toLocaleDateString('id-ID') +
      ' ' +
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Refund stock back to display cabinet
    const stockRefunds: Record<string, number> = {};
    targetSale.items.forEach((item) => {
      stockRefunds[item.name] = item.qty;
    });

    onUpdateDonutInventory(stockRefunds);

    onVoidSale(saleId, {
      voidedBy,
      voidedAt,
      voidReason,
    });

    onAddSecurityLog(
      `Pembatalan Transaksi (Void) #${targetSale.invoiceNo || targetSale.id} oleh ${voidedBy}: ${voidReason}`,
      'Bahaya'
    );

    alert(`Transaksi #${targetSale.invoiceNo || targetSale.id} berhasil di-Void dan stok telah dikembalikan ke display!`);
  };

  return {
    activeTab,
    setActiveTab,
    cart,
    setCart,
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
  };
}
