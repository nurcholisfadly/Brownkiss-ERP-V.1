import React, { useState } from 'react';
import { Ingredient, IngredientPurchase } from '../../../types';
import { Plus, Receipt, X } from 'lucide-react';

interface AddIngredientModalProps {
  onClose: () => void;
  onAddIngredient: (newIng: Omit<Ingredient, 'id'>) => Ingredient | void;
  onAddPurchase?: (newPur: Omit<IngredientPurchase, 'id'>) => void;
}

export default function AddIngredientModal({
  onClose,
  onAddIngredient,
  onAddPurchase,
}: AddIngredientModalProps) {
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Ingredient['category']>('Bahan Kering');
  const [newUnit, setNewUnit] = useState('Gram');
  const [newMinQty, setNewMinQty] = useState('');

  // Purchase detail states
  const [addTotalBayar, setAddTotalBayar] = useState('');
  const [addQtyNota, setAddQtyNota] = useState('1');
  const [addSatNota, setAddSatNota] = useState('KG');
  const [addIsiBersih, setAddIsiBersih] = useState('1');

  const getUnitOptions = (unit: string) => {
    const u = (unit || '').trim().toLowerCase();
    if (u === 'gram' || u === 'g' || u === 'kg') return ['KG', 'Gram'];
    if (u === 'ml' || u === 'mili' || u === 'l' || u === 'liter') return ['Liter', 'Ml'];
    return [unit];
  };

  const getAddPreview = () => {
    const dbU = (newUnit || '').trim().toLowerCase();
    const sN = (addSatNota || '').trim().toLowerCase();
    let pengali = 1.0;

    if (dbU === 'gram' || dbU === 'g') {
      if (sN === 'kg') pengali = 1000.0;
      else if (sN === 'gram') pengali = 1.0;
    } else if (dbU === 'ml' || dbU === 'mili') {
      if (sN === 'liter') pengali = 1000.0;
      else if (sN === 'ml') pengali = 1.0;
    }

    const qtyNota = parseFloat(addQtyNota) || 0;
    const isiBersih = parseFloat(addIsiBersih) || 0;
    const totalBayar = parseFloat(addTotalBayar) || 0;

    const totalQtyDasar = qtyNota * isiBersih * pengali;
    const hargaPerSatuanDasar = totalQtyDasar > 0 ? totalBayar / totalQtyDasar : 0;

    return { totalQtyDasar, hargaPerSatuanDasar };
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newMinQty) return;

    const { totalQtyDasar, hargaPerSatuanDasar } = getAddPreview();

    const created = onAddIngredient({
      name: newName,
      category: newCategory,
      qty: parseFloat(totalQtyDasar.toFixed(3)),
      unit: newUnit,
      minQty: parseFloat(newMinQty),
      costPerUnit: Math.round(hargaPerSatuanDasar),
    });

    const ingredientId = created && 'id' in created ? (created as Ingredient).id : 'ing_' + Date.now();

    if (onAddPurchase) {
      const nowStr =
        new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
        ' ' +
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      onAddPurchase({
        ingredientId,
        ingredientName: newName,
        date: nowStr,
        type: 'STOK_AWAL',
        qtyAdded: parseFloat(totalQtyDasar.toFixed(3)),
        unit: newUnit,
        costPerUnit: Math.round(hargaPerSatuanDasar),
        totalCost: parseFloat(addTotalBayar) || 0,
        note: `Pendaftaran awal stok (${addQtyNota} ${addSatNota})`,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E9E2D8] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8B3350]/10 flex items-center justify-center text-[#8B3350]">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#2A2420]">Tambah Bahan Baku Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] p-1 rounded-lg hover:bg-[#FBF7F2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#2A2420]">
              Nama Bahan Baku <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tepung Cakra Kembar 1 KG"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl outline-none focus:border-[#8B3350] bg-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#2A2420]">Kategori Bahan</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Ingredient['category'])}
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl outline-none focus:border-[#8B3350] bg-white text-xs"
              >
                <option value="Bahan Utama">Bahan Utama</option>
                <option value="Bahan Kering">Bahan Kering</option>
                <option value="Cair">Cair</option>
                <option value="Topping">Topping</option>
                <option value="Segar">Segar</option>
                <option value="Packaging">Packaging</option>
                <option value="Overhead">Overhead</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#2A2420]">Satuan Dasar Resep</label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl outline-none focus:border-[#8B3350] bg-white text-xs"
              >
                <option value="Gram">Gram (g)</option>
                <option value="Ml">Mililiter (ml)</option>
                <option value="Pcs">Pcs</option>
                <option value="Butir">Butir</option>
                <option value="LOT">LOT / Batch</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#2A2420]">
              Ambang Batas Minimum Stok <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder={`Dalam ${newUnit}, misal: 2000`}
              value={newMinQty}
              onChange={(e) => setNewMinQty(e.target.value)}
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl outline-none focus:border-[#8B3350] bg-white text-sm"
            />
          </div>

          <div className="border border-[#E9E2D8] rounded-xl p-4 bg-[#FBF7F2]/60 space-y-3">
            <p className="font-bold text-[#8B3350] flex items-center gap-1.5 text-xs">
              <Receipt className="w-3.5 h-3.5" />
              Rincian Pembelian Nota (Stok Awal)
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-[#8F8377] block mb-1">Qty Beli</label>
                <input
                  type="number"
                  value={addQtyNota}
                  onChange={(e) => setAddQtyNota(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8F8377] block mb-1">Satuan Nota</label>
                <select
                  value={addSatNota}
                  onChange={(e) => setAddSatNota(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs"
                >
                  {getUnitOptions(newUnit).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#8F8377] block mb-1">Isi Bersih Per Kemasan</label>
                <input
                  type="number"
                  value={addIsiBersih}
                  onChange={(e) => setAddIsiBersih(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#8F8377] block mb-1">Total Biaya Nota (IDR)</label>
              <input
                type="number"
                placeholder="Contoh: 160000"
                value={addTotalBayar}
                onChange={(e) => setAddTotalBayar(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs font-mono font-semibold text-[#8B3350]"
              />
            </div>

            <div className="bg-white border border-[#E9E2D8] rounded-lg p-2.5 text-[11px] space-y-1">
              <div className="flex justify-between text-[#5C5248]">
                <span>Total Stok Masuk:</span>
                <span className="font-mono font-bold">
                  {getAddPreview().totalQtyDasar} {newUnit}
                </span>
              </div>
              <div className="flex justify-between text-[#8B3350] font-bold">
                <span>Estimasi Harga Beli Satuan:</span>
                <span className="font-mono">
                  Rp {Math.round(getAddPreview().hargaPerSatuanDasar).toLocaleString('id-ID')} / {newUnit}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E9E2D8] bg-white text-[#5C5248] hover:bg-[#FBF7F2] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#8B3350] hover:bg-[#722840] text-white cursor-pointer shadow-xs"
            >
              Simpan Bahan Baku
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
