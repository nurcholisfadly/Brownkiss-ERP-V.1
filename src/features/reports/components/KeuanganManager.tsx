import React from 'react';
import { Sale, Recipe, CashTransaction, ErpSettings, IngredientPurchase } from '../../../types';
import { Wallet, PieChart, TrendingUp } from 'lucide-react';
import { useReports } from '../hooks/useReports';

import CashTransactionModal from './CashTransactionModal';
import CashFlowTab from './CashFlowTab';
import DailyBalanceTab from './DailyBalanceTab';
import ProfitLossTab from './ProfitLossTab';

interface KeuanganManagerProps {
  sales: Sale[];
  recipes: Recipe[];
  cashTransactions: CashTransaction[];
  purchases?: IngredientPurchase[];
  settings?: ErpSettings;
  onAddCashTransaction: (tx: CashTransaction) => void;
  onDeleteCashTransaction: (id: string) => void;
  onAddSecurityLog: (event: string, level: 'Aman' | 'Peringatan' | 'Bahaya') => void;
}

export default function KeuanganManager(props: KeuanganManagerProps) {
  const { sales, recipes, cashTransactions, onDeleteCashTransaction } = props;

  const {
    activeTab,
    setActiveTab,
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    modalType,
    amountInput,
    setAmountInput,
    categoryInput,
    setCategoryInput,
    noteInput,
    setNoteInput,
    paymentMethodInput,
    setPaymentMethodInput,
    currencySymbol,
    recipeHppMap,
    filteredLedger,
    handleOpenModal,
    handleSubmitTransaction,
    handleExportCSV,
    handleExportPDF,
  } = useReports(props);

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2 border border-[#E9E2D8] rounded-2xl shadow-xxs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('aliran_kas')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'aliran_kas'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>💸 Aliran Kas (Ledger)</span>
          </button>

          <button
            onClick={() => setActiveTab('saldo_harian')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'saldo_harian'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>📊 Saldo Kas Harian</span>
          </button>

          <button
            onClick={() => setActiveTab('ringkasan_laba')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'ringkasan_laba'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>📈 Laba Rugi Operasional</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ALIRAN KAS (LEDGER) */}
      {activeTab === 'aliran_kas' && (
        <CashFlowTab
          filteredLedger={filteredLedger}
          filterType={filterType}
          filterCategory={filterCategory}
          searchQuery={searchQuery}
          currencySymbol={currencySymbol}
          setFilterType={setFilterType}
          setFilterCategory={setFilterCategory}
          setSearchQuery={setSearchQuery}
          onOpenModal={handleOpenModal}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onDeleteTransaction={onDeleteCashTransaction}
        />
      )}

      {/* TAB 2: SALDO KAS HARIAN */}
      {activeTab === 'saldo_harian' && (
        <DailyBalanceTab
          sales={sales}
          cashTransactions={cashTransactions}
          currencySymbol={currencySymbol}
          onExportPDF={handleExportPDF}
        />
      )}

      {/* TAB 3: RINGKASAN LABA RUGI */}
      {activeTab === 'ringkasan_laba' && (
        <ProfitLossTab
          sales={sales}
          recipes={recipes}
          cashTransactions={cashTransactions}
          currencySymbol={currencySymbol}
          recipeHppMap={recipeHppMap}
          onExportPDF={handleExportPDF}
        />
      )}

      {/* MODAL: CASH IN / OUT */}
      {isModalOpen && (
        <CashTransactionModal
          modalType={modalType}
          amountInput={amountInput}
          categoryInput={categoryInput}
          noteInput={noteInput}
          paymentMethodInput={paymentMethodInput}
          currencySymbol={currencySymbol}
          setAmountInput={setAmountInput}
          setCategoryInput={setCategoryInput}
          setNoteInput={setNoteInput}
          setPaymentMethodInput={setPaymentMethodInput}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitTransaction}
        />
      )}
    </div>
  );
}
