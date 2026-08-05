import React, { useState } from 'react';
import { Sale, ErpSettings } from '../../../types';
import { Download, History, Printer, Search } from 'lucide-react';

interface SalesHistoryTabProps {
  sales: Sale[];
  settings?: ErpSettings;
  currencySymbol: string;
  onOpenReceiptModal: (sale: Sale) => void;
  onOpenVoidModal?: (sale: Sale) => void;
}

export default function SalesHistoryTab({
  sales,
  settings,
  currencySymbol,
  onOpenReceiptModal,
  onOpenVoidModal,
}: SalesHistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Selesai' | 'Void'>('ALL');

  const filteredSales = sales.filter((sale) => {
    if (filterStatus !== 'ALL' && sale.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInv = (sale.invoiceNo || sale.id).toLowerCase().includes(q);
      const matchCust = (sale.customerName || '').toLowerCase().includes(q);
      const matchItems = sale.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchInv && !matchCust && !matchItems) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 border border-[#E9E2D8] rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-1.5 border border-[#E9E2D8] rounded-xl text-xs bg-white font-medium outline-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="ALL">Semua Transaksi</option>
            <option value="Selesai">✅ Transaksi Selesai</option>
            <option value="Void">🚫 Transaksi Void (Batal)</option>
          </select>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#9A8E80] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 border border-[#E9E2D8] rounded-xl text-xs outline-none focus:border-[#8B3350]"
            placeholder="Cari No Invoice / Pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E9E2D8] bg-[#FBF7F2]/60 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">
                <th className="px-6 py-4">No. Invoice</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Rincian Item</th>
                <th className="px-6 py-4">Metode Bayar</th>
                <th className="px-6 py-4 text-right">Total Transaksi</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D8]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#9A8E80] font-mono">
                    Belum ada data riwayat transaksi penjualan.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isVoid = sale.status === 'Void';
                  const itemsSummary = sale.items.map((i) => `${i.qty}x ${i.name}`).join(', ');

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-[#FBF8F3] transition-colors ${isVoid ? 'bg-red-50/20 opacity-70' : ''}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-[#8B3350]">
                        {sale.invoiceNo || sale.id}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#8F8377]">{sale.date}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#2A2420]">
                        {sale.customerName || 'Pelanggan Umum'}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#5C5248] max-w-xs truncate" title={itemsSummary}>
                        {itemsSummary}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#8F8377]">{sale.paymentMethod}</td>
                      <td className="px-6 py-4 font-mono font-bold text-right text-[#2A2420]">
                        {currencySymbol} {sale.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isVoid ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isVoid ? '🚫 Void (Batal)' : '✅ Selesai'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => onOpenReceiptModal(sale)}
                          className="p-1.5 text-[#5C5248] hover:text-[#8B3350] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Nota / Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {!isVoid && onOpenVoidModal && (
                          sale.isClosed ? (
                            <span
                              className="px-2 py-1 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded-lg inline-flex items-center gap-1 cursor-not-allowed"
                              title="Transaksi telah dikunci karena sesi hari ini sudah Tutup Buku (Daily Closing)"
                            >
                              🔒 Locked
                            </span>
                          ) : (
                            <button
                              onClick={() => onOpenVoidModal(sale)}
                              className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
                              title="Otoritas Void Transaksi"
                            >
                              Void
                            </button>
                          )
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
