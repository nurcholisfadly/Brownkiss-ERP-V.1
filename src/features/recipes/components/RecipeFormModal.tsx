import React, { useState } from 'react';
import { Recipe, RecipeIngredient, Ingredient, RecipeVersion } from '../../../types';
import { Calculator, Edit3, Info, Layers, Percent } from 'lucide-react';

interface RecipeFormModalProps {
  editingRecipe: Recipe | null; // null if adding new recipe
  ingredients: Ingredient[];
  ingredientMap: Map<string, Ingredient>;
  onClose: () => void;
  onAddRecipe: (newRecipe: Recipe) => void;
  onUpdateRecipe?: (updatedRecipe: Recipe) => void;
}

export default function RecipeFormModal({
  editingRecipe,
  ingredients,
  ingredientMap,
  onClose,
  onAddRecipe,
  onUpdateRecipe,
}: RecipeFormModalProps) {
  const isEditing = !!editingRecipe;

  const [name, setName] = useState(editingRecipe?.name || '');
  const [category, setCategory] = useState<'BASE' | 'TOPPING' | 'PACKAGING' | 'RESELLER' | 'LAINNYA'>(
    editingRecipe?.category || 'BASE'
  );
  const [batchOutput, setBatchOutput] = useState(String(editingRecipe?.batchOutput || 50));
  const [price, setPrice] = useState(String(editingRecipe?.price || 5000));
  const [marginPercent, setMarginPercent] = useState(String(editingRecipe?.margin || 40));
  const [selectedEmoji, setSelectedEmoji] = useState(editingRecipe?.emoji || '🍩');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(
    editingRecipe ? [...editingRecipe.ingredients] : []
  );
  const [versionNote, setVersionNote] = useState('');

  // Temp ingredient entry
  const [tempIngredientId, setTempIngredientId] = useState('');
  const [tempQty, setTempQty] = useState('');

  // Calculate dynamic Total Cost of 1 Batch
  const totalModalBatch = recipeIngredients.reduce((total, ri) => {
    const ing = ingredientMap.get(ri.ingredientId);
    if (!ing) return total;
    return total + ing.costPerUnit * ri.qtyNeeded;
  }, 0);

  // Calculate HPP per unit
  const calculatedHpp = (() => {
    const output = parseFloat(batchOutput) || 1;
    if (output <= 0) return 0;
    return totalModalBatch / output;
  })();

  // Calculate Margin Keuntungan %
  const calculatedMargin = (() => {
    const pr = parseFloat(price) || 0;
    if (pr <= 0 || calculatedHpp <= 0) return 0;
    return Math.round(((pr - calculatedHpp) / pr) * 100);
  })();

  const handleProsesHitungResep = () => {
    const margin = parseFloat(marginPercent) || 0;
    const computedPrice = Math.round(calculatedHpp * (1 + margin / 100));
    setPrice(String(computedPrice));
  };

  const handleAddIngredientToRecipe = () => {
    if (!tempIngredientId || !tempQty || parseFloat(tempQty) <= 0) return;

    if (recipeIngredients.some((ri) => ri.ingredientId === tempIngredientId)) {
      alert('Bahan ini sudah dimasukkan ke resep!');
      return;
    }

    setRecipeIngredients([
      ...recipeIngredients,
      { ingredientId: tempIngredientId, qtyNeeded: parseFloat(tempQty) },
    ]);

    setTempIngredientId('');
    setTempQty('');
  };

  const handleRemoveIngredientFromRecipe = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Silakan masukkan nama produk!');
      return;
    }
    if (recipeIngredients.length === 0) {
      alert('Silakan masukkan minimal 1 bahan baku!');
      return;
    }

    const prVal = parseFloat(price);
    const batchOutVal = parseFloat(batchOutput) || 1;

    if (isNaN(prVal) || prVal <= 0) {
      alert('Harga jual harus lebih besar dari 0!');
      return;
    }

    if (isEditing && editingRecipe) {
      if (!onUpdateRecipe) return;

      const currentVersion = editingRecipe.version || 1;
      const nextVersion = currentVersion + 1;

      const historicalSnapshot: RecipeVersion = {
        version: currentVersion,
        date:
          new Date().toLocaleDateString('id-ID') +
          ' ' +
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        hpp: editingRecipe.hpp,
        price: editingRecipe.price,
        margin: editingRecipe.margin,
        batchOutput: editingRecipe.batchOutput || 1,
        ingredients: [...editingRecipe.ingredients],
        note: versionNote.trim() || `Pembaruan resep ke v${nextVersion}`,
        updatedBy: 'Sistem ERP',
      };

      const updatedRecipe: Recipe = {
        ...editingRecipe,
        name,
        category,
        batchOutput: batchOutVal,
        price: prVal,
        hpp: Math.round(calculatedHpp),
        margin: calculatedMargin,
        emoji: selectedEmoji,
        ingredients: recipeIngredients,
        version: nextVersion,
        history: [historicalSnapshot, ...(editingRecipe.history || [])],
      };

      onUpdateRecipe(updatedRecipe);
      onClose();
      alert(`Resep "${name}" berhasil diperbarui ke versi v${nextVersion}!`);
    } else {
      const newRecipe: Recipe = {
        id: 'r_' + Date.now(),
        name,
        price: prVal,
        hpp: Math.round(calculatedHpp),
        margin: calculatedMargin,
        ingredients: recipeIngredients,
        emoji: selectedEmoji,
        category,
        batchOutput: batchOutVal,
        status: 'Aktif',
        version: 1,
        history: [],
      };

      onAddRecipe(newRecipe);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-xl p-6 shadow-xl animate-rise max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8] mb-4">
          <h3 className="font-serif font-medium text-lg text-[#2A2420] flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit3 className="w-5 h-5 text-[#8B3350]" />
                <span>Edit &amp; Revisi Resep (Ke Version v{(editingRecipe?.version || 1) + 1})</span>
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 text-[#8B3350]" />
                <span>Buat Resep &amp; Kalkulator HPP Baru</span>
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Version Note if Editing */}
          {isEditing && (
            <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                Catatan Revisi Versi (Wajib/Sangat Dianjurkan)
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs outline-none bg-white focus:border-[#8B3350]"
                placeholder="Contoh: Penyesuaian takaran margarin &amp; kenaikan harga jual"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
              />
            </div>
          )}

          {/* Product Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-bold text-[#5C5248] uppercase tracking-wider mb-1.5">
                Nama Produk
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white focus:border-[#8B3350] transition-colors"
                placeholder="Contoh: Donat Matcha Almond"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-[#5C5248] uppercase tracking-wider mb-1.5">
                Kategori Resep
              </label>
              <select
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white focus:border-[#8B3350] transition-colors cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="BASE">BASE (Adonan/Dasar)</option>
                <option value="TOPPING">TOPPING (Sajian/Varian)</option>
                <option value="PACKAGING">PACKAGING (Kemasan)</option>
                <option value="RESELLER">RESELLER (Harga Khusus)</option>
                <option value="LAINNYA">LAINNYA (Lain-lain)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#5C5248] uppercase tracking-wider mb-1.5">
                Emoji
              </label>
              <select
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white focus:border-[#8B3350] transition-colors text-center text-lg cursor-pointer"
                value={selectedEmoji}
                onChange={(e) => setSelectedEmoji(e.target.value)}
              >
                <option value="🍩">🍩</option>
                <option value="🧁">🧁</option>
                <option value="🍪">🍪</option>
                <option value="🍫">🍫</option>
                <option value="🥛">🥛</option>
                <option value="🍵">🍵</option>
                <option value="📦">📦</option>
              </select>
            </div>
          </div>

          {/* Batch Output Capacity */}
          <div>
            <label className="block text-[11px] font-bold text-[#5C5248] uppercase tracking-wider mb-1.5">
              Hasil Standar per Batch (Pcs)
            </label>
            <input
              type="number"
              min="1"
              required
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white focus:border-[#8B3350] font-mono transition-colors"
              placeholder="Contoh: 50"
              value={batchOutput}
              onChange={(e) => setBatchOutput(e.target.value)}
            />
            <span className="text-[10px] text-[#9A8E80] mt-1 block leading-normal">
              Jumlah produk donat jadi yang dihasilkan oleh seluruh kuantitas bahan resep di bawah ini.
            </span>
          </div>

          {/* Ingredients Composition Segment */}
          <div className="border border-[#E9E2D8] p-4 rounded-xl bg-[#FBF7F2]/60 space-y-4">
            <p className="text-xs font-bold text-[#2A2420] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#8B3350]" />
              Bahan Baku yang Dibutuhkan (per Batch)
            </p>

            {recipeIngredients.length === 0 ? (
              <p className="text-xs text-[#9A8E80] italic py-2">Belum ada bahan baku ditambahkan.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recipeIngredients.map((ri, idx) => {
                  const ing = ingredientMap.get(ri.ingredientId);
                  if (!ing) return null;
                  const subTotal = ing.costPerUnit * ri.qtyNeeded;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-white border border-[#E9E2D8] px-3 py-2 rounded-xl shadow-xxs animate-rise"
                    >
                      <span className="font-semibold text-[#2A2420]">
                        {ing.name}{' '}
                        <span className="font-mono text-[#9A8E80] font-normal">
                          ({ri.qtyNeeded} {ing.unit})
                        </span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-[#5C5248]">
                          Rp {Math.round(subTotal).toLocaleString('id-ID')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientFromRecipe(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer px-1"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-12 gap-2 pt-3 border-t border-dashed border-[#E9E2D8] items-center">
              <div className="col-span-6">
                <select
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
                  value={tempIngredientId}
                  onChange={(e) => setTempIngredientId(e.target.value)}
                >
                  <option value="">-- Pilih Bahan Baku --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Rp {ing.costPerUnit.toLocaleString('id-ID')}/{ing.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-4 relative">
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white font-mono"
                  placeholder="Qty Batch"
                  value={tempQty}
                  onChange={(e) => setTempQty(e.target.value)}
                />
                {tempIngredientId && ingredientMap.get(tempIngredientId) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#9A8E80] font-mono">
                    {ingredientMap.get(tempIngredientId)?.unit}
                  </span>
                )}
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={handleAddIngredientToRecipe}
                  className="w-full py-2 bg-[#8B3350] hover:bg-[#B8547A] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Cost and Estimations Panel */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#EEF4EF] border border-[#7FA88B]/30">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#4C7A5C] block">
                Total Modal 1 Batch
              </span>
              <p className="font-mono font-bold text-lg text-[#2A2420]">
                Rp {Math.round(totalModalBatch).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#4C7A5C] block">
                Estimasi HPP per Unit
              </span>
              <p className="font-mono font-bold text-lg text-[#2A2420]">
                Rp {Math.round(calculatedHpp).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Price Calculations & Margin Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-end">
            <div>
              <label className="block text-[11px] font-bold text-[#5C5248] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-[#8B3350]" />
                Margin Keuntungan (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white focus:border-[#8B3350] font-mono transition-colors"
                  placeholder="40"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleProsesHitungResep}
                  className="px-3 py-2 bg-[#2A2420] hover:bg-[#3A322B] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  🧮 Hitung
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5C5248] uppercase tracking-wider mb-1.5">
                Harga Jual Final (Unit / Pcs)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9A8E80]">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white focus:border-[#8B3350] font-mono transition-colors"
                  placeholder="5000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Modal footer controls */}
          <div className="pt-4 border-t border-[#E9E2D8] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#E9E2D8] rounded-xl text-xs font-semibold text-[#5C5248] hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#8B3350] hover:bg-[#B8547A] text-[#FBF7F2] rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              {isEditing ? '💾 SIMPAN VERSI BARU' : '💾 SIMPAN RESEP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
