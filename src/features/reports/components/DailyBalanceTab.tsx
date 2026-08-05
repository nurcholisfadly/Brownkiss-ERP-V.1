import React from 'react';
import { CashTransaction, Sale } from '../../../types';
import { ArrowDownLeft, ArrowUpRight, DollarSign, FileText, TrendingUp, Wallet } from 'lucide-react';

interface DailyBalanceTabProps {
  sales: Sale[];
  cashTransactions: CashTransaction[];
  currencySymbol: string;
  onExportPDF?: () => void;
}

export default function DailyBalanceTab({
  sales,
  cashTransactions,
  currencySymbol,
  onExportPDF,
}: DailyBalanceTabProps) {
  // Manual Inflows
  const totalManualMasuk = cashTransactions
    .filter((t) => t.type === 'MASUK')
    .reduce((sum, t) => sum + t.amount, 0);

  // Manual Outflows
  const totalManualKeluar = cashTransactions
    .filter((t) => t.type === 'KELUAR')
    .reduce((sum, t) => sum + t.amount, 0);

  // POS Revenue Inflows
  const posSales = sales.filter((s) => s.status !== 'Void');
  const posTotalRevenue = posSales.reduce((sum, s) => sum + s.total, 0);

  // Inflows by payment method
  const tunaiInflow =
    cashTransactions
      .filter((t) => t.type === 'MASUK' && t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + t.amount, 0) +
    posSales
      .filter((s) => s.paymentMethod === 'Tunai' || s.paymentMethod === 'Split Payment')
      .reduce((sum, s) => sum + s.total, 0);

  const qrisInflow =
    cashTransactions
      .filter((t) => t.type === 'MASUK' && t.paymentMethod === 'QRIS')
      .reduce((sum, t) => sum + t.amount, 0) +
    posSales
      .filter((s) => s.paymentMethod === 'QRIS')
      .reduce((sum, s) => sum + s.total, 0);

  const transferInflow = cashTransactions
    .filter((t) => t.type === 'MASUK' && t.paymentMethod === 'Transfer Bank')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalManualMasuk + posTotalRevenue - totalManualKeluar;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 border border-[#E9E2D8] rounded-2xl shadow-xs">
        <div>
          <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#8B3350]" />
            <span>Rekapitulasi Saldo Kas Harian</span>
          </h3>
          <p className="text-xs text-[#9A8E80]">
            Pantauan posisi kas fisik (Tunai) dan non-tunai (QRIS &amp; Transfer Bank) real-time.
          </p>
        </div>

        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="px-4 py-2 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak Laporan PDF</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-[#9A8E80] uppercase tracking-wider block">
            Saldo Kas Bersih Total
          </span>
          <p className="font-mono text-2xl font-bold text-[#8B3350]">
            {currencySymbol} {totalBalance.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-[#8F8377]">Posisi Kas Tunai + Non-Tunai</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total Pemasukan
          </span>
          <p className="font-mono text-2xl font-bold text-emerald-700">
            {currencySymbol} {(totalManualMasuk + posTotalRevenue).toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-emerald-800">
            POS ({currencySymbol} {posTotalRevenue.toLocaleString('id-ID')}) + Manual ({currencySymbol} {totalManualMasuk.toLocaleString('id-ID')})
          </span>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Total Pengeluaran
          </span>
          <p className="font-mono text-2xl font-bold text-red-600">
            {currencySymbol} {totalManualKeluar.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-red-800">Operational &amp; Bahan Baku</span>
        </div>

        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-[#9A8E80] uppercase tracking-wider block">
            Porsi Kas Fisik (Tunai)
          </span>
          <p className="font-mono text-2xl font-bold text-[#2A2420]">
            {currencySymbol} {tunaiInflow.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-[#8F8377]">Harus Ada di Laci Kasir</span>
        </div>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-semibold text-base text-[#2A2420]">
          Rincian Saldo Kas berdasarkan Metode Pembayaran
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-[#E9E2D8] rounded-xl bg-[#FBF7F2]/60 space-y-1">
            <span className="text-xs font-bold text-[#5C5248]">💵 Pemasukan Tunai</span>
            <p className="font-mono text-lg font-bold text-[#2A2420]">
              {currencySymbol} {tunaiInflow.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-[#8F8377]">Hasil jualan tunai &amp; setoran kas fisik</p>
          </div>

          <div className="p-4 border border-[#E9E2D8] rounded-xl bg-[#FBF7F2]/60 space-y-1">
            <span className="text-xs font-bold text-[#5C5248]">📱 Pemasukan QRIS / E-Wallet</span>
            <p className="font-mono text-lg font-bold text-indigo-900">
              {currencySymbol} {qrisInflow.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-[#8F8377]">Masuk ke rekening QRIS toko</p>
          </div>

          <div className="p-4 border border-[#E9E2D8] rounded-xl bg-[#FBF7F2]/60 space-y-1">
            <span className="text-xs font-bold text-[#5C5248]">🏦 Pemasukan Transfer Bank</span>
            <p className="font-mono text-lg font-bold text-emerald-900">
              {currencySymbol} {transferInflow.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-[#8F8377]">Transfer langsung dari pelanggan/re seller</p>
          </div>
        </div>
      </div>
    </div>
  );
}
