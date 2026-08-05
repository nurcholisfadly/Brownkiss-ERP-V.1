import { Ingredient, Recipe, ProductionBatch, Sale, SecurityLog, IngredientPurchase, CashTransaction } from './types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing_tepung',
    name: 'Tepung Terigu Cakra Kembar',
    category: 'Bahan Kering',
    qty: 25000, // 25 KG
    unit: 'Gram',
    minQty: 5000,
    costPerUnit: 16 // Rp 16.000 / KG -> Rp 16 / Gram
  },
  {
    id: 'ing_mentega',
    name: 'Mentega Wijsman Premium',
    category: 'Bahan Kering',
    qty: 4500, // 4.5 KG
    unit: 'Gram',
    minQty: 1000,
    costPerUnit: 280 // Rp 280.000 / KG -> Rp 280 / Gram
  },
  {
    id: 'ing_gula',
    name: 'Gula Pasir Gulaku',
    category: 'Bahan Kering',
    qty: 12000, // 12 KG
    unit: 'Gram',
    minQty: 2000,
    costPerUnit: 18 // Rp 18.000 / KG -> Rp 18 / Gram
  },
  {
    id: 'ing_ragi',
    name: 'Ragi Instan Fermipan',
    category: 'Bahan Kering',
    qty: 800, // 800g
    unit: 'Gram',
    minQty: 200,
    costPerUnit: 120 // Rp 120 / Gram
  },
  {
    id: 'ing_susu',
    name: 'Susu UHT Full Cream Greenfields',
    category: 'Cair',
    qty: 10000, // 10 Liter
    unit: 'Ml',
    minQty: 2000,
    costPerUnit: 22 // Rp 22.000 / Liter -> Rp 22 / Ml
  },
  {
    id: 'ing_cokelat',
    name: 'Cokelat Selai Tulip Chocolate',
    category: 'Topping',
    qty: 5000, // 5 KG
    unit: 'Gram',
    minQty: 1000,
    costPerUnit: 65 // Rp 65.000 / KG -> Rp 65 / Gram
  },
  {
    id: 'ing_keju',
    name: 'Keju Cheddar Kraft',
    category: 'Topping',
    qty: 3000, // 3 KG
    unit: 'Gram',
    minQty: 800,
    costPerUnit: 90 // Rp 90.000 / KG -> Rp 90 / Gram
  }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec_klasik',
    name: 'Donat Klasik Gula Bubuk',
    price: 6000,
    hpp: 1850,
    margin: 224,
    emoji: '🍩',
    category: 'BASE',
    batchOutput: 12,
    ingredients: [
      { ingredientId: 'ing_tepung', qtyNeeded: 350 }, // 350g
      { ingredientId: 'ing_mentega', qtyNeeded: 50 },
      { ingredientId: 'ing_gula', qtyNeeded: 60 },
      { ingredientId: 'ing_ragi', qtyNeeded: 10 },
      { ingredientId: 'ing_susu', qtyNeeded: 150 }
    ]
  },
  {
    id: 'rec_cokelat',
    name: 'Donat Meises Cokelat Belgian',
    price: 8500,
    hpp: 2850,
    margin: 198,
    emoji: '🍫',
    category: 'TOPPING',
    batchOutput: 12,
    ingredients: [
      { ingredientId: 'ing_tepung', qtyNeeded: 350 },
      { ingredientId: 'ing_mentega', qtyNeeded: 50 },
      { ingredientId: 'ing_gula', qtyNeeded: 60 },
      { ingredientId: 'ing_ragi', qtyNeeded: 10 },
      { ingredientId: 'ing_susu', qtyNeeded: 150 },
      { ingredientId: 'ing_cokelat', qtyNeeded: 120 } // 120g topping
    ]
  },
  {
    id: 'rec_keju',
    name: 'Donat Keju Cheddar Melimpah',
    price: 9000,
    hpp: 3150,
    margin: 185,
    emoji: '🧀',
    category: 'TOPPING',
    batchOutput: 12,
    ingredients: [
      { ingredientId: 'ing_tepung', qtyNeeded: 350 },
      { ingredientId: 'ing_mentega', qtyNeeded: 50 },
      { ingredientId: 'ing_gula', qtyNeeded: 60 },
      { ingredientId: 'ing_ragi', qtyNeeded: 10 },
      { ingredientId: 'ing_susu', qtyNeeded: 150 },
      { ingredientId: 'ing_keju', qtyNeeded: 100 } // 100g keju
    ]
  }
];

export const INITIAL_PRODUCTION: ProductionBatch[] = [
  {
    id: 'batch_init_1',
    resep: 'Donat Klasik Gula Bubuk',
    qty: 24,
    cost: 44400,
    val: 144000,
    date: '2026-07-20',
    status: 'Selesai',
    progress: 100
  },
  {
    id: 'batch_init_2',
    resep: 'Donat Meises Cokelat Belgian',
    qty: 12,
    cost: 34200,
    val: 102000,
    date: '2026-07-21',
    status: 'Selesai',
    progress: 100
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_init_1',
    date: '2026-07-20 14:30',
    invoiceNo: 'INV-20260720-001',
    paymentMethod: 'QRIS',
    customerName: 'Budi Santoso',
    customerAddress: '-',
    shippingCost: 0,
    total: 34000,
    items: [
      { name: 'Donat Klasik Gula Bubuk', qty: 4, price: 6000 },
      { name: 'Donat Meises Cokelat Belgian', qty: 1, price: 8500 }
    ]
  },
  {
    id: 'sale_init_2',
    date: '2026-07-21 10:15',
    invoiceNo: 'INV-20260721-001',
    paymentMethod: 'Tunai',
    customerName: 'Siti Rahma',
    customerAddress: '-',
    shippingCost: 0,
    total: 26000,
    items: [
      { name: 'Donat Keju Cheddar Melimpah', qty: 2, price: 9000 },
      { name: 'Donat Klasik Gula Bubuk', qty: 1, price: 6000 }
    ]
  }
];

