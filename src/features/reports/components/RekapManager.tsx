import React, { useState, useMemo } from 'react';
import { Sale, Recipe, ErpSettings } from '../../../types';
import { DEFAULT_CUSTOMER } from '../../../constants/defaults';
import { exportSalesReportPDF } from '../../../utils/pdfExport';
import { 
  Download, 
  FileText,
  Search, 
  Calendar, 
  Filter, 
  ShoppingBag, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft,
  RotateCcw
} from 'lucide-react';

interface RekapManagerProps {
  sales: Sale[];
  recipes: Recipe[];
  settings?: ErpSettings;
}

export default function RekapManager({ sales, recipes, settings }: RekapManagerProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('Semua');
  const [datePeriod, setDatePeriod] = useState<'semua' | 'hari_ini' | '7_hari' | '30_hari' | 'custom'>('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter Sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = s.id.toLowerCase().includes(q);
        const matchInv = s.invoiceNo?.toLowerCase().includes(q);
        const matchCust = s.customerName?.toLowerCase().includes(q);
        const matchItem = s.items.some((it) => it.name.toLowerCase().includes(q));
        if (!matchId && !matchInv && !matchCust && !matchItem) {
          return false;
        }
      }

      // 2. Payment Method
      if (paymentFilter !== 'Semua') {
        if (s.paymentMethod !== paymentFilter) {
          return false;
        }
      }

      // 3. Date Filter
      if (datePeriod !== 'semua') {
        const saleDate = new Date(s.date);
        const now = new Date();

        if (datePeriod === 'hari_ini') {
          const isToday =
            saleDate.getDate() === now.getDate() &&
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (datePeriod === '7_hari') {
          const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7 || diffDays < 0) return false;
        } else if (datePeriod === '30_hari') {
          const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30 || diffDays < 0) return false;
        } else if (datePeriod === 'custom') {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (saleDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (saleDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [sales, searchQuery, paymentFilter, datePeriod, startDate, endDate]);

  // Reset page when filters change
  const handleFilterChange = (setter: () => void) => {
    setter();
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPaymentFilter('Semua');
    setDatePeriod('semua');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + pageSize);

  // Statistics calculation on filtered set (only non-void sales counted)
  const validFilteredSales = useMemo(() => filteredSales.filter((s) => s.status !== 'Void'), [filteredSales]);
  const totalSalesAmount = validFilteredSales.reduce((sum, s) => sum + s.total, 0);
  const avgSale = validFilteredSales.length > 0 ? Math.round(totalSalesAmount / validFilteredSales.length) : 0;
  const totalTransactions = validFilteredSales.length;

  const itemCounts: Record<string, number> = {};
  validFilteredSales.forEach((s) => {
    s.items.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });

  let bestSellerName = '-';
  let bestSellerQty = 0;
  Object.keys(itemCounts).forEach((name) => {
    if (itemCounts[name] > bestSellerQty) {
      bestSellerQty = itemCounts[name];
      bestSellerName = name;
    }
  });

  // Export CSV functionality with Formula Injection Protection & UTF-8 BOM Blob
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor!');
      return;
    }

    const sanitizeCSVValue = (val: string | number | undefined) => {
      const str = String(val ?? '');
      // Prevent CSV/Formula Injection (=, +, -, @, \t, \r)
      const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      // Escape double quotes
      return `"${sanitized.replace(/"/g, '""')}"`;
    };

    const headers = ['ID Transaksi', 'No Invoice', 'Waktu', 'Nama Pelanggan', 'Rincian Item', 'Total (IDR)', 'Ongkir (IDR)', 'Metode Pembayaran', 'Status Transaksi', 'Alasan Void'];
    const rows = filteredSales.map((s) => {
      const itemsStr = s.items.map((item) => `${item.name} (${item.qty} pcs @ Rp ${item.price})`).join(' | ');
      return [
        sanitizeCSVValue(s.id),
        sanitizeCSVValue(s.invoiceNo || '-'),
        sanitizeCSVValue(s.date),
        sanitizeCSVValue(s.customerName || DEFAULT_CUSTOMER.name),
        sanitizeCSVValue(itemsStr),
        sanitizeCSVValue(s.total),
        sanitizeCSVValue(s.shippingCost || 0),
        sanitizeCSVValue(s.paymentMethod),
        sanitizeCSVValue(s.status === 'Void' ? 'DIBATALKAN' : 'Selesai'),
        sanitizeCSVValue(s.voidReason || '-')
      ];
    });

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_penjualan_donat_erp_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export PDF functionality
  const handleExportPDF = () => {
    if (filteredSales.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor ke PDF!');
      return;
    }
    let periodText = 'Semua Periode';
    if (datePeriod === 'hari_ini') periodText = 'Hari Ini';
    else if (datePeriod === '7_hari') periodText = '7 Hari Terakhir';
    else if (datePeriod === '30_hari') periodText = '30 Hari Terakhir';
    else if (datePeriod === 'custom') periodText = `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`;

    exportSalesReportPDF(filteredSales, periodText, settings);
  };

  return (
    <div className="space-y-6">
      {/* 4 Stats Grid in Rekap View */}
      <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-white border border-[#E9E2D8] rounded-xl p-5 shadow-xs">
          <p className="stat-label text-xs text-[#9A8E80] mb-2 font-medium flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            Total Penjualan {datePeriod !== 'semua' ? '(Filtered)' : 'Keseluruhan'}
          </p>
          <p className="stat-value font-serif font-semibold text-2xl text-[#2A2420]">
            Rp {totalSalesAmount.toLocaleString('id-ID')}
          </p>
          <span className="stat-delta text-[11px] font-bold text-[#7FA88B] mt-1 block">
            ▲ Terus tumbuh secara organik
          </span>
        </div>

        <div className="stat-card bg-white border border-[#E9E2D8] rounded-xl p-5 shadow-xs">
          <p className="stat-label text-xs text-[#9A8E80] mb-2 font-medium flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5" />
            Rata-rata Keranjang Belanja
          </p>
          <p className="stat-value font-serif font-semibold text-2xl text-[#2A2420]">
            Rp {avgSale.toLocaleString('id-ID')}
          </p>
          <span className="stat-delta text-[11px] font-bold text-[#7FA88B] mt-1 block">
            ▲ Kualitas transaksi stabil
          </span>
        </div>

        <div className="stat-card bg-white border border-[#E9E2D8] rounded-xl p-5 shadow-xs">
          <p className="stat-label text-xs text-[#9A8E80] mb-2 font-medium flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-[#8B3350]" />
            Produk Terlaris
          </p>
          <p className="stat-value font-serif font-semibold text-lg text-[#2A2420] truncate leading-7">
            {bestSellerName}
          </p>
          <span className="stat-delta text-[11px] font-mono text-[#5C5248] mt-1 block">
            {bestSellerQty} pcs terjual
          </span>
        </div>

        <div className="stat-card bg-white border border-[#E9E2D8] rounded-xl p-5 shadow-xs">
          <p className="stat-label text-xs text-[#9A8E80] mb-2 font-medium flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Total Transaksi Selesai
          </p>
          <p className="stat-value font-serif font-semibold text-2xl text-[#2A2420]">
            {totalTransactions} Transaksi
          </p>
          <span className="stat-delta text-[11px] font-bold text-[#7FA88B] mt-1 block">
            ▲ 100% tingkat penyelesaian
          </span>
        </div>
      </div>

      {/* Sales Transactions Log */}
      <div className="panel-card bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="panel-head flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="panel-title font-serif font-semibold text-base text-[#2A2420]">
              Jurnal Rekapitulasi Penjualan Harian
            </h3>
            <p className="panel-sub text-xs text-[#9A8E80]">
              Riwayat lengkap pencatatan pos ritel waktu nyata
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="btn-ghost text-xs font-semibold border border-[#E9E2D8] px-3.5 py-2 rounded-xl text-[#2A2420] bg-white hover:border-[#8B3350] hover:text-[#8B3350] transition-all cursor-pointer flex items-center gap-1.5"
              title="Ekspor format CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-[#5C5248]" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-white bg-[#8B3350] hover:bg-[#722840] shadow-xs transition-all cursor-pointer flex items-center gap-2"
              title="Unduh Laporan Format PDF Resmi"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Laporan PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FBF7F2] p-3.5 rounded-xl border border-[#E9E2D8]">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8E80]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
              placeholder="Cari ID, invoice, item..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E9E2D8] rounded-lg focus:border-[#8B3350] focus:outline-none transition-colors"
            />
          </div>

          {/* Date Period Filter */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8E80] pointer-events-none" />
            <select
              value={datePeriod}
              onChange={(e) => handleFilterChange(() => setDatePeriod(e.target.value as any))}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E9E2D8] rounded-lg focus:border-[#8B3350] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="semua">Semua Periode</option>
              <option value="hari_ini">Hari Ini</option>
              <option value="7_hari">7 Hari Terakhir</option>
              <option value="30_hari">30 Hari Terakhir</option>
              <option value="custom">Rentang Tanggal Custom</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8E80] pointer-events-none" />
            <select
              value={paymentFilter}
              onChange={(e) => handleFilterChange(() => setPaymentFilter(e.target.value))}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E9E2D8] rounded-lg focus:border-[#8B3350] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="Semua">Semua Metode Bayar</option>
              <option value="Tunai">Tunai</option>
              <option value="QRIS">QRIS</option>
              <option value="Transfer">Transfer</option>
              <option value="EDC">EDC</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-1.5 px-3 bg-white border border-[#E9E2D8] hover:border-[#8B3350] hover:text-[#8B3350] rounded-lg text-xs font-semibold text-[#5C5248] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filter
            </button>
          </div>

          {/* Custom Date Inputs if Custom selected */}
          {datePeriod === 'custom' && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 grid grid-cols-2 gap-3 pt-2 border-t border-[#E9E2D8]">
              <div>
                <label className="text-[10px] text-[#9A8E80] font-medium mb-1 block">Dari Tanggal:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleFilterChange(() => setStartDate(e.target.value))}
                  className="w-full px-3 py-1 text-xs bg-white border border-[#E9E2D8] rounded-lg focus:border-[#8B3350] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#9A8E80] font-medium mb-1 block">Sampai Tanggal:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleFilterChange(() => setEndDate(e.target.value))}
                  className="w-full px-3 py-1 text-xs bg-white border border-[#E9E2D8] rounded-lg focus:border-[#8B3350] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto border border-[#E9E2D8] rounded-xl">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#FBF7F2]/40 border-b border-[#E9E2D8]">
                <th className="px-4 py-3 font-bold text-[#9A8E80] uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 font-bold text-[#9A8E80] uppercase tracking-wider">Transaksi ID</th>
                <th className="px-4 py-3 font-bold text-[#9A8E80] uppercase tracking-wider">Rincian Item Donat</th>
                <th className="px-4 py-3 font-bold text-[#9A8E80] uppercase tracking-wider text-right">Pendapatan</th>
                <th className="px-4 py-3 font-bold text-[#9A8E80] uppercase tracking-wider text-center">Metode Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D8]">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#9A8E80] italic">
                    {filteredSales.length === 0 && sales.length > 0
                      ? 'Tidak ada transaksi yang cocok dengan filter.'
                      : 'Belum ada transaksi terekam pada sistem.'}
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  const isVoided = sale.status === 'Void';
                  return (
                    <tr key={sale.id} className={`transition-colors ${isVoided ? 'bg-red-50/20 hover:bg-red-50/30' : 'hover:bg-[#FBF8F3]'}`}>
                      <td className="px-4 py-3 text-[#5C5248] font-mono">{sale.date}</td>
                      <td className="px-4 py-3 font-mono">
                        <div className="font-semibold text-[#2A2420]">{sale.invoiceNo || sale.id}</div>
                        {sale.customerName && (
                          <span className="text-[10px] text-[#9A8E80] block font-sans">
                            Plgn: {sale.customerName}
                          </span>
                        )}
                        {isVoided && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">
                            DIBATALKAN
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {sale.items.map((it, idx) => (
                            <span key={idx} className={`font-medium ${isVoided ? 'line-through text-[#9A8E80]' : 'text-[#2A2420]'}`}>
                              {it.name}{' '}
                              <span className="text-xxs font-mono text-[#9A8E80] bg-[#F3EDE4] px-1.5 py-0.5 rounded ml-1">
                                {it.qty} pcs
                              </span>
                            </span>
                          ))}
                          {isVoided && (
                            <div className="text-[10px] text-red-600 font-semibold mt-1">
                              Alasan Void: "{sale.voidReason || '-'}" {sale.voidedBy ? `(oleh ${sale.voidedBy})` : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={isVoided ? 'line-through text-red-400 font-normal' : 'text-[#2A2420]'}>
                          Rp {sale.total.toLocaleString('id-ID')}
                        </span>
                        {isVoided && (
                          <span className="block text-[10px] text-red-600 font-sans font-bold">
                            Rp 0 (Void)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center space-y-1">
                        <span
                          className={`badge inline-block text-xxs font-bold px-2 py-0.5 rounded-full ${
                            sale.paymentMethod === 'QRIS'
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                        {isVoided && (
                          <span className="badge block text-xxs font-bold px-2 py-0.5 rounded-full text-red-700 bg-red-100 border border-red-200">
                            DIBATALKAN
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredSales.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#5C5248]">
            <div className="flex items-center gap-2">
              <span>Tampilkan per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E9E2D8] rounded-md px-2 py-1 text-xs focus:border-[#8B3350] focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-[#9A8E80] ml-2">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} dari {totalItems} transaksi
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#E9E2D8] bg-white text-[#2A2420] hover:border-[#8B3350] disabled:opacity-40 disabled:hover:border-[#E9E2D8] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-mono text-xs text-[#2A2420] font-semibold">
                Halaman {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#E9E2D8] bg-white text-[#2A2420] hover:border-[#8B3350] disabled:opacity-40 disabled:hover:border-[#E9E2D8] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
