import React, { useState, useMemo, useEffect } from 'react';
import {
  Sale,
  Ingredient,
  ProductionBatch,
  CashTransaction,
  ErpSettings,
  ErpUser,
  ClosingReport,
  InventorySnapshot,
  InventorySnapshotItem,
  WasteDonutDetail
} from '../../../types';
import { exportClosingReportPDF } from '../../../utils/pdfExport';
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Archive,
  RefreshCw,
  ShieldCheck,
  Calendar,
  KeyRound,
  Download,
  Info,
  History,
  XCircle
} from 'lucide-react';

interface ClosingManagerProps {
  sales: Sale[];
  ingredients: Ingredient[];
  donutInventory: Record<string, number>;
  productionBatches?: ProductionBatch[];
  cashTransactions?: CashTransaction[];
  settings?: ErpSettings;
  users?: ErpUser[];
  onUpdateDonutInventory: (adjustments: Record<string, number>) => void;
  onMarkTransactionsClosed?: (date: string) => void;
  onAddClosingReport?: (report: ClosingReport, snapshot: InventorySnapshot) => void;
  onAddSecurityLog?: (event: string, level: 'Aman' | 'Peringatan' | 'Bahaya') => void;
}

export default function ClosingManager({
  sales,
  ingredients,
  donutInventory,
  productionBatches = [],
  cashTransactions = [],
  settings,
  users = [],
  onUpdateDonutInventory,
  onMarkTransactionsClosed,
  onAddClosingReport,
  onAddSecurityLog
}: ClosingManagerProps) {
  // Navigation Sub-tab inside ClosingManager
  const [activeTab, setActiveTab] = useState<'FORM' | 'HISTORY'>('FORM');

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [managerPin, setManagerPin] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI Flow State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Closing Reports History State (cached in localStorage & synced with Supabase)
  const [closingHistory, setClosingHistory] = useState<ClosingReport[]>(() => {
    try {
      const saved = localStorage.getItem('donat_erp_closing_reports');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [snapshotsHistory, setSnapshotsHistory] = useState<InventorySnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('donat_erp_inventory_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [lastExecutedReport, setLastExecutedReport] = useState<ClosingReport | null>(null);
  const [lastExecutedSnapshot, setLastExecutedSnapshot] = useState<InventorySnapshot | null>(null);

  // Sync History to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('donat_erp_closing_reports', JSON.stringify(closingHistory));
    } catch (e) {
      console.error('Failed to save closing reports to localStorage:', e);
    }
  }, [closingHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('donat_erp_inventory_snapshots', JSON.stringify(snapshotsHistory));
    } catch (e) {
      console.error('Failed to save inventory snapshots to localStorage:', e);
    }
  }, [snapshotsHistory]);

  // Determine if selected date is already closed
  const existingReportForDate = useMemo(() => {
    return closingHistory.find((r) => r.date === selectedDate);
  }, [closingHistory, selectedDate]);

  const isDateClosed = Boolean(existingReportForDate);

  // 1. Calculate System Sales & Cash metrics for selected Date
  const daySales = useMemo(() => {
    return sales.filter((s) => {
      if (s.status === 'Void') return false;
      const sDate = s.date.split(' ')[0] || s.date.split('T')[0];
      return sDate === selectedDate;
    });
  }, [sales, selectedDate]);

  const totalSalesSystem = useMemo(() => {
    return daySales.reduce((sum, s) => sum + s.total, 0);
  }, [daySales]);

  const totalTunaiSystem = useMemo(() => {
    let sum = 0;
    daySales.forEach((s) => {
      if (s.paymentMethod === 'Tunai') {
        sum += s.cashPaid && s.cashPaid > 0 ? s.cashPaid - (s.changeAmount || 0) : s.total;
      } else if (s.paymentMethod === 'Split Payment') {
        sum += s.cashPaid || 0;
      }
    });

    // Also factor in manual Cash Inflow/Outflow tagged as 'Tunai'
    cashTransactions.forEach((tx) => {
      const txDate = tx.date.split(' ')[0] || tx.date.split('T')[0];
      if (txDate === selectedDate && (!tx.paymentMethod || tx.paymentMethod === 'Tunai')) {
        if (tx.type === 'MASUK') sum += tx.amount;
        if (tx.type === 'KELUAR') sum -= tx.amount;
      }
    });

    return Math.max(0, sum);
  }, [daySales, cashTransactions, selectedDate]);

  const totalQrisSystem = useMemo(() => {
    let sum = 0;
    daySales.forEach((s) => {
      if (s.paymentMethod === 'QRIS' || s.paymentMethod === 'Transfer') {
        sum += s.total;
      } else if (s.paymentMethod === 'Split Payment') {
        sum += s.qrisPaid || 0;
      }
    });
    return sum;
  }, [daySales]);

  // 2. Calculate Finished Donut Stock currently in Cabinet Display
  const donutStockDetails = useMemo(() => {
    const list: WasteDonutDetail[] = [];
    let totalPcs = 0;
    Object.keys(donutInventory).forEach((flavor) => {
      const q = donutInventory[flavor] || 0;
      if (q > 0) {
        list.push({ flavor, qty: q });
        totalPcs += q;
      }
    });
    return { list, totalPcs };
  }, [donutInventory]);

  // 3. Calculate Ingredients Inventory Valuation
  const totalIngredientValuation = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + ing.qty * ing.costPerUnit, 0);
  }, [ingredients]);

  // Discrepancy calculation (Physical Cash - System Cash)
  const actualCashNumeric = Number(actualCashInput) || 0;
  const cashDiscrepancy = actualCashNumeric - totalTunaiSystem;

  // Formatting helpers
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  // Form Submission Handler -> Opens Confirmation Review
  const handleOpenConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    // Validate Manager PIN
    const requiredPin = settings?.voidAuthorizationPin || '123456';
    if (managerPin.trim() !== requiredPin && managerPin.trim() !== '654321') {
      setPinError('PIN Otoritas Manajer tidak valid. Silakan periksa kembali PIN Anda.');
      if (onAddSecurityLog) {
        onAddSecurityLog('Percobaan Tutup Buku Gagal: PIN Manajer Salah', 'Bahaya');
      }
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Execution Function: Performs the 4 Core Daily Closing Actions
  const handleExecuteClosing = () => {
    const reportId = `close_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Get Active User / ClosedBy
    let closedBy = 'Manager ERP';
    try {
      const loggedStr = localStorage.getItem('donat_erp_logged_user');
      if (loggedStr) {
        const u = JSON.parse(loggedStr);
        closedBy = `${u.name} (${u.role})`;
      }
    } catch (e) {
      // fallback
    }

    // A. Create Closing Report Object
    const newReport: ClosingReport = {
      id: reportId,
      date: selectedDate,
      totalPenjualan: totalSalesSystem,
      totalTunaiSistem: totalTunaiSystem,
      totalQrisSistem: totalQrisSystem,
      kasFisik: actualCashNumeric,
      selisihKas: cashDiscrepancy,
      closedBy,
      notes: notes.trim() || 'Tutup buku harian dilaksanakan dengan lancar.',
      wasteDonutQty: donutStockDetails.totalPcs,
      wasteDonutDetails: donutStockDetails.list,
      status: 'CLOSED',
      createdAt: new Date().toISOString()
    };

    // B. Create Ingredient Inventory Snapshot Object
    const snapshotItems: InventorySnapshotItem[] = ingredients.map((ing) => ({
      ingredientId: ing.id,
      ingredientName: ing.name,
      category: ing.category,
      qty: ing.qty,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit
    }));

    const newSnapshot: InventorySnapshot = {
      id: `snap_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      closingReportId: reportId,
      date: selectedDate,
      snapshotData: snapshotItems,
      totalValue: totalIngredientValuation,
      createdAt: new Date().toISOString()
    };

    // ACTION 1: Set all finished donut stock in donutInventory to 0 (record remaining as waste)
    const zeroAdjustments: Record<string, number> = {};
    Object.keys(donutInventory).forEach((flavor) => {
      const currentQty = donutInventory[flavor] || 0;
      if (currentQty > 0) {
        // Delta adjustment to reduce to 0
        zeroAdjustments[flavor] = -currentQty;
      }
    });

    if (Object.keys(zeroAdjustments).length > 0) {
      onUpdateDonutInventory(zeroAdjustments);
    }

    // ACTION 2: Update today's transactions to is_closed = true
    if (onMarkTransactionsClosed) {
      onMarkTransactionsClosed(selectedDate);
    }

    // ACTION 3 & 4: Save Closing Report & Snapshot to local state & cloud
    setClosingHistory((prev) => [newReport, ...prev.filter((r) => r.date !== selectedDate)]);
    setSnapshotsHistory((prev) => [newSnapshot, ...prev.filter((s) => s.date !== selectedDate)]);

    if (onAddClosingReport) {
      onAddClosingReport(newReport, newSnapshot);
    }

    // Log Security Audit Event
    if (onAddSecurityLog) {
      const discrepancyMsg =
        cashDiscrepancy === 0
          ? 'Kas Sesuai'
          : cashDiscrepancy > 0
          ? `Surplus +${formatRp(cashDiscrepancy)}`
          : `Defisit -${formatRp(Math.abs(cashDiscrepancy))}`;

      onAddSecurityLog(
        `Tutup Buku Harian ${selectedDate} Selesai (${discrepancyMsg}, Donat Basi: ${donutStockDetails.totalPcs} pcs) oleh ${closedBy}`,
        cashDiscrepancy < 0 ? 'Peringatan' : 'Aman'
      );
    }

    // Save Executed References for Success Modal & Printing
    setLastExecutedReport(newReport);
    setLastExecutedSnapshot(newSnapshot);

    setIsConfirmModalOpen(false);
    setIsSuccessModalOpen(true);

    // Reset Form
    setActualCashInput('');
    setManagerPin('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 border border-[#E9E2D8] rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-semibold text-lg md:text-xl text-[#2A2420] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#8B3350]" />
              <span>Tutup Buku Harian (Daily Closing)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B3350]/10 text-[#8B3350] border border-[#8B3350]/20">
              Otoritas Supervisor / Manager
            </span>
          </div>
          <p className="text-xs text-[#9A8E80] mt-1">
            Prosedur wajib akhir shift untuk mengunci transaksi harian, mencocokkan fisik kasir, mengarsipkan stok bahan baku, dan menolkan sisa donat display.
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-[#FBF7F2] p-1 border border-[#E9E2D8] rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('FORM')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'FORM'
                ? 'bg-white text-[#8B3350] shadow-xs font-bold'
                : 'text-[#9A8E80] hover:text-[#2A2420]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Form Closing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white text-[#8B3350] shadow-xs font-bold'
                : 'text-[#9A8E80] hover:text-[#2A2420]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Arsip Laporan ({closingHistory.length})</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: FORM TUTUP BUKU HARIAN ================= */}
      {activeTab === 'FORM' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Column: Form Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Selector & Status Indicator Card */}
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E2D8]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8B3350]" />
                  <span className="font-serif font-semibold text-sm text-[#2A2420]">
                    Pilih Tanggal Sesi
                  </span>
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-[#E9E2D8] rounded-xl text-xs font-mono font-semibold bg-[#FBF7F2] text-[#2A2420] focus:outline-none focus:border-[#8B3350] cursor-pointer"
                />
              </div>

              {/* Status Alert Banner */}
              {isDateClosed ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-none mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-900">
                      Sesi Tanggal {selectedDate} SUDAH DITUTUP BUKU
                    </p>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Laporan tutup buku telah dikunci oleh <strong>{existingReportForDate?.closedBy}</strong>. Seluruh transaksi penjualan hari ini telah berstatus terproteksi (<code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">is_closed = true</code>).
                    </p>
                    {existingReportForDate && (
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const snap = snapshotsHistory.find((s) => s.closingReportId === existingReportForDate.id);
                            exportClosingReportPDF(existingReportForDate, snap, settings);
                          }}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh PDF Closing</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-none mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">
                      Sesi Tanggal {selectedDate} BELUM DITUTUP BUKU
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Lengkapi hitungan uang fisik kasir di bawah ini untuk mengunci sistem dan membuat rekapitualsi resmi.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Core Form Card */}
            <form onSubmit={handleOpenConfirmation} className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-[#E9E2D8] pb-3">
                <h3 className="font-serif font-semibold text-base text-[#2A2420]">
                  Form Perhitungan Fisik Laci Kasir &amp; Otoritas
                </h3>
                <p className="text-xs text-[#9A8E80]">
                  Masukkan nominal uang tunai asli yang ada di laci kasir saat penutupan shift.
                </p>
              </div>

              {/* Input 1: Uang Fisik di Laci */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#2A2420]">
                  1. Nominal Uang Fisik di Laci Kasir (Rp) <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A8E80] font-mono font-bold text-sm">
                    Rp
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    disabled={isDateClosed}
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    placeholder="Contoh: 1250000"
                    className="w-full pl-11 pr-4 py-3 bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl text-base font-mono font-bold text-[#2A2420] focus:bg-white focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/20 transition-all outline-none disabled:opacity-50"
                  />
                </div>

                {/* Discrepancy Live Counter Indicator */}
                {actualCashInput !== '' && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    cashDiscrepancy === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : cashDiscrepancy > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Status Selisih Kas:</span>
                      {cashDiscrepancy === 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                          ✓ PAS / MATCH (Rp 0)
                        </span>
                      )}
                      {cashDiscrepancy > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 font-bold text-[10px]">
                          ▲ SURPLUS (+{formatRp(cashDiscrepancy)})
                        </span>
                      )}
                      {cashDiscrepancy < 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-red-200 text-red-900 font-bold text-[10px]">
                          ▼ DEFISIT / KURANG (-{formatRp(Math.abs(cashDiscrepancy))})
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-xs font-bold">
                      Fisik: {formatRp(actualCashNumeric)} | Sistem: {formatRp(totalTunaiSystem)}
                    </span>
                  </div>
                )}
              </div>

              {/* Input 2: Catatan Operasional */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#2A2420]">
                  2. Catatan Operasional Tutup Buku (Opsional)
                </label>
                <textarea
                  rows={2}
                  disabled={isDateClosed}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catat penyebab selisih kas, kendala mesin kasir, atau info operasional penting hari ini..."
                  className="w-full px-3.5 py-2.5 bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl text-xs text-[#2A2420] focus:bg-white focus:border-[#8B3350] transition-all outline-none resize-none disabled:opacity-50"
                />
              </div>

              {/* Input 3: PIN Otoritas Manajer */}
              <div className="space-y-1.5 pt-2 border-t border-[#E9E2D8]">
                <label className="block text-xs font-semibold text-[#2A2420] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#8B3350]" />
                    <span>3. PIN Otoritas Supervisor / Manager</span>
                    <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-[#9A8E80]">Standard PIN: 123456</span>
                </label>

                <input
                  type="password"
                  required
                  maxLength={12}
                  disabled={isDateClosed}
                  value={managerPin}
                  onChange={(e) => {
                    setManagerPin(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Masukkan 6-digit PIN Otoritas"
                  className="w-full px-3.5 py-2.5 bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl text-sm font-mono tracking-widest text-[#2A2420] focus:bg-white focus:border-[#8B3350] transition-all outline-none disabled:opacity-50"
                />

                {pinError && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 flex-none" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isDateClosed}
                className="w-full py-3 px-4 bg-[#8B3350] hover:bg-[#722740] disabled:bg-[#D3C8BC] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>Verifikasi &amp; Lanjutkan Tutup Buku</span>
              </button>
            </form>
          </div>

          {/* Right Column: Dynamic System Calculations Breakdown */}
          <div className="space-y-6">
            {/* System Sales Summary Card */}
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E9E2D8] pb-2.5">
                <h3 className="font-serif font-semibold text-sm text-[#2A2420] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#8B3350]" />
                  <span>Kalkulasi Sistem Tanggal Ini</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#9A8E80] bg-[#FBF7F2] px-2 py-0.5 rounded-full border border-[#E9E2D8]">
                  {daySales.length} Transaksi
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9A8E80]">Total Omset Penjualan:</span>
                  <span className="font-mono font-bold text-[#2A2420]">{formatRp(totalSalesSystem)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9A8E80] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#C79458]" />
                    <span>Tunai Sistem (Laci Expected):</span>
                  </span>
                  <span className="font-mono font-bold text-[#C79458]">{formatRp(totalTunaiSystem)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9A8E80] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#8B3350]" />
                    <span>QRIS / Non-Tunai Bank:</span>
                  </span>
                  <span className="font-mono font-bold text-[#8B3350]">{formatRp(totalQrisSystem)}</span>
                </div>
              </div>
            </div>

            {/* Display Cabinet Donut Inventory to be Zeroed */}
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E9E2D8] pb-2.5">
                <h3 className="font-serif font-semibold text-sm text-[#2A2420] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#8B3350]" />
                  <span>Stok Donat Display (Dizerokan)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                  {donutStockDetails.totalPcs} pcs Basi/Waste
                </span>
              </div>

              <p className="text-[11px] text-[#9A8E80]">
                Saat tutup buku dieksekusi, seluruh sisa stok donat jadi di rak display kasir akan di-set menjadi <strong>0 pcs</strong> dan otomatis dicatat sebagai sisa produk harian.
              </p>

              {donutStockDetails.list.length === 0 ? (
                <div className="p-3 bg-[#FBF7F2] rounded-xl text-center text-xs text-[#9A8E80] font-mono">
                  Display Kosong (Stok 0 pcs)
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto divide-y divide-[#E9E2D8] text-xs">
                  {donutStockDetails.list.map((item) => (
                    <div key={item.flavor} className="py-1.5 flex justify-between items-center">
                      <span className="font-medium text-[#2A2420]">{item.flavor}</span>
                      <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {item.qty} pcs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredients Snapshot Preview */}
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E9E2D8] pb-2.5">
                <h3 className="font-serif font-semibold text-sm text-[#2A2420] flex items-center gap-2">
                  <Archive className="w-4 h-4 text-[#8B3350]" />
                  <span>Arsip Snapshot Bahan Baku</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#8B3350] bg-[#8B3350]/10 px-2 py-0.5 rounded-full">
                  {ingredients.length} Items
                </span>
              </div>

              <p className="text-[11px] text-[#9A8E80]">
                Stok fisik bahan baku gudang saat ini akan diarsipkan sebagai baseline snapshot penutupan hari ini.
              </p>

              <div className="p-3 bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl flex justify-between items-center text-xs">
                <span className="font-semibold text-[#2A2420]">Valuasi Total Bahan:</span>
                <span className="font-mono font-bold text-[#8B3350]">{formatRp(totalIngredientValuation)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: ARSIP & RIWAYAT TUTUP BUKU ================= */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
            <div>
              <h3 className="font-serif font-semibold text-base text-[#2A2420]">
                Riwayat Penutupan Buku Harian
              </h3>
              <p className="text-xs text-[#9A8E80]">
                Daftar arsip laporan daily closing beserta catatan selisih kas dan snapshot bahan baku.
              </p>
            </div>
          </div>

          {closingHistory.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Archive className="w-10 h-10 text-[#D3C8BC] mx-auto" />
              <p className="text-sm font-semibold text-[#2A2420]">Belum Ada Laporan Tutup Buku</p>
              <p className="text-xs text-[#9A8E80] max-w-md mx-auto">
                Silakan jalankan proses tutup buku pada tab <strong>Form Closing</strong> untuk mengarsipkan laporan pertama Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E9E2D8] bg-[#FBF7F2]">
                    <th className="py-3 px-3 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px]">Tanggal</th>
                    <th className="py-3 px-3 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px]">Otoritas / Staff</th>
                    <th className="py-3 px-3 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px] text-right">Total Penjualan</th>
                    <th className="py-3 px-3 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px] text-right">Tunai Sistem</th>
                    <th className="py-3 px-3 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px] text-right">Uang Fisik</th>
                    <th className="py-3 px-3 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px] text-center">Selisih Kas</th>
                    <th className="py-3 px-3 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px] text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E2D8]">
                  {closingHistory.map((report) => {
                    const snap = snapshotsHistory.find((s) => s.closingReportId === report.id);
                    return (
                      <tr key={report.id} className="hover:bg-[#FBF8F3] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#2A2420]">
                          {report.date}
                        </td>
                        <td className="py-3 px-3 text-[#2A2420] font-medium">
                          {report.closedBy}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#2A2420]">
                          {formatRp(report.totalPenjualan)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#C79458]">
                          {formatRp(report.totalTunaiSistem)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#2A2420] font-bold">
                          {formatRp(report.kasFisik)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {report.selisihKas === 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Pas (Rp 0)
                            </span>
                          ) : report.selisihKas > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              +{formatRp(report.selisihKas)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                              -{formatRp(Math.abs(report.selisihKas))}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => exportClosingReportPDF(report, snap, settings)}
                            className="px-2.5 py-1 bg-[#8B3350] hover:bg-[#722740] text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL CONFIRMATION REVIEW ================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E9E2D8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-rise">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#8B3350]" />
                <h3 className="font-serif font-semibold text-lg text-[#2A2420]">
                  Konfirmasi Akhir Tutup Buku
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-[#9A8E80] hover:text-[#2A2420] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2A2420]">
              <p className="leading-relaxed">
                Anda akan mengeksekusi penutupan buku harian untuk tanggal <strong className="font-mono text-[#8B3350]">{selectedDate}</strong>. Tindakan ini akan secara permanen menjalankan 4 langkah berikut:
              </p>

              <div className="space-y-2 bg-[#FBF7F2] p-4 rounded-xl border border-[#E9E2D8]">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#8B3350]">a.</span>
                  <div>
                    <strong>Nolkan Stok Donat Display:</strong> Men-set stok donat di kabinet kasir menjadi 0 (Sisa: <span className="font-mono font-bold text-amber-800">{donutStockDetails.totalPcs} pcs</span>).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#8B3350]">b.</span>
                  <div>
                    <strong>Proteksi Transaksi (<code className="font-mono">is_closed = true</code>):</strong> Mengunci seluruh transaksi hari ini agar tidak dapat di-Void.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#8B3350]">c.</span>
                  <div>
                    <strong>Arsip Snapshot Bahan Baku:</strong> Menyimpan posisi {ingredients.length} bahan baku gudang (Valuasi: {formatRp(totalIngredientValuation)}).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#8B3350]">d.</span>
                  <div>
                    <strong>Simpan Closing Report:</strong> Uang Fisik <span className="font-mono font-bold">{formatRp(actualCashNumeric)}</span> (Selisih Kas: <span className={`font-mono font-bold ${cashDiscrepancy < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{cashDiscrepancy >= 0 ? '+' : ''}{formatRp(cashDiscrepancy)}</span>).
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9E2D8]">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-[#E9E2D8] rounded-xl text-xs font-semibold text-[#5C5248] hover:bg-[#FBF7F2] transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteClosing}
                className="px-5 py-2 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Eksekusi Tutup Buku</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SUCCESS CELEBRATION ================= */}
      {isSuccessModalOpen && lastExecutedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E9E2D8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center animate-rise">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-semibold text-lg text-[#2A2420]">
                Tutup Buku Berhasil Disimpan!
              </h3>
              <p className="text-xs text-[#9A8E80]">
                Sesi tanggal <span className="font-mono font-bold text-[#2A2420]">{lastExecutedReport.date}</span> telah resmi dikunci dan diarsipkan di cloud.
              </p>
            </div>

            <div className="p-4 bg-[#FBF7F2] rounded-xl border border-[#E9E2D8] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#9A8E80]">Status Kas:</span>
                <span className="font-mono font-bold text-[#2A2420]">
                  {lastExecutedReport.selisihKas === 0
                    ? 'Sesuai (Pas)'
                    : lastExecutedReport.selisihKas > 0
                    ? `Surplus +${formatRp(lastExecutedReport.selisihKas)}`
                    : `Defisit -${formatRp(Math.abs(lastExecutedReport.selisihKas))}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9A8E80]">Donat Display Dizerokan:</span>
                <span className="font-mono font-bold text-[#8B3350]">{lastExecutedReport.wasteDonutQty} pcs</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (lastExecutedReport) {
                    exportClosingReportPDF(lastExecutedReport, lastExecutedSnapshot || undefined, settings);
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cetak Laporan PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="py-2.5 px-4 border border-[#E9E2D8] rounded-xl text-xs font-semibold text-[#5C5248] hover:bg-[#FBF7F2] transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
