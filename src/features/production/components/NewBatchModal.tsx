import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { AlertCircle, Calendar, ChefHat, Layers, User } from 'lucide-react';

interface NewBatchModalProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  bakerOperators: string[];
  selectedRecipeId: string;
  batchQty: string;
  initStatus: 'Diproses' | 'Menunggu';
  scheduledDate: string;
  selectedOperator: string;
  isStaged: boolean;
  stageTargetQty: string;
  errorMsg: string | null;
  previewData: {
    totalQty: number;
    totalBiaya: number;
    totalNilaiJual: number;
    margin: number;
  };
  setSelectedRecipeId: (id: string) => void;
  setBatchQty: (qty: string) => void;
  setInitStatus: (status: 'Diproses' | 'Menunggu') => void;
  setScheduledDate: (date: string) => void;
  setSelectedOperator: (op: string) => void;
  setIsStaged: (staged: boolean) => void;
  setStageTargetQty: (qty: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function NewBatchModal({
  recipes,
  ingredients,
  bakerOperators,
  selectedRecipeId,
  batchQty,
  initStatus,
  scheduledDate,
  selectedOperator,
  isStaged,
  stageTargetQty,
  errorMsg,
  previewData,
  setSelectedRecipeId,
  setBatchQty,
  setInitStatus,
  setScheduledDate,
  setSelectedOperator,
  setIsStaged,
  setStageTargetQty,
  onClose,
  onSubmit,
}: NewBatchModalProps) {
  const recipe = recipes.find((r) => r.id === selectedRecipeId);

  // Check ingredient availability
  const ingredientAvailability = recipe
    ? recipe.ingredients.map((ri) => {
        const ing = ingredients.find((i) => i.id === ri.ingredientId);
        const qtyNeeded = (ri.qtyNeeded / (recipe.batchOutput || 1)) * (parseInt(batchQty) || 0);
        const currentStock = ing ? ing.qty : 0;
        const isSufficient = currentStock >= qtyNeeded;
        return {
          ingName: ing?.name || 'Bahan tidak ditemukan',
          unit: ing?.unit || '',
          qtyNeeded,
          currentStock,
          isSufficient,
        };
      })
    : [];

  const allIngredientsSufficient = ingredientAvailability.every((i) => i.isSufficient);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-lg p-6 shadow-xl animate-rise max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <h3 className="font-serif font-medium text-lg text-[#2A2420] flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#8B3350]" />
            <span>Mulai / Jadwalkan Batch Produksi Dapur</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Pilih Resep Menu Donat
            </label>
            <select
              required
              className="w-full px-3 py-2.5 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white font-medium cursor-pointer focus:border-[#8B3350]"
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
            >
              <option value="">-- Pilih Resep Donat --</option>
              {recipes
                .filter((r) => r.status !== 'Nonaktif')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name} (HPP: Rp {Math.round(r.hpp).toLocaleString('id-ID')})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
                Status Pembuatan
              </label>
              <select
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
                value={initStatus}
                onChange={(e) => setInitStatus(e.target.value as any)}
              >
                <option value="Diproses">🔥 Langsung Proses (Potong Bahan)</option>
                <option value="Menunggu">📅 Jadwalkan Nanti (Menunggu)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
                {initStatus === 'Menunggu' ? 'Tanggal & Jam Jadwal' : 'Jumlah Target Batch (Pcs)'}
              </label>
              {initStatus === 'Menunggu' ? (
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs font-mono outline-none focus:border-[#8B3350]"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              ) : (
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs font-mono outline-none focus:border-[#8B3350]"
                  value={batchQty}
                  onChange={(e) => {
                    setBatchQty(e.target.value);
                    if (isStaged) setStageTargetQty(e.target.value);
                  }}
                />
              )}
            </div>
          </div>

          {initStatus === 'Menunggu' && (
            <div>
              <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
                Jumlah Target Pcs Dihasilkan
              </label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs font-mono outline-none focus:border-[#8B3350]"
                value={batchQty}
                onChange={(e) => {
                  setBatchQty(e.target.value);
                  if (isStaged) setStageTargetQty(e.target.value);
                }}
              />
            </div>
          )}

          {/* Staged Mode Toggle */}
          <div className="bg-[#FBF7F2] p-3 rounded-xl border border-[#E9E2D8] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#2A2420] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#8B3350]" />
                <span>Mode Produksi Bertahap (Staged Output)</span>
              </span>
              <p className="text-[10px] text-[#8F8377]">
                Aktifkan jika batch digoreng/di-topping secara bertahap selama shift
              </p>
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#8B3350] cursor-pointer"
              checked={isStaged}
              onChange={(e) => {
                setIsStaged(e.target.checked);
                if (e.target.checked) setStageTargetQty(batchQty);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#8B3350]" />
              <span>Operator Penanggung Jawab Dapur</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
            >
              {bakerOperators.map((op, idx) => (
                <option key={idx} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Live Cost & Ingredient Availability Preview */}
          {recipe && (
            <div className="space-y-3 pt-2">
              <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3 space-y-2">
                <p className="text-[11px] font-bold text-[#8F8377] uppercase tracking-wider">
                  Estimasi Biaya &amp; Potensi Omzet
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#8F8377] block">Est. Biaya Modal:</span>
                    <strong className="text-[#8B3350]">
                      Rp {Math.round(previewData.totalBiaya).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8F8377] block">Est. Nilai Jual:</span>
                    <strong className="text-[#2A2420]">
                      Rp {Math.round(previewData.totalNilaiJual).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8F8377] block">Margin Omzet:</span>
                    <strong className="text-emerald-700">+{Math.round(previewData.margin)}%</strong>
                  </div>
                </div>
              </div>

              {/* Ingredient Check List */}
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1 text-xs">
                <p className="text-[11px] font-bold text-[#5C5248] uppercase tracking-wider">
                  Cek Ketersediaan Stok Bahan Baku Gudang:
                </p>
                {ingredientAvailability.map((i, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                      i.isSufficient
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900 font-semibold'
                    }`}
                  >
                    <span>{i.ingName}</span>
                    <span className="font-mono">
                      Butuh: {i.qtyNeeded.toFixed(2)} {i.unit} (Ada: {i.currentStock.toFixed(2)} {i.unit}){' '}
                      {i.isSufficient ? '✅' : '❌ KURANG!'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[#E9E2D8] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E9E2D8] rounded-xl text-xs font-semibold text-[#5C5248] hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={recipe ? !allIngredientsSufficient && initStatus === 'Diproses' : true}
              className="px-5 py-2 bg-[#2A2420] hover:bg-[#3A322B] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>
                {initStatus === 'Diproses' ? 'Mulai Produksi (Potong Bahan)' : 'Simpan Jadwal Produksi'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
