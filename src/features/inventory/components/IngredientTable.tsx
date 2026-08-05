import React from 'react';
import { Ingredient, IngredientPurchase } from '../../../types';
import { humanFormat, getDisplayPriceUnit } from '../../../utils/formatters';
import { BarChart3, ChevronLeft, ChevronRight, Receipt, Scale, TrendingUp, Trash2 } from 'lucide-react';

interface IngredientTableProps {
  ingredients: Ingredient[];
  paginatedIngredients: Ingredient[];
  filteredCount: number;
  purchases: IngredientPurchase[];
  currentPage: number;
  pageSize: number;
  totalStockPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  onOpenHistory: (ing: Ingredient) => void;
  onOpenAdjustment: (ing: Ingredient, tab: 'RESTOCK' | 'KOREKSI' | 'HARGA') => void;
  onDeleteIngredient?: (ing: Ingredient) => void;
}

export default function IngredientTable({
  ingredients,
  paginatedIngredients,
  filteredCount,
  purchases,
  currentPage,
  pageSize,
  totalStockPages,
  setCurrentPage,
  setPageSize,
  onOpenHistory,
  onOpenAdjustment,
  onDeleteIngredient,
}: IngredientTableProps) {
  return (
    <div className="bg-white border border-[#E9E2D8] rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E9E2D8] bg-[#FBF7F2]/40">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Nama Bahan</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Kategori</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Stok Gudang</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Ambang Min</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Harga Beli Terakhir</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Total Aset</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9A8E80] text-right">Aksi &amp; Histori</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E2D8]">
            {paginatedIngredients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#9A8E80] font-mono">
                  {filteredCount === 0 && ingredients.length > 0
                    ? 'Tidak ada bahan baku yang cocok dengan pencarian.'
                    : 'Tidak ada data bahan baku ditemukan.'}
                </td>
              </tr>
            ) : (
              paginatedIngredients.map((ing) => {
                const isLow = ing.qty <= ing.minQty;
                const isCrit = ing.qty <= ing.minQty * 0.3;
                const totalAsset = ing.qty * ing.costPerUnit;
                const priceInfo = getDisplayPriceUnit(ing.costPerUnit, ing.unit);

                let statusBadge = (
                  <span className="badge ok text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                    Aman
                  </span>
                );
                if (isCrit) {
                  statusBadge = (
                    <span className="badge crit text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                      Kritis
                    </span>
                  );
                } else if (isLow) {
                  statusBadge = (
                    <span className="badge low text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                      Menipis
                    </span>
                  );
                }

                const ingPurchasesCount = purchases.filter((p) => p.ingredientId === ing.id).length;

                return (
                  <tr key={ing.id} className="hover:bg-[#FBF8F3] transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#2A2420] block">{ing.name}</span>
                      <span className="text-[10px] text-[#9A8E80] font-mono uppercase">ID: {ing.id.substring(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4 text-[#5C5248]">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F3EDE4] text-xs font-medium text-[#5C5248]">
                        {ing.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[#2A2420]">
                      <span className={isLow ? 'font-bold text-[#B3432F]' : 'font-medium'}>
                        {humanFormat(ing.qty, ing.unit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#9A8E80] font-mono">
                      {humanFormat(ing.minQty, ing.unit)}
                    </td>
                    <td className="px-6 py-4 text-[#5C5248] font-mono">
                      {priceInfo.priceFormatted} / {priceInfo.unitLabel}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-[#8B3350]">
                      Rp {Math.round(totalAsset).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">{statusBadge}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenHistory(ing)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#8B3350]/10 text-[#8B3350] hover:bg-[#8B3350] hover:text-white cursor-pointer transition-all"
                          title="Lihat Histori Restock & Grafik Perubahan Harga"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Histori &amp; Grafik</span>
                          {ingPurchasesCount > 0 && (
                            <span className="ml-0.5 text-[9px] bg-white/40 text-[#8B3350] px-1.5 py-0.2 rounded-full font-mono">
                              {ingPurchasesCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => onOpenAdjustment(ing, 'RESTOCK')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E9E2D8] bg-white text-[#5C5248] hover:border-[#8B3350] hover:text-[#8B3350] cursor-pointer transition-all"
                          title="Restock (Input Pembelian Nota)"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>

                        <button
                          onClick={() => onOpenAdjustment(ing, 'KOREKSI')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg border border-[#E9E2D8] bg-white text-[#5C5248] hover:border-amber-600 hover:text-amber-600 cursor-pointer transition-all"
                          title="Koreksi / Pemotongan Qty"
                        >
                          <Scale className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenAdjustment(ing, 'HARGA')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg border border-[#E9E2D8] bg-white text-[#5C5248] hover:border-blue-600 hover:text-blue-600 cursor-pointer transition-all"
                          title="Koreksi Harga"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>

                        {onDeleteIngredient && (
                          <button
                            onClick={() => onDeleteIngredient(ing)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                            title="Hapus dari gudang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalStockPages > 1 && (
        <div className="px-6 py-4 bg-[#FBF7F2]/40 border-t border-[#E9E2D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#8F8377]">
            <span>Menampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#E9E2D8] rounded-lg px-2 py-1 text-xs font-semibold text-[#2A2420] outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>dari <strong>{filteredCount}</strong> item bahan</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#E9E2D8] bg-white text-[#5C5248] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBF7F2] cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-medium text-[#2A2420]">
              Halaman {currentPage} dari {totalStockPages}
            </span>

            <button
              disabled={currentPage === totalStockPages}
              onClick={() => setCurrentPage((p) => Math.min(totalStockPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#E9E2D8] bg-white text-[#5C5248] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FBF7F2] cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
