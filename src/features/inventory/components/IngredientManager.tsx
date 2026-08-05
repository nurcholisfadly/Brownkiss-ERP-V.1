import React from 'react';
import { Ingredient, Recipe, IngredientPurchase, ErpSettings } from '../../../types';
import { Search, Plus, FileText, Layers, Receipt, FileSpreadsheet } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';

import AddIngredientModal from './AddIngredientModal';
import AdjustIngredientModal from './AdjustIngredientModal';
import IngredientHistoryModal from './IngredientHistoryModal';
import IngredientTable from './IngredientTable';
import PurchaseJournalTable from './PurchaseJournalTable';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  recipes?: Recipe[];
  purchases?: IngredientPurchase[];
  settings?: ErpSettings;
  onUpdateIngredient: (updated: Ingredient) => void;
  onAddIngredient: (newIng: Omit<Ingredient, 'id'>) => Ingredient | void;
  onAddPurchase?: (newPur: Omit<IngredientPurchase, 'id'>) => void;
  onDeleteIngredient?: (id: string) => void;
}

export default function IngredientManager(props: IngredientManagerProps) {
  const {
    ingredients,
    purchases = [],
    onUpdateIngredient,
    onAddIngredient,
    onAddPurchase,
    onDeleteIngredient,
  } = props;

  const {
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
  } = useInventory(props);

  return (
    <div className="space-y-6">
      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2 border border-[#E9E2D8] rounded-2xl shadow-xxs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMainViewTab('STOK')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              mainViewTab === 'STOK'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📦 Inventori Stok Bahan Gudang</span>
          </button>

          <button
            onClick={() => setMainViewTab('JURNAL_PEMBELIAN')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              mainViewTab === 'JURNAL_PEMBELIAN'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>🧾 Jurnal Pembelian &amp; Stok Masuk</span>
            {purchases.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] bg-[#FBF7F2]/20 rounded-full font-mono">
                {purchases.length}
              </span>
            )}
          </button>
        </div>

        {mainViewTab === 'STOK' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportInventoryPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B3350] hover:bg-[#722740] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              title="Unduh Laporan Inventori Bahan (PDF)"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh PDF Stok</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2A2420] hover:bg-[#3A322B] text-[#FBF7F2] font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan Baku</span>
            </button>
          </div>
        )}

        {mainViewTab === 'JURNAL_PEMBELIAN' && (
          <button
            onClick={exportJournalCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV Jurnal</span>
          </button>
        )}
      </div>

      {/* VIEW MODE 1: STOK BAHAN BAKU */}
      {mainViewTab === 'STOK' && (
        <>
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5ECE1] border border-[#E9E2D8] rounded-2xl p-6 shadow-xxs">
              <p className="text-xs font-bold text-[#8F8377] uppercase tracking-wider mb-1">Total Nilai Inventori</p>
              <p className="font-serif text-3xl font-bold text-[#8B3350]">
                Rp {Math.round(totalWarehouseValue).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-[#A6957C] block mt-1.5 font-sans">
                Aset modal bahan baku aktif yang tersimpan di gudang saat ini.
              </span>
            </div>

            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xxs">
              <p className="text-xs font-bold text-[#8F8377] uppercase tracking-wider mb-1">Total Jenis Bahan</p>
              <p className="font-serif text-3xl font-bold text-[#2A2420]">
                {totalItemCount} <span className="text-sm font-sans font-normal text-[#5C5248]">Item</span>
              </p>
              <span className="text-[10px] text-[#A6957C] block mt-1.5 font-sans">
                Kategori bahan kering, basah, topping, &amp; kemasan.
              </span>
            </div>

            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xxs">
              <p className="text-xs font-bold text-[#8F8377] uppercase tracking-wider mb-1">Status Kritis / Menipis</p>
              <p className="font-serif text-3xl font-bold text-[#B3432F]">
                {criticalItemCount} <span className="text-sm font-sans font-normal text-[#5C5248]">Item</span>
              </p>
              <span className="text-[10px] text-[#A6957C] block mt-1.5 font-sans">
                Bahan baku di bawah ambang batas minimum dan perlu segera di-restock.
              </span>
            </div>
          </div>

          {/* Search Row */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A8E80]" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border-1.5 border-[#E9E2D8] rounded-xl font-sans text-sm outline-none bg-white focus:border-[#8B3350] focus:ring-4 focus:ring-[rgba(139,51,80,0.08)] transition-all"
              placeholder="Cari nama bahan baku..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Main Stock Inventory Table */}
          <IngredientTable
            ingredients={ingredients}
            paginatedIngredients={paginatedIngredients}
            filteredCount={filteredIngredients.length}
            purchases={purchases}
            currentPage={currentPage}
            pageSize={pageSize}
            totalStockPages={totalStockPages}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            onOpenHistory={(ing) => setHistoryIng(ing)}
            onOpenAdjustment={openAdjustmentModal}
            onDeleteIngredient={onDeleteIngredient ? handleDelete : undefined}
          />
        </>
      )}

      {/* VIEW MODE 2: JURNAL PEMBELIAN & STOK MASUK */}
      {mainViewTab === 'JURNAL_PEMBELIAN' && (
        <PurchaseJournalTable
          ingredients={ingredients}
          purchases={purchases}
          paginatedJournalPurchases={paginatedJournalPurchases}
          filteredJournalPurchases={filteredJournalPurchases}
          journalSearch={journalSearch}
          journalIngFilter={journalIngFilter}
          journalTypeFilter={journalTypeFilter}
          journalPage={journalPage}
          journalPageSize={journalPageSize}
          totalJournalPages={totalJournalPages}
          setJournalSearch={setJournalSearch}
          setJournalIngFilter={setJournalIngFilter}
          setJournalTypeFilter={setJournalTypeFilter}
          setJournalPage={setJournalPage}
          setJournalPageSize={setJournalPageSize}
        />
      )}

      {/* MODALS */}
      {showAddModal && (
        <AddIngredientModal
          onClose={() => setShowAddModal(false)}
          onAddIngredient={onAddIngredient}
          onAddPurchase={onAddPurchase}
        />
      )}

      {showAdjustModal && selectedIng && (
        <AdjustIngredientModal
          selectedIng={selectedIng}
          initialTab={adjustTab}
          onClose={closeAdjustmentModal}
          onUpdateIngredient={onUpdateIngredient}
          onAddPurchase={onAddPurchase}
        />
      )}

      {historyIng && (
        <IngredientHistoryModal
          historyIng={historyIng}
          purchases={purchases}
          onClose={() => setHistoryIng(null)}
          onOpenRestock={(ing) => {
            setHistoryIng(null);
            openAdjustmentModal(ing, 'RESTOCK');
          }}
        />
      )}
    </div>
  );
}