export const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  {
    id: 'log_init_1',
    timestamp: '2026-07-20 08:00',
    event: 'Sistem ERP Brownkiss diaktifkan pertama kali',
    level: 'Aman'
  },
  {
    id: 'log_init_2',
    timestamp: '2026-07-21 08:15',
    event: 'Owner Fadli Berniaga masuk ke sistem',
    level: 'Aman'
  }
];

export const WEEKLY_SALES_TREND = [
  { day: 'Sen', val: 420000, revenue: 420000 },
  { day: 'Sel', val: 680000, revenue: 680000 },
  { day: 'Rab', val: 510000, revenue: 510000 },
  { day: 'Kam', val: 740000, revenue: 740000 },
  { day: 'Jum', val: 950000, revenue: 950000 },
  { day: 'Sab', val: 1250000, revenue: 1250000 },
  { day: 'Min', val: 1400000, revenue: 1400000 }
];

export const INITIAL_PURCHASES: IngredientPurchase[] = [
  {
    id: 'pur_init_1',
    ingredientId: 'ing_tepung',
    ingredientName: 'Tepung Terigu Cakra Kembar',
    date: '2026-07-05 09:00',
    type: 'STOK_AWAL',
    qtyAdded: 15000,
    unit: 'Gram',
    costPerUnit: 14, // Rp 14.000 / KG
    totalCost: 210000,
    note: 'Pembelian Awal Toko Bahan Kue'
  },
  {
    id: 'pur_init_2',
    ingredientId: 'ing_tepung',
    ingredientName: 'Tepung Terigu Cakra Kembar',
    date: '2026-07-15 11:30',
    type: 'RESTOCK',
    qtyAdded: 10000,
    unit: 'Gram',
    costPerUnit: 16, // Rp 16.000 / KG
    totalCost: 160000,
    note: 'Restock 10 KG - Toko Subur'
  },
  {
    id: 'pur_init_3',
    ingredientId: 'ing_mentega',
    ingredientName: 'Mentega Wijsman Premium',
    date: '2026-07-08 10:00',
    type: 'STOK_AWAL',
    qtyAdded: 2500,
    unit: 'Gram',
    costPerUnit: 260, // Rp 260.000 / KG
    totalCost: 650000,
    note: 'Pembelian Kaleng Wijsman'
  },
  {
    id: 'pur_init_4',
    ingredientId: 'ing_mentega',
    ingredientName: 'Mentega Wijsman Premium',
    date: '2026-07-22 14:15',
    type: 'RESTOCK',
    qtyAdded: 2000,
    unit: 'Gram',
    costPerUnit: 280, // Rp 280.000 / KG
    totalCost: 560000,
    note: 'Restock 2 KG Kaleng Wijsman'
  },
  {
    id: 'pur_init_5',
    ingredientId: 'ing_susu',
    ingredientName: 'Susu UHT Full Cream Greenfields',
    date: '2026-07-10 13:00',
    type: 'STOK_AWAL',
    qtyAdded: 10000,
    unit: 'Ml',
    costPerUnit: 22,
    totalCost: 220000,
    note: 'Pembelian 1 Karton 10L'
  }
];

export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [
  {
    id: 'cash_init_1',
    date: '2026-07-20 08:00',
    type: 'MASUK',
    amount: 1500000,
    category: 'Modal Awal',
    note: 'Modal Kas Awal Toko Brownkiss',
    createdBy: 'Fadli Berniaga',
    paymentMethod: 'Tunai'
  },
  {
    id: 'cash_init_2',
    date: '2026-07-22 14:15',
    type: 'KELUAR',
    amount: 560000,
    category: 'Pembelian Bahan',
    note: 'Restock Mentega Wijsman 2 KG',
    createdBy: 'Fadli Berniaga',
    paymentMethod: 'Tunai'
  },
  {
    id: 'cash_init_3',
    date: '2026-07-25 16:30',
    type: 'KELUAR',
    amount: 250000,
    category: 'Biaya Operasional',
    note: 'Pembelian Tabung Gas Elpiji 12kg & Listrik Dapur',
    createdBy: 'Fadli Berniaga',
    paymentMethod: 'Tunai'
  },
  {
    id: 'cash_init_4',
    date: '2026-07-26 09:00',
    type: 'MASUK',
    amount: 350000,
    category: 'Penjualan Non-POS',
    note: 'Pesanan Donat Dus Besar Syukuran Tetangga',
    createdBy: 'Staff Kasir',
    paymentMethod: 'Transfer Bank'
  }
];

