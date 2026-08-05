import React from 'react';
import { Ingredient, IngredientPurchase } from '../../../types';
import { humanFormat, getDisplayPriceUnit } from '../../../utils/formatters';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface PurchaseJournalTableProps {
  ingredients: Ingredient[];
  purchases: IngredientPurchase[];
  paginatedJournalPurchases: IngredientPurchase[];
  filteredJournalPurchases: IngredientPurchase[];
  journalSearch: string;
  journalIngFilter: string;
  journalTypeFilter: string;
  journalPage: number;
  journalPageSize: number;
  totalJournalPages: number;
  setJournalSearch: React.Dispatch<React.SetStateAction<string>>;
  setJournalIngFilter: React.Dispatch<React.SetStateAction<string>>;
  setJournalTypeFilter: React.Dispatch<React.SetStateAction<string>>;
  setJournalPage: React.Dispatch<React.SetStateAction<number>>;
  setJournalPageSize: React.Dispatch<React.SetStateAction<number>>;
}

export default function PurchaseJournalTable({
  ingredients,
  purchases,
  paginatedJournalPurchases,
  filteredJournalPurchases,
  journalSearch,
  journalIngFilter,
  journalTypeFilter,
  journalPage,
  journalPageSize,
  totalJournalPages,
  setJournalSearch,
  setJournalIngFilter,
  setJournalTypeFilter,
  setJournalPage,
  setJournalPageSize,
}: PurchaseJournalTableProps) {
  const totalPurchaseSpend = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalRestockCount = purchases.filter((p) => p.type === 'RESTOCK' || p.type === 'STOK_AWAL').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xxs">
          <p className="text-xs font-bold text-[#8F8377] uppercase tracking-wider mb-1">Total Pengeluaran Pembelian</p>
          <p className="font-serif text-3xl font-bold text-[#8B3350]">
            Rp {Math.round(totalPurchaseSpend).toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-[#A6957C] block mt-1.5 font-sans">
            Akumulasi modal uang yang dikeluarkan untuk restock &amp; pembelian bahan baku.
          </span>
        </div>

        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xxs">
          <p className="text-xs font-bold text-[#8F8377] uppercase tracking-wider mb-1">Total Transaksi Restock</p>
          <p className="font-serif text-3xl font-bold text-[#2A2420]">
            {totalRestockCount} <span className="text-sm font-sans font-normal text-[#5C5248]">Kali</span>
          </p>
          <span className="text-[10px] text-[#A6957C] block mt-1.5 font-sans">
            Frekuensi kedatangan stok masuk dari pasar / toko bahan kue.
          </span>
        </div>

        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xxs">
          <p className="text-xs font-bold text-[#8F8377] uppercase tracking-wider mb-1">Total Catatan Transaksi</p>
          <p className="font-serif text-3xl font-bold text-emerald-700">
            {purchases.length} <span className="text-sm font-sans font-normal text-[#5C5248]">Entri</span>
          </p>
          <span className="text-[10px] text-[#A6957C] block mt-1.5 font-sans">
            Termasuk stok awal, restock, dan koreksi penyesuaian harga.
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 border border-[#E9E2D8] rounded-2xl shadow-xxs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A8E80]" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-[#E9E2D8] rounded-xl font-sans text-xs outline-none focus:border-[#8B3350] bg-white"
            placeholder="Cari berdasarkan tanggal, nama bahan, atau catatan..."
            value={journalSearch}
            onChange={(e) => {
              setJournalSearch(e.target.value);
              setJournalPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8F8377] font-medium">Bahan:</span>
            <select
              value={journalIngFilter}
              onChange={(e) => {
                setJournalIngFilter(e.target.value);
                setJournalPage(1);
              }}
              className="bg-white border border-[#E9E2D8] rounded-xl px-3 py-2 text-xs font-medium text-[#2A2420] outline-none"
            >
              <option value="SEMUA">Semua Bahan Baku</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8F8377] font-medium">Tipe:</span>
            <select
              value={journalTypeFilter}
              onChange={(e) => {
                setJournalTypeFilter(e.target.value);
                setJournalPage(1);
              }}
              className="bg-white border border-[#E9E2D8] rounded-xl px-3 py-2 text-xs font-medium text-[#2A2420] outline-none"
            >
              <option value="SEMUA">Semua Transaksi</option>
              <option value="RESTOCK">Restock / Pembelian</option>
              <option value="STOK_AWAL">Stok Awal</option>
              <option value="KOREKSI_HARGA">Koreksi Harga</option>
              <option value="KOREKSI_STOK">Koreksi Stok</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Purchases Journal */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E9E2D8] bg-[#FBF7F2]/40">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Tanggal &amp; Waktu</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Nama Bahan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Jenis Transaksi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Jumlah Masuk</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Harga Per Satuan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Total Bayar</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Catatan Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D8]">
              {paginatedJournalPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9A8E80] font-mono">
                    Tidak ada riwayat pembelian bahan baku ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedJournalPurchases.map((p) => {
                  const priceInfo = getDisplayPriceUnit(p.costPerUnit, p.unit);

                  let badge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                      Restock
                    </span>
                  );

                  if (p.type === 'STOK_AWAL') {
                    badge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 inline-flex items-center gap-1">
                        Stok Awal
                      </span>
                    );
                  } else if (p.type === 'KOREKSI_HARGA') {
                    badge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 inline-flex items-center gap-1">
                        Koreksi Harga
                      </span>
                    );
                  } else if (p.type === 'KOREKSI_STOK') {
                    badge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                        Koreksi Stok
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-[#FBF8F3] transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-[#5C5248]">
                        {p.date}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#2A2420]">
                        {p.ingredientName}
                      </td>
                      <td className="px-6 py-4">{badge}</td>
                      <td className="px-6 py-4 font-mono font-medium text-[#2A2420]">
                        {p.qtyAdded > 0 ? `+${humanFormat(p.qtyAdded, p.unit)}` : p.qtyAdded < 0 ? humanFormat(p.qtyAdded, p.unit) : '-'}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#5C5248]">
                        {priceInfo.priceFormatted} / {priceInfo.unitLabel}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#8B3350]">
                        {p.totalCost > 0 ? `Rp ${Math.round(p.totalCost).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#8F8377]">
                        {p.note || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls for Journal Table */}
        {totalJournalPages > 1 && (
          <div className="px-6 py-4 bg-[#FBF7F2]/40 border-t border-[#E9E2D8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#8F8377]">
              <span>Menampilkan</span>
              <select
                value={journalPageSize}
                onChange={(e) => {
                  setJournalPageSize(Number(e.target.value));
                  setJournalPage(1);
                }}
                className="bg-white border border-[#E9E2D8] rounded-lg px-2 py-1 text-xs font-semibold text-[#2A2420] outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>dari <strong>{filteredJournalPurchases.length}</strong> entri jurnal</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={journalPage === 1}
                onClick={() => setJournalPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E9E2D8] bg-white text-[#5C5248] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBF7F2] cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 text-xs font-medium text-[#2A2420]">
                Halaman {journalPage} dari {totalJournalPages}
              </span>

              <button
                disabled={journalPage === totalJournalPages}
                onClick={() => setJournalPage((p) => Math.min(totalJournalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E9E2D8] bg-white text-[#5C5248] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBF7F2] cursor-pointer transition-all"
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
