import { useState } from 'react';
import { Ingredient, Recipe, IngredientPurchase, ErpSettings } from '../../../types';
import { exportInventoryReportPDF } from '../../../utils/pdfExport';

export interface UseInventoryOptions {
  ingredients: Ingredient[];
  recipes?: Recipe[];
  purchases?: IngredientPurchase[];
  settings?: ErpSettings;
  onUpdateIngredient: (updated: Ingredient) => void;
  onAddIngredient: (newIng: Omit<Ingredient, 'id'>) => Ingredient | void;
  onAddPurchase?: (newPur: Omit<IngredientPurchase, 'id'>) => void;
  onDeleteIngredient?: (id: string) => void;
}

export function useInventory({
  ingredients,
  recipes = [],
  purchases = [],
  settings,
  onUpdateIngredient,
  onAddIngredient,
  onAddPurchase,
  onDeleteIngredient,
}: UseInventoryOptions) {
  // Navigation tab
  const [mainViewTab, setMainViewTab] = useState<'STOK' | 'JURNAL_PEMBELIAN'>('STOK');

  // Search & Filter state for Main Stock Table
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination states for Stock Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [adjustTab, setAdjustTab] = useState<'RESTOCK' | 'KOREKSI' | 'HARGA'>('RESTOCK');

  // History Modal State
  const [historyIng, setHistoryIng] = useState<Ingredient | null>(null);

  // Journal Filter States
  const [journalSearch, setJournalSearch] = useState('');
  const [journalIngFilter, setJournalIngFilter] = useState('SEMUA');
  const [journalTypeFilter, setJournalTypeFilter] = useState('SEMUA');
  const [journalPage, setJournalPage] = useState(1);
  const [journalPageSize, setJournalPageSize] = useState(10);

  // Filtering Stock Table
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStockItems = filteredIngredients.length;
  const totalStockPages = Math.ceil(totalStockItems / pageSize) || 1;
  const stockStartIndex = (currentPage - 1) * pageSize;
  const paginatedIngredients = filteredIngredients.slice(stockStartIndex, stockStartIndex + pageSize);

  // Calculate Warehouse Asset Values
  const totalWarehouseValue = ingredients.reduce((sum, ing) => sum + ing.qty * ing.costPerUnit, 0);
  const totalItemCount = ingredients.length;
  const criticalItemCount = ingredients.filter((ing) => ing.qty <= ing.minQty).length;

  const openAdjustmentModal = (ing: Ingredient, tab: 'RESTOCK' | 'KOREKSI' | 'HARGA' = 'RESTOCK') => {
    setSelectedIng(ing);
    setAdjustTab(tab);
    setShowAdjustModal(true);
  };

  const closeAdjustmentModal = () => {
    setShowAdjustModal(false);
    setSelectedIng(null);
  };

  const handleDelete = (ing: Ingredient) => {
    if (!onDeleteIngredient) return;

    // Referential Integrity Check: check if any recipe is using this ingredient
    const referencingRecipes = (recipes || []).filter(
      (r) => r.ingredients && r.ingredients.some((ri) => ri.ingredientId === ing.id)
    );

    if (referencingRecipes.length > 0) {
      const recipeList = referencingRecipes.map((r) => `• ${r.emoji || '🍩'} ${r.name}`).join('\n');
      alert(
        `Gagal Menghapus Bahan Baku!\n\nBahan "${ing.name}" masih digunakan oleh ${referencingRecipes.length} resep aktif berikut:\n${recipeList}\n\nHapus atau ubah komposisi resep di atas terlebih dahulu sebelum menghapus bahan baku ini.`
      );
      return;
    }

    const confirmText = `Apakah Anda yakin ingin menghapus bahan "${ing.name}"?\n\nData bahan baku akan dihapus permanen dari inventori gudang.`;
    if (window.confirm(confirmText)) {
      onDeleteIngredient(ing.id);
    }
  };

  // Helper calculation for Journal Table
  const filteredJournalPurchases = purchases.filter((pur) => {
    const matchesSearch =
      pur.ingredientName.toLowerCase().includes(journalSearch.toLowerCase()) ||
      (pur.note || '').toLowerCase().includes(journalSearch.toLowerCase()) ||
      pur.date.toLowerCase().includes(journalSearch.toLowerCase());

    const matchesIng = journalIngFilter === 'SEMUA' || pur.ingredientId === journalIngFilter;
    const matchesType = journalTypeFilter === 'SEMUA' || pur.type === journalTypeFilter;

    return matchesSearch && matchesIng && matchesType;
  });

  const totalJournalItems = filteredJournalPurchases.length;
  const totalJournalPages = Math.ceil(totalJournalItems / journalPageSize) || 1;
  const journalStartIndex = (journalPage - 1) * journalPageSize;
  const paginatedJournalPurchases = filteredJournalPurchases.slice(
    journalStartIndex,
    journalStartIndex + journalPageSize
  );

  // CSV Export for Purchases Journal
  const exportJournalCSV = () => {
    if (filteredJournalPurchases.length === 0) {
      alert('Tidak ada riwayat pembelian untuk diekspor.');
      return;
    }

    const headers = [
      'ID',
      'Tanggal & Waktu',
      'Bahan Baku',
      'Tipe Transaksi',
      'Kuantitas Tambah',
      'Satuan',
      'Harga Satuan (IDR)',
      'Total Bayar (IDR)',
      'Catatan',
    ];

    const sanitizeCsvCell = (val: string | number) => {
      let str = String(val ?? '');
      if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
        str = "'" + str;
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredJournalPurchases.map((p) => [
      sanitizeCsvCell(p.id),
      sanitizeCsvCell(p.date),
      sanitizeCsvCell(p.ingredientName),
      sanitizeCsvCell(p.type),
      sanitizeCsvCell(p.qtyAdded),
      sanitizeCsvCell(p.unit),
      sanitizeCsvCell(p.costPerUnit),
      sanitizeCsvCell(p.totalCost),
      sanitizeCsvCell(p.note || '-'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jurnal_pembelian_bahan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportInventoryPDF = () => {
    if (ingredients.length === 0) {
      alert('Tidak ada data bahan baku untuk diekspor ke PDF!');
      return;
    }
    exportInventoryReportPDF(ingredients, settings);
  };

  return {
    mainViewTab,
    setMainViewTab,
    search,
    setSearch,
    showAddModal,
    setShowAddModal,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    showAdjustModal,
    selectedIng,
    adjustTab,
    historyIng,
    setHistoryIng,
    journalSearch,
    setJournalSearch,
    journalIngFilter,
    setJournalIngFilter,
    journalTypeFilter,
    setJournalTypeFilter,
    journalPage,
    setJournalPage,
    journalPageSize,
    setJournalPageSize,
    filteredIngredients,
    paginatedIngredients,
    totalStockPages,
    totalWarehouseValue,
    totalItemCount,
    criticalItemCount,
    filteredJournalPurchases,
    paginatedJournalPurchases,
    totalJournalPages,
    openAdjustmentModal,
    closeAdjustmentModal,
    handleDelete,
    exportJournalCSV,
    handleExportInventoryPDF,
  };
}
