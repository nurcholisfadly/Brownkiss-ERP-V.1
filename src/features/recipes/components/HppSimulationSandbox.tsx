import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { CheckCircle, FlaskConical, RotateCcw } from 'lucide-react';

interface HppSimulationSandboxProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  ingredientMap: Map<string, Ingredient>;
  simulatedPrices: Record<string, number>;
  selectedSimRecipeId: string;
  setSimulatedPrices: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setSelectedSimRecipeId: React.Dispatch<React.SetStateAction<string>>;
  handleApplyPercentageChangeToSimulation: (percentage: number) => void;
  handleResetSimulation: () => void;
  handleCommitSimulatedPricesToWarehouse: () => void;
}

export default function HppSimulationSandbox({
  recipes,
  ingredients,
  ingredientMap,
  simulatedPrices,
  selectedSimRecipeId,
  setSimulatedPrices,
  setSelectedSimRecipeId,
  handleApplyPercentageChangeToSimulation,
  handleResetSimulation,
  handleCommitSimulatedPricesToWarehouse,
}: HppSimulationSandboxProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Disclaimer Banner */}
      <div className="bg-[#EEF3EC] border border-[#6F8F6C]/40 p-4 rounded-2xl flex items-start gap-3">
        <FlaskConical className="w-5 h-5 text-[#6F8F6C] flex-none mt-0.5" />
        <div className="text-xs text-[#2A2420] space-y-1">
          <p className="font-bold text-sm text-emerald-900">
            Sandbox Simulasi Dampak Perubahan Harga Bahan Baku
          </p>
          <p className="text-[#5C5248] leading-relaxed">
            Ubah perkiraan harga beli bahan baku di bawah ini untuk melihat simulasi perubahan HPP, margin keuntungan, dan rekomendasi harga jual secara instan.
            <strong> Data asli di Gudang &amp; Database TIDAK akan berubah</strong> kecuali Anda menekan tombol <em>"Terapkan Harga Ke Gudang"</em>.
          </p>
        </div>
      </div>

      {/* Quick Simulation Adjusters */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E2D8]">
          <div>
            <h3 className="font-serif font-semibold text-base text-[#2A2420]">
              Pengaturan Simulasi Harga Bahan Baku
            </h3>
            <p className="text-xs text-[#9A8E80]">
              Gunakan preset persentase kenaikan/penurunan harga pasar atau atur per bahan
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#5C5248]">Preset Inflasi:</span>
            <button
              onClick={() => handleApplyPercentageChangeToSimulation(5)}
              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-mono font-bold cursor-pointer"
            >
              +5%
            </button>
            <button
              onClick={() => handleApplyPercentageChangeToSimulation(10)}
              className="px-2.5 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-xs font-mono font-bold cursor-pointer"
            >
              +10%
            </button>
            <button
              onClick={() => handleApplyPercentageChangeToSimulation(25)}
              className="px-2.5 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-xs font-mono font-bold cursor-pointer"
            >
              +25%
            </button>
            <button
              onClick={() => handleApplyPercentageChangeToSimulation(-10)}
              className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-mono font-bold cursor-pointer"
            >
              -10%
            </button>
            <button
              onClick={handleResetSimulation}
              className="px-3 py-1 border border-[#E9E2D8] text-[#5C5248] hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Ingredient Price Adjustment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
          {ingredients.map((ing) => {
            const currentPrice = ing.costPerUnit;
            const simPrice = simulatedPrices[ing.id] ?? currentPrice;
            const priceDiff = simPrice - currentPrice;
            const pctDiff = currentPrice > 0 ? ((simPrice - currentPrice) / currentPrice) * 100 : 0;

            return (
              <div key={ing.id} className="p-3 border border-[#E9E2D8] rounded-xl bg-[#FBF7F2]/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#2A2420] truncate">{ing.name}</span>
                  <span className="text-[10px] text-[#9A8E80] font-mono">/{ing.unit}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-full px-2 py-1 border border-[#E9E2D8] rounded-lg text-xs font-mono outline-none bg-white focus:border-[#8B3350]"
                    value={simPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSimulatedPrices({
                        ...simulatedPrices,
                        [ing.id]: val,
                      });
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#9A8E80]">Asli: Rp {currentPrice.toLocaleString('id-ID')}</span>
                  {priceDiff !== 0 && (
                    <span className={`font-bold ${priceDiff > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {priceDiff > 0 ? '+' : ''}{pctDiff.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCommitSimulatedPricesToWarehouse}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Terapkan Harga Beli Simulasi Ke Gudang Asli</span>
          </button>
        </div>
      </div>

      {/* Simulation Impact Results Table */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E2D8]">
          <div>
            <h3 className="font-serif font-semibold text-base text-[#2A2420]">
              Hasil Perbandingan HPP &amp; Profit Margin Resep
            </h3>
            <p className="text-xs text-[#9A8E80]">
              Evaluasi kesehatan profitabilitas seluruh menu donat akibat perubahan harga bahan baku
            </p>
          </div>

          <select
            className="px-3 py-1.5 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white font-medium cursor-pointer"
            value={selectedSimRecipeId}
            onChange={(e) => setSelectedSimRecipeId(e.target.value)}
          >
            <option value="ALL">-- Tampilkan Semua Resep --</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.emoji} {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto border border-[#E9E2D8] rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FBF7F2] border-b border-[#E9E2D8]">
                <th className="p-3 font-semibold text-[#5C5248]">Resep Donat</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">Modal Batch Asli</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">Modal Batch Simulasi</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">HPP Asli / Unit</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">HPP Simulasi / Unit</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">Harga Jual saat Ini</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">Margin Asli</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">Margin Simulasi</th>
                <th className="p-3 font-semibold text-[#5C5248] text-right">Saran Harga Jual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D8]">
              {recipes
                .filter((r) => selectedSimRecipeId === 'ALL' || r.id === selectedSimRecipeId)
                .map((recipe) => {
                  const outputVal = recipe.batchOutput || 1;

                  // Original Batch Cost
                  const origBatchCost = recipe.ingredients.reduce((total, ri) => {
                    const ing = ingredientMap.get(ri.ingredientId);
                    if (!ing) return total;
                    return total + ing.costPerUnit * ri.qtyNeeded;
                  }, 0);
                  const origHpp = origBatchCost / outputVal;
                  const origMargin = Math.round(((recipe.price - origHpp) / recipe.price) * 100);

                  // Simulated Batch Cost
                  const simBatchCost = recipe.ingredients.reduce((total, ri) => {
                    const ing = ingredientMap.get(ri.ingredientId);
                    if (!ing) return total;
                    const simPrice = simulatedPrices[ri.ingredientId] ?? ing.costPerUnit;
                    return total + simPrice * ri.qtyNeeded;
                  }, 0);
                  const simHpp = simBatchCost / outputVal;
                  const simMargin = Math.round(((recipe.price - simHpp) / recipe.price) * 100);

                  const hppDiff = simHpp - origHpp;
                  const marginDiff = simMargin - origMargin;

                  // Suggested Price to keep original margin
                  const suggestedPrice = Math.round(simHpp * (1 + origMargin / 100));

                  return (
                    <tr key={recipe.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-semibold text-[#2A2420] flex items-center gap-2">
                        <span>{recipe.emoji}</span>
                        <span>{recipe.name}</span>
                      </td>
                      <td className="p-3 text-right font-mono text-[#5C5248]">
                        Rp {Math.round(origBatchCost).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-[#2A2420]">
                        Rp {Math.round(simBatchCost).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-right font-mono text-[#5C5248]">
                        Rp {Math.round(origHpp).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#2A2420]">
                        Rp {Math.round(simHpp).toLocaleString('id-ID')}
                        {hppDiff !== 0 && (
                          <span
                            className={`text-[10px] block font-medium ${
                              hppDiff > 0 ? 'text-red-600' : 'text-emerald-600'
                            }`}
                          >
                            {hppDiff > 0 ? '+' : ''}Rp {Math.round(hppDiff).toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#8B3350]">
                        Rp {recipe.price.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-right font-mono text-[#5C5248] font-semibold">
                        {origMargin}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            simMargin < 30
                              ? 'bg-red-100 text-red-700'
                              : simMargin < origMargin
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {simMargin}%
                        </span>
                        {marginDiff !== 0 && (
                          <span
                            className={`text-[10px] block font-mono ${
                              marginDiff > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {marginDiff > 0 ? '+' : ''}{marginDiff}%
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/50">
                        Rp {suggestedPrice.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
