import React, { useState } from 'react';
import { Recipe, RecipeVersion, Ingredient } from '../../../types';
import { History, RotateCcw } from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe;
  ingredientMap: Map<string, Ingredient>;
  onClose: () => void;
  onRestoreVersion?: (recipe: Recipe, versionItem: RecipeVersion) => void;
}

export default function RecipeDetailModal({
  recipe,
  ingredientMap,
  onClose,
  onRestoreVersion,
}: RecipeDetailModalProps) {
  const [detailTab, setDetailTab] = useState<'komposisi' | 'histori'>('komposisi');

  const outputVal = recipe.batchOutput || 1;
  const totalBatchCost = recipe.ingredients.reduce((total, ri) => {
    const ing = ingredientMap.get(ri.ingredientId);
    if (!ing) return total;
    return total + ing.costPerUnit * ri.qtyNeeded;
  }, 0);
  const hppPerUnit = totalBatchCost / outputVal;
  const margin = Math.round(((recipe.price - hppPerUnit) / recipe.price) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-2xl p-6 shadow-xl animate-rise max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{recipe.emoji}</span>
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#2A2420]">
                {recipe.name}{' '}
                <span className="text-xs font-mono font-bold text-[#8B3350] bg-[#8B3350]/10 px-2 py-0.5 rounded-md">
                  v{recipe.version || 1}
                </span>
              </h3>
              <p className="text-xxs text-[#9A8E80] font-mono uppercase tracking-wide mt-0.5">
                Kategori: {recipe.category || 'BASE'} | Status: {recipe.status || 'Aktif'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] text-xl font-bold cursor-pointer p-1"
          >
            &times;
          </button>
        </div>

        {/* Detail Tabs */}
        <div className="flex border-b border-[#E9E2D8] gap-4">
          <button
            onClick={() => setDetailTab('komposisi')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              detailTab === 'komposisi'
                ? 'border-[#8B3350] text-[#8B3350]'
                : 'border-transparent text-[#9A8E80] hover:text-[#2A2420]'
            }`}
          >
            🥗 Komposisi &amp; HPP Terbaru
          </button>
          <button
            onClick={() => setDetailTab('histori')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              detailTab === 'histori'
                ? 'border-[#8B3350] text-[#8B3350]'
                : 'border-transparent text-[#9A8E80] hover:text-[#2A2420]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histori Versi Resep ({recipe.history?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: KOMPOSISI */}
        {detailTab === 'komposisi' && (
          <div className="space-y-5">
            <div className="overflow-x-auto border border-[#E9E2D8] rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#FBF7F2] border-b border-[#E9E2D8]">
                    <th className="p-3 font-semibold text-[#5C5248]">Nama Bahan</th>
                    <th className="p-3 font-semibold text-[#5C5248] text-right">Kebutuhan (1 Batch)</th>
                    <th className="p-3 font-semibold text-[#5C5248]">Satuan</th>
                    <th className="p-3 font-semibold text-[#5C5248] text-right">Harga Beli Terakhir</th>
                    <th className="p-3 font-semibold text-[#5C5248] text-right">Sub-Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E2D8]">
                  {recipe.ingredients.map((ri, index) => {
                    const ing = ingredientMap.get(ri.ingredientId);
                    if (!ing) return null;
                    const subTotal = ing.costPerUnit * ri.qtyNeeded;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-[#2A2420]">{ing.name}</td>
                        <td className="p-3 text-right font-mono text-[#2A2420]">{ri.qtyNeeded}</td>
                        <td className="p-3 text-[#5C5248]">{ing.unit}</td>
                        <td className="p-3 text-right font-mono text-[#5C5248]">
                          Rp {ing.costPerUnit.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-[#2A2420]">
                          Rp {Math.round(subTotal).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Costing Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#FBF7F2] border border-[#E9E2D8]">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#9A8E80]">Modal 1 Batch</span>
                <p className="font-mono font-bold text-base text-[#8B3350]">
                  Rp {Math.round(totalBatchCost).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="space-y-1 border-l border-[#E9E2D8]/50 pl-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#9A8E80]">Hasil / Batch</span>
                <p className="font-mono font-bold text-base text-[#2A2420]">{outputVal} Pcs</p>
              </div>
              <div className="space-y-1 border-l border-[#E9E2D8]/50 pl-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#9A8E80]">HPP per Unit</span>
                <p className="font-mono font-bold text-base text-[#2A2420]">
                  Rp {Math.round(hppPerUnit).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="space-y-1 border-l border-[#E9E2D8]/50 pl-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#9A8E80]">Margin Keuntungan</span>
                <p className="font-mono font-bold text-base text-[#7FA88B]">{margin}%</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORI VERSI */}
        {detailTab === 'histori' && (
          <div className="space-y-4">
            {!recipe.history || recipe.history.length === 0 ? (
              <div className="p-8 text-center text-[#9A8E80] text-xs font-mono bg-[#FBF7F2] rounded-xl border border-[#E9E2D8]">
                Belum ada catatan histori versi sebelumnya. Resep ini masih menggunakan versi awal (v1).
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {recipe.history.map((verItem, idx) => (
                  <div key={idx} className="p-4 border border-[#E9E2D8] rounded-xl bg-[#FBF7F2]/80 space-y-2">
                    <div className="flex justify-between items-center border-b border-[#E9E2D8] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-[#8B3350] text-white px-2 py-0.5 rounded-md">
                          v{verItem.version}
                        </span>
                        <span className="text-xs font-semibold text-[#2A2420]">
                          {verItem.note || 'Pembaruan resep'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9A8E80] font-mono">{verItem.date}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs font-mono pt-1">
                      <div>
                        <span className="text-[10px] text-[#9A8E80] block">HPP / Unit:</span>
                        <strong>Rp {verItem.hpp.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#9A8E80] block">Harga Jual:</span>
                        <strong>Rp {verItem.price.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#9A8E80] block">Margin:</span>
                        <strong>{verItem.margin}%</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#9A8E80] block">Output Batch:</span>
                        <strong>{verItem.batchOutput} pcs</strong>
                      </div>
                    </div>

                    {onRestoreVersion && (
                      <div className="pt-2 border-t border-dashed border-[#E9E2D8] flex justify-between items-center">
                        <span className="text-[10px] text-[#9A8E80]">
                          {verItem.ingredients.length} bahan baku dikonfigurasi
                        </span>
                        <button
                          onClick={() => onRestoreVersion(recipe, verItem)}
                          className="text-xs text-[#8B3350] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Pulihkan Versi Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2A2420] text-[#F3EDE4] rounded-xl text-xs font-semibold hover:bg-[#3A322B] cursor-pointer"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
