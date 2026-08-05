import React from 'react';
import { CashTransaction } from '../../../types';
import { ArrowDownLeft, ArrowUpRight, Download, FileText, Filter, Search, Trash2 } from 'lucide-react';

interface CashFlowTabProps {
  filteredLedger: (CashTransaction & { isAutoPos?: boolean })[];
  filterType: 'ALL' | 'MASUK' | 'KELUAR';
  filterCategory: string;
  searchQuery: string;
  currencySymbol: string;
  setFilterType: (val: 'ALL' | 'MASUK' | 'KELUAR') => void;
  setFilterCategory: (val: string) => void;
  setSearchQuery: (val: string) => void;
  onOpenModal: (type: 'MASUK' | 'KELUAR') => void;
  onExportCSV: () => void;
  onExportPDF?: () => void;
  onDeleteTransaction: (id: string) => void;
}

export default function CashFlowTab({
  filteredLedger,
  filterType,
  filterCategory,
  searchQuery,
  currencySymbol,
  setFilterType,
  setFilterCategory,
  setSearchQuery,
  onOpenModal,
  onExportCSV,
  onExportPDF,
  onDeleteTransaction,
}: CashFlowTabProps) {
  return (
    <div className="space-y-4">
      {/* Top Action & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 border border-[#E9E2D8] rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Type */}
          <select
            className="px-3 py-1.5 border border-[#E9E2D8] rounded-xl text-xs bg-white font-medium cursor-pointer outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="ALL">All Semua Transaksi</option>
            <option value="MASUK">💚 Kas Masuk Only</option>
            <option value="KELUAR">🔴 Kas Keluar Only</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#9A8E80] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-8 pr-3 py-1.5 border border-[#E9E2D8] rounded-xl text-xs outline-none focus:border-[#8B3350]"
              placeholder="Cari keterangan / staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenModal('MASUK')}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Kas Masuk</span>
          </button>

          <button
            onClick={() => onOpenModal('KELUAR')}
            className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>- Kas Keluar</span>
          </button>

          <button
            onClick={onExportCSV}
            className="px-3 py-2 border border-[#E9E2D8] text-[#5C5248] hover:bg-gray-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="px-3 py-2 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak PDF Laporan</span>
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E9E2D8] bg-[#FBF7F2]/60 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">
                <th className="px-6 py-4">Tanggal &amp; Waktu</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Keterangan / Rincian</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D8]">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9A8E80] font-mono">
                    Belum ada catatan aliran kas.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => {
                  const isMasuk = item.type === 'MASUK';
                  return (
                    <tr key={item.id} className="hover:bg-[#FBF8F3] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[#8F8377]">{item.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isMasuk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isMasuk ? '⬆️ Kas Masuk' : '⬇️ Kas Keluar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#2A2420] text-xs">{item.category}</td>
                      <td className="px-6 py-4 text-xs text-[#5C5248] max-w-xs truncate" title={item.note}>
                        {item.note}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#8F8377]">{item.paymentMethod}</td>
                      <td
                        className={`px-6 py-4 font-mono font-bold text-right ${
                          isMasuk ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isMasuk ? '+' : '-'}{currencySymbol} {item.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.isAutoPos ? (
                          <span className="text-[10px] text-[#9A8E80] font-mono italic">Otomatis POS</span>
                        ) : (
                          <button
                            onClick={() => onDeleteTransaction(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
