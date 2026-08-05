export interface Ingredient {
  id: string;
  name: string;
  category: 'Bahan Utama' | 'Bahan Kering' | 'Cair' | 'Topping' | 'Segar' | 'Packaging' | 'Overhead' | 'Lainnya';
  qty: number;
  unit: string;
  minQty: number;
  costPerUnit: number; // Cost in IDR per base unit (e.g., Rp 15 / gram)
}

export interface RecipeIngredient {
  ingredientId: string;
  qtyNeeded: number; // e.g., 0.25 (kg)
}

export interface RecipeVersion {
  version: number;
  date: string;
  hpp: number;
  price: number;
  margin: number;
  batchOutput: number;
  ingredients: RecipeIngredient[];
  note?: string;
  updatedBy?: string;
}

export interface Recipe {
  id: string;
  name: string;
  price: number; // Selling price in IDR
  hpp: number; // Calculated cost of goods sold per unit
  margin: number; // Profit margin percentage (e.g. 58%)
  ingredients: RecipeIngredient[];
  emoji: string;
  category?: 'BASE' | 'TOPPING' | 'PACKAGING' | 'RESELLER' | 'LAINNYA';
  batchOutput?: number;
  status?: 'Aktif' | 'Nonaktif';
  version?: number;
  history?: RecipeVersion[];
}

export interface ProductionStageLog {
  id: string;
  stageNumber: number;
  qtyCompleted: number; // pcs finished in this stage
  wasteQty: number;     // pcs wasted in this stage
  wasteReason?: string;
  completedAt: string;
  operator?: string;
}

export interface ProductionBatch {
  id: string;
  recipeId?: string;
  resep: string; // Recipe name
  qty: number; // Target Quantity produced (pcs)
  cost: number; // Total production cost (qty * recipe HPP)
  val: number; // Market value (qty * recipe selling price)
  date: string; // Formatting date string
  status: 'Diproses' | 'Selesai' | 'Menunggu' | 'Batal';
  progress: number; // 0 to 100
  operator?: string; // Baker / Chef / Staff operating the batch
  scheduledDate?: string; // Target date/time if status is 'Menunggu'
  wasteQty?: number; // Total ruined/defective pcs
  wasteReason?: string; // Reason for waste (e.g. Gosong, Cacat Bentuk, etc)
  usableQty?: number; // Net good pcs added to inventory (qty - wasteQty)
  isStaged?: boolean; // Whether production is done in stages
  stageTargetQty?: number; // Target pcs per stage/tray (e.g., 50 pcs)
  stagedLogs?: ProductionStageLog[]; // Log of incremental stages completed
  isClosed?: boolean; // Whether the batch belongs to a closed daily session
}

export interface SaleItem {
  name: string;
  qty: number;
  price: number;
  returnedQty?: number;
}

export interface ReturnDetail {
  returnedAt: string;
  returnedBy: string;
  reason: string;
  refundAmount: number;
  restocked: boolean;
  returnedItems: { name: string; qty: number }[];
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'Tunai' | 'QRIS' | 'Split Payment';
  customerName?: string;
  customerAddress?: string;
  shippingCost?: number;
  invoiceNo?: string;
  status?: 'Selesai' | 'Void' | 'Diretur';
  voidedBy?: string;
  voidedAt?: string;
  voidReason?: string;
  discountType?: 'none' | 'percent' | 'nominal' | 'promo';
  discountValue?: number;
  discountAmount?: number;
  promoName?: string;
  cashPaid?: number;
  qrisPaid?: number;
  changeAmount?: number;
  returnDetails?: ReturnDetail[];
  isClosed?: boolean; // True if daily closing has been executed
}

export interface HeldTransaction {
  id: string;
  label: string;
  createdAt: string;
  items: { recipe: Recipe; qty: number }[];
  customerName: string;
  customerAddress: string;
  shippingCost: string;
  discountType: 'none' | 'percent' | 'nominal' | 'promo';
  discountValue: number;
  promoType?: string;
  promoName?: string;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  event: string;
  level: 'Aman' | 'Peringatan' | 'Bahaya';
  userName?: string;
  userRole?: string;
  date?: string;
  time?: string;
  beforeValue?: string;
  afterValue?: string;
  category?: 'Login' | 'Logout' | 'Restock' | 'Koreksi Stok' | 'Perubahan Harga' | 'Void Transaksi' | 'Penghapusan Data' | 'Perubahan Setting' | 'Perubahan User' | 'Lainnya';
}

export interface ErpUser {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Kasir' | 'Baker';
  status: 'Aktif' | 'Nonaktif';
  password?: string;
}

export interface ErpSettings {
  storeName: string;
  storeAddress: string;
  contactNumber: string;
  taxPercent: number;
  servicePercent: number;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  allowOverSell: boolean;
  voidAuthorizationPin?: string;
}

export interface IngredientPurchase {
  id: string;
  ingredientId: string;
  ingredientName: string;
  date: string;
  type: 'RESTOCK' | 'STOK_AWAL' | 'KOREKSI_HARGA' | 'KOREKSI_STOK';
  qtyAdded: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  note?: string;
  createdAt?: string;
}

export interface CashTransaction {
  id: string;
  date: string; // e.g. "2026-07-27 10:00"
  type: 'MASUK' | 'KELUAR';
  amount: number;
  category: 'Modal Awal' | 'Penjualan Non-POS' | 'Setoran Tunai' | 'Pembelian Bahan' | 'Biaya Operasional' | 'Gaji Staff' | 'Maintenance Alat' | 'Lain-lain';
  note: string;
  createdBy?: string;
  paymentMethod?: 'Tunai' | 'Transfer Bank' | 'QRIS';
  refId?: string;
  createdAt?: string;
}

export interface WasteDonutDetail {
  flavor: string;
  qty: number;
}

export interface ClosingReport {
  id: string;
  date: string; // e.g. "2026-07-29"
  totalPenjualan: number;
  totalTunaiSistem: number;
  totalQrisSistem: number;
  kasFisik: number;
  selisihKas: number;
  closedBy: string;
  closedByRole?: string;
  notes?: string;
  wasteDonutQty: number;
  wasteDonutDetails?: WasteDonutDetail[];
  status: 'CLOSED';
  createdAt?: string;
}

export interface InventorySnapshotItem {
  ingredientId: string;
  ingredientName: string;
  category: string;
  qty: number;
  unit: string;
  costPerUnit: number;
}

export interface InventorySnapshot {
  id: string;
  closingReportId: string;
  date: string;
  snapshotData: InventorySnapshotItem[];
  totalValue: number;
  createdAt?: string;
}

