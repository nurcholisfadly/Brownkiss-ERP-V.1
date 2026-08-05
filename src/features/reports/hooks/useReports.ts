import { useState, useMemo, FormEvent } from 'react';
import { Sale, Recipe, CashTransaction, ErpSettings, IngredientPurchase } from '../../../types';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { exportFinancialReportPDF } from '../../../utils/pdfExport';

export interface UseReportsOptions {
  sales: Sale[];
  recipes: Recipe[];
  cashTransactions: CashTransaction[];
  purchases?: IngredientPurchase[];
  settings?: ErpSettings;
  onAddCashTransaction: (tx: CashTransaction) => void;
  onDeleteCashTransaction: (id: string) => void;
  onAddSecurityLog: (event: string, level: 'Aman' | 'Peringatan' | 'Bahaya') => void;
}

export function useReports({
  sales,
  recipes,
  cashTransactions,
  purchases = [],
  settings,
  onAddCashTransaction,
  onDeleteCashTransaction,
  onAddSecurityLog,
}: UseReportsOptions) {
  const [activeTab, setActiveTab] = useState<'aliran_kas' | 'saldo_harian' | 'ringkasan_laba'>('aliran_kas');
  const [filterType, setFilterType] = useState<'ALL' | 'MASUK' | 'KELUAR'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Cash In/Out
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [amountInput, setAmountInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<CashTransaction['category']>('Modal Awal');
  const [noteInput, setNoteInput] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');

  const loggedInUser = useCurrentUser();
  const currencySymbol = settings?.currency || 'Rp';

  // Map recipe HPP for fast lookup
  const recipeHppMap = useMemo(() => {
    const map: Record<string, number> = {};
    recipes.forEach((r) => {
      map[r.name] = r.hpp || 0;
    });
    return map;
  }, [recipes]);

  // Combine POS Sales (Non-Void) Cash Inflows with Manual Cash Transactions
  const allLedgerEntries = useMemo(() => {
    const combined: (CashTransaction & { isAutoPos?: boolean })[] = [...cashTransactions];

    // Include completed sales as automatic Cash Inflows if not already present
    sales.forEach((s) => {
      if (s.status !== 'Void') {
        const netTotal = s.total;
        combined.push({
          id: `pos_${s.id}`,
          date: s.date,
          type: 'MASUK',
          amount: netTotal,
          category: 'Penjualan Non-POS', // Label for POS revenue
          note: `Penjualan POS Invoice ${s.invoiceNo || s.id} (${s.items.map((i) => `${i.qty}x ${i.name}`).join(', ')})`,
          createdBy: 'Sistem POS',
          paymentMethod: s.paymentMethod === 'Split Payment' ? 'Tunai' : (s.paymentMethod as any),
          refId: s.id,
          isAutoPos: true,
        });
      }
    });

    // Sort descending by date
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashTransactions, sales]);

  // Filtered Cash Ledger
  const filteredLedger = useMemo(() => {
    return allLedgerEntries.filter((item) => {
      if (filterType !== 'ALL' && item.type !== filterType) return false;
      if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNote = item.note.toLowerCase().includes(query);
        const matchCat = item.category.toLowerCase().includes(query);
        const matchUser = (item.createdBy || '').toLowerCase().includes(query);
        if (!matchNote && !matchCat && !matchUser) return false;
      }
      return true;
    });
  }, [allLedgerEntries, filterType, filterCategory, searchQuery]);

  // Open Modal
  const handleOpenModal = (type: 'MASUK' | 'KELUAR') => {
    setModalType(type);
    setCategoryInput(type === 'MASUK' ? 'Modal Awal' : 'Pembelian Bahan');
    setAmountInput('');
    setNoteInput('');
    setPaymentMethodInput('Tunai');
    setIsModalOpen(true);
  };

  // Submit Cash Transaction
  const handleSubmitTransaction = (e: FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Masukkan nominal transaksi yang valid!');
      return;
    }
    if (!noteInput.trim()) {
      alert('Masukkan keterangan transaksi!');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID');

    const newTx: CashTransaction = {
      id: `cash_${Date.now()}`,
      date: `${dateStr} ${timeStr}`,
      type: modalType,
      amount,
      category: categoryInput,
      note: noteInput.trim(),
      createdBy: loggedInUser?.name || 'Kasir Staff',
      paymentMethod: paymentMethodInput,
    };

    onAddCashTransaction(newTx);

    onAddSecurityLog(
      `Pencatatan Kas ${modalType} Rp ${amount.toLocaleString('id-ID')} (${categoryInput}: ${noteInput}) oleh ${loggedInUser?.name || 'Staff'}`,
      modalType === 'KELUAR' && amount > 500000 ? 'Peringatan' : 'Aman'
    );

    setIsModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLedger.length === 0) {
      alert('Tidak ada data aliran kas untuk diekspor!');
      return;
    }

    let csvContent = 'ID,Tanggal,Tipe,Kategori,Keterangan,Metode,Nominal (Rp),Dibuat Oleh\n';
    filteredLedger.forEach((item) => {
      const sanitizedNote = item.note.replace(/"/g, '""');
      csvContent += `"${item.id}","${item.date}","${item.type}","${item.category}","${sanitizedNote}","${item.paymentMethod}","${item.amount}","${item.createdBy || '-'}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Aliran_Kas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Financial Report PDF
  const handleExportPDF = () => {
    exportFinancialReportPDF(
      sales,
      recipes,
      cashTransactions,
      'Bulan Ini',
      settings
    );
  };

  return {
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
    setModalType,
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
    allLedgerEntries,
    filteredLedger,
    handleOpenModal,
    handleSubmitTransaction,
    handleExportCSV,
    handleExportPDF,
  };
}
