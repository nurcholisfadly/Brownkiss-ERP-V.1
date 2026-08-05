import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { Edit3, Eye, History, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

interface RecipeCardProps {
  key?: React.Key;
  recipe: Recipe;
  ingredientMap: Map<string, Ingredient>;
  onToggleStatus: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onViewDetail: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
}

export default function RecipeCard({
  recipe,
  ingredientMap,
  onToggleStatus,
  onEdit,
  onViewDetail,
  onDelete,
}: RecipeCardProps) {
  const outputVal = recipe.batchOutput || 1;
  const isInactive = recipe.status === 'Nonaktif';
  const versionNum = recipe.version || 1;

  // Dynamic HPP calculation based on current ingredients purchase prices!
  const dynamicTotalBatchCost = recipe.ingredients.reduce((total, ri) => {
    const ing = ingredientMap.get(ri.ingredientId);
    if (!ing) return total;
    return total + ing.costPerUnit * ri.qtyNeeded;
  }, 0);

  const dynamicHpp = dynamicTotalBatchCost / outputVal;
  const dynamicMargin = Math.round(((recipe.price - dynamicHpp) / recipe.price) * 100);

  return (
    <div
      className={`recipe-card bg-white border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between ${
        isInactive ? 'border-amber-200 bg-amber-50/20 opacity-80' : 'border-[#E9E2D8]'
      }`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 ${
          isInactive ? 'bg-amber-400' : 'bg-[#8B3350]'
        }`}
      />

      <div>
        {/* Top Badges & Actions */}
        <div className="flex justify-between items-center mb-3.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#8F8377] uppercase bg-[#F3EDE4] px-2 py-0.5 rounded-md">
              {recipe.category || 'BASE'}
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isInactive ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isInactive ? '⏸️ Nonaktif' : '✅ Aktif'}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#8B3350] bg-[#8B3350]/10 px-2 py-0.5 rounded-md">
              v{versionNum}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleStatus(recipe)}
              className="p-1.5 text-[#5C5248] hover:text-[#2A2420] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title={isInactive ? 'Aktifkan Resep' : 'Nonaktifkan Resep (Sembunyikan dari Kasir)'}
            >
              {isInactive ? (
                <ToggleLeft className="w-4 h-4 text-amber-600" />
              ) : (
                <ToggleRight className="w-4 h-4 text-emerald-600" />
              )}
            </button>
            <button
              onClick={() => onEdit(recipe)}
              className="p-1.5 text-[#5C5248] hover:text-[#2A2420] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Edit & Revisi Versi Resep"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewDetail(recipe)}
              className="p-1.5 text-[#5C5248] hover:text-[#2A2420] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Lihat Detail & Histori Versi"
            >
              <Eye className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(recipe)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Hapus Resep"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recipe Name */}
        <div className="recipe-top flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl flex-none">{recipe.emoji}</span>
            <div>
              <p className="recipe-name font-serif font-semibold text-lg text-[#2A2420] leading-tight">
                {recipe.name}
              </p>
              {recipe.history && recipe.history.length > 0 && (
                <span className="text-[10px] text-[#9A8E80] font-mono flex items-center gap-1 mt-0.5">
                  <History className="w-3 h-3" />
                  {recipe.history.length} histori revisi
                </span>
              )}
            </div>
          </div>
          <span className="recipe-margin text-[11px] font-bold text-[#7FA88B] bg-[#EEF4EF] px-2.5 py-1 rounded-full whitespace-nowrap">
            {dynamicMargin}% Margin
          </span>
        </div>

        {/* Costing Breakdowns */}
        <div className="space-y-2 pt-3 border-t border-[#E9E2D8]">
          <div className="recipe-meta flex justify-between text-xs">
            <span className="text-[#9A8E80]">Hasil Standar Batch</span>
            <span className="font-mono font-semibold text-[#2A2420]">
              {outputVal} Pcs
            </span>
          </div>
          <div className="recipe-meta flex justify-between text-xs">
            <span className="text-[#9A8E80]">Modal 1 Batch (Biaya Riil)</span>
            <span className="font-mono font-semibold text-[#2A2420]">
              Rp {Math.round(dynamicTotalBatchCost).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="recipe-meta flex justify-between text-xs pt-1 border-t border-dashed border-[#E9E2D8]">
            <span className="text-[#9A8E80] font-semibold">HPP per Pcs (Unit)</span>
            <span className="font-mono font-bold text-[#2A2420]">
              Rp {Math.round(dynamicHpp).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="recipe-meta flex justify-between text-xs">
            <span className="text-[#8B3350] font-semibold">Harga Jual Final</span>
            <span className="font-mono font-bold text-[#8B3350]">
              Rp {recipe.price.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Ingredients Quick Tags */}
      <div className="mt-4 pt-3.5 border-t border-dashed border-[#E9E2D8]">
        <p className="text-[10px] font-bold text-[#9A8E80] uppercase tracking-wider mb-2">
          Komposisi Bahan Baku ({recipe.ingredients.length})
        </p>
        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
          {recipe.ingredients.map((ri, idx) => {
            const ing = ingredientMap.get(ri.ingredientId);
            if (!ing) return null;
            return (
              <span
                key={idx}
                className="text-[10px] bg-[#F3EDE4] text-[#5C5248] px-2 py-0.5 rounded-md font-medium"
                title={`${ri.qtyNeeded} ${ing.unit}`}
              >
                {ing.name} ({ri.qtyNeeded} {ing.unit})
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
