import React, { useState } from 'react';
import { Ingredient, IngredientPurchase } from '../../../types';
import { humanFormat } from '../../../utils/formatters';
import { X } from 'lucide-react';

interface AdjustIngredientModalProps {
  selectedIng: Ingredient;
  initialTab?: 'RESTOCK' | 'KOREKSI' | 'HARGA';
  onClose: () => void;
  onUpdateIngredient: (updated: Ingredient) => void;
  onAddPurchase?: (newPur: Omit<IngredientPurchase, 'id'>) => void;
}

export default function AdjustIngredientModal({
  selectedIng,
  initialTab = 'RESTOCK',
  onClose,
  onUpdateIngredient,
  onAddPurchase,
}: AdjustIngredientModalProps) {
  const [activeTab, setActiveTab] = useState<'RESTOCK' | 'KOREKSI' | 'HARGA'>(initialTab);

  // Helper for unit dropdown options
  const getUnitOptions = (unit: string) => {
    const u = (unit || '').trim().toLowerCase();
    if (u === 'gram' || u === 'g' || u === 'kg') return ['KG', 'Gram'];
    if (u === 'ml' || u === 'mili' || u === 'l' || u === 'liter') return ['Liter', 'Ml'];
    return [unit];
  };

  const getInitialSatNota = (unit: string) => {
    const dbU = (unit || '').trim().toLowerCase();
    if (dbU === 'gram' || dbU === 'g' || dbU === 'kg') return 'KG';
    if (dbU === 'ml' || dbU === 'mili' || dbU === 'l' || dbU === 'liter') return 'Liter';
    return unit;
  };

  // Tab 1: RESTOCK / PEMBELIAN
  const [restockTotalBayar, setRestockTotalBayar] = useState('');
  const [restockQtyNota, setRestockQtyNota] = useState('1');
  const [restockSatNota, setRestockSatNota] = useState(() => getInitialSatNota(selectedIng.unit));
  const [restockIsiBersih, setRestockIsiBersih] = useState('1');

  // Tab 2: KOREKSI / PEMOTONGAN STOK
  const [koreksiType, setKoreksiType] = useState<'TAMBAH' | 'KURANG'>('KURANG');
  const [koreksiQty, setKoreksiQty] = useState('1');
  const [koreksiSat, setKoreksiSat] = useState(() => getInitialSatNota(selectedIng.unit));
  const [koreksiReason, setKoreksiReason] = useState('Pembuangan / Rusak');

  // Tab 3: KOREKSI HARGA BELI
  const [hargaBaru, setHargaBaru] = useState(String(selectedIng.costPerUnit));

  // Live Restock calculations
  const getRestockPreview = () => {
    const dbU = (selectedIng.unit || '').trim().toLowerCase();
    const sN = restockSatNota.toLowerCase();
    let pengali = 1.0;

    if (dbU === 'gram' || dbU === 'g') {
      if (sN === 'kg') pengali = 1000.0;
      else if (sN === 'gram') pengali = 1.0;
    } else if (dbU === 'kg') {
      if (sN === 'kg') pengali = 1.0;
      else if (sN === 'gram') pengali = 0.001;
    } else if (dbU === 'ml' || dbU === 'mili') {
      if (sN === 'liter') pengali = 1000.0;
      else if (sN === 'ml') pengali = 1.0;
    } else if (dbU === 'l' || dbU === 'liter') {
      if (sN === 'liter') pengali = 1.0;
      else if (sN === 'ml') pengali = 0.001;
    }

    const numericQtyNota = parseFloat(restockQtyNota) || 0;
    const numericIsiBersih = parseFloat(restockIsiBersih) || 0;
    const numericTotalBayar = parseFloat(restockTotalBayar) || 0;

    const totalQtyDasar = numericQtyNota * numericIsiBersih * pengali;
    const hargaPerSatuanDasar = totalQtyDasar > 0 ? numericTotalBayar / totalQtyDasar : 0;

    return { totalQtyDasar, hargaPerSatuanDasar };
  };

  // Live Koreksi calculations
  const getKoreksiPreview = () => {
    const dbU = (selectedIng.unit || '').trim().toLowerCase();
    const sN = koreksiSat.toLowerCase();
    let pengali = 1.0;

    if (dbU === 'gram' || dbU === 'g') {
      if (sN === 'kg') pengali = 1000.0;
      else if (sN === 'gram') pengali = 1.0;
    } else if (dbU === 'kg') {
      if (sN === 'kg') pengali = 1.0;
      else if (sN === 'gram') pengali = 0.001;
    } else if (dbU === 'ml' || dbU === 'mili') {
      if (sN === 'liter') pengali = 1000.0;
      else if (sN === 'ml') pengali = 1.0;
    } else if (dbU === 'l' || dbU === 'liter') {
      if (sN === 'liter') pengali = 1.0;
      else if (sN === 'ml') pengali = 0.001;
    }

    const numericQty = parseFloat(koreksiQty) || 0;
    const totalQtyKoreksi = numericQty * pengali;
    const currentQty = selectedIng.qty;

    let newQty = currentQty;
    if (koreksiType === 'TAMBAH') {
      newQty = currentQty + totalQtyKoreksi;
    } else {
      newQty = currentQty - totalQtyKoreksi;
    }

    return { totalQtyKoreksi, newQty: Math.max(0, parseFloat(newQty.toFixed(3))) };
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nowStr =
      new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (activeTab === 'RESTOCK') {
      const { totalQtyDasar, hargaPerSatuanDasar } = getRestockPreview();
      if (totalQtyDasar <= 0) {
        alert('Silakan masukkan jumlah kuantitas yang valid.');
        return;
      }

      const updatedCost = hargaPerSatuanDasar > 0 ? Math.round(hargaPerSatuanDasar) : selectedIng.costPerUnit;

      onUpdateIngredient({
        ...selectedIng,
        qty: parseFloat((selectedIng.qty + totalQtyDasar).toFixed(3)),
        costPerUnit: updatedCost,
      });

      if (onAddPurchase) {
        onAddPurchase({
          ingredientId: selectedIng.id,
          ingredientName: selectedIng.name,
          date: nowStr,
          type: 'RESTOCK',
          qtyAdded: parseFloat(totalQtyDasar.toFixed(3)),
          unit: selectedIng.unit,
          costPerUnit: updatedCost,
          totalCost: parseFloat(restockTotalBayar) || 0,
          note: `Restock ${restockQtyNota} ${restockSatNota} (Isi ${restockIsiBersih})`,
        });
      }
    } else if (activeTab === 'KOREKSI') {
      const { totalQtyKoreksi, newQty } = getKoreksiPreview();
      onUpdateIngredient({
        ...selectedIng,
        qty: newQty,
      });

      if (onAddPurchase) {
        onAddPurchase({
          ingredientId: selectedIng.id,
          ingredientName: selectedIng.name,
          date: nowStr,
          type: 'KOREKSI_STOK',
          qtyAdded: koreksiType === 'TAMBAH' ? totalQtyKoreksi : -totalQtyKoreksi,
          unit: selectedIng.unit,
          costPerUnit: selectedIng.costPerUnit,
          totalCost: 0,
          note: `Koreksi stok (${koreksiType}): ${koreksiReason}`,
        });
      }
    } else if (activeTab === 'HARGA') {
      const numericHarga = parseFloat(hargaBaru) || 0;
      if (numericHarga < 0) {
        alert('Harga tidak boleh kurang dari 0.');
        return;
      }

      onUpdateIngredient({
        ...selectedIng,
        costPerUnit: Math.round(numericHarga),
      });

      if (onAddPurchase) {
        onAddPurchase({
          ingredientId: selectedIng.id,
          ingredientName: selectedIng.name,
          date: nowStr,
          type: 'KOREKSI_HARGA',
          qtyAdded: 0,
          unit: selectedIng.unit,
          costPerUnit: Math.round(numericHarga),
          totalCost: 0,
          note: 'Koreksi penyesuaian harga beli manual',
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E9E2D8] pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#2A2420]">{selectedIng.name}</h3>
            <span className="text-xs text-[#8F8377]">
              Stok Saat Ini: <strong>{humanFormat(selectedIng.qty, selectedIng.unit)}</strong> | Harga Saat Ini: <strong>Rp {selectedIng.costPerUnit.toLocaleString('id-ID')} / {selectedIng.unit}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] p-1 rounded-lg hover:bg-[#FBF7F2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('RESTOCK')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'RESTOCK' ? 'bg-[#8B3350] text-white shadow-xs' : 'text-[#5C5248] hover:bg-white/60'
            }`}
          >
            📥 Restock / Pembelian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('KOREKSI')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'KOREKSI' ? 'bg-[#8B3350] text-white shadow-xs' : 'text-[#5C5248] hover:bg-white/60'
            }`}
          >
            ⚖️ Koreksi Stok
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HARGA')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'HARGA' ? 'bg-[#8B3350] text-white shadow-xs' : 'text-[#5C5248] hover:bg-white/60'
            }`}
          >
            📈 Koreksi Harga
          </button>
        </div>

        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          {/* TAB 1: RESTOCK */}
          {activeTab === 'RESTOCK' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#8F8377] block mb-1">Qty Nota</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={restockQtyNota}
                    onChange={(e) => setRestockQtyNota(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8F8377] block mb-1">Satuan Nota</label>
                  <select
                    value={restockSatNota}
                    onChange={(e) => setRestockSatNota(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs"
                  >
                    {getUnitOptions(selectedIng.unit).map((opt) => (
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
                    step="any"
                    required
                    value={restockIsiBersih}
                    onChange={(e) => setRestockIsiBersih(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8F8377] block mb-1">Total Biaya Nota (IDR)</label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan total nominal uang yang dibayar"
                  value={restockTotalBayar}
                  onChange={(e) => setRestockTotalBayar(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl outline-none focus:border-[#8B3350] bg-white text-sm font-mono font-bold text-[#8B3350]"
                />
              </div>

              {/* Restock Live Calculation Card */}
              <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5C5248]">
                  <span>Tambahan Stok:</span>
                  <span className="font-mono font-bold">+{getRestockPreview().totalQtyDasar} {selectedIng.unit}</span>
                </div>
                <div className="flex justify-between text-[#5C5248]">
                  <span>Stok Setelah Restock:</span>
                  <span className="font-mono font-bold">{selectedIng.qty + getRestockPreview().totalQtyDasar} {selectedIng.unit}</span>
                </div>
                <div className="flex justify-between text-[#8B3350] font-bold border-t border-[#E9E2D8] pt-1">
                  <span>Harga Beli Baru Per Satuan:</span>
                  <span className="font-mono">
                    Rp {Math.round(getRestockPreview().hargaPerSatuanDasar).toLocaleString('id-ID')} / {selectedIng.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KOREKSI STOK */}
          {activeTab === 'KOREKSI' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="koreksiType"
                    checked={koreksiType === 'TAMBAH'}
                    onChange={() => setKoreksiType('TAMBAH')}
                    className="accent-[#8B3350]"
                  />
                  <span className="text-emerald-700">Penambahan Stok (+)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="koreksiType"
                    checked={koreksiType === 'KURANG'}
                    onChange={() => setKoreksiType('KURANG')}
                    className="accent-[#8B3350]"
                  />
                  <span className="text-red-700">Pemotongan / Rusak (-)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#8F8377] block mb-1">Jumlah Koreksi</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={koreksiQty}
                    onChange={(e) => setKoreksiQty(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8F8377] block mb-1">Satuan Koreksi</label>
                  <select
                    value={koreksiSat}
                    onChange={(e) => setKoreksiSat(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E9E2D8] rounded-lg bg-white text-xs"
                  >
                    {getUnitOptions(selectedIng.unit).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8F8377] block mb-1">Alasan Penyesuaian</label>
                <select
                  value={koreksiReason}
                  onChange={(e) => setKoreksiReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl outline-none focus:border-[#8B3350] bg-white text-xs"
                >
                  <option value="Pembuangan / Rusak">Pembuangan / Rusak</option>
                  <option value="Kedaluwarsa">Kedaluwarsa</option>
                  <option value="Hasil Timbang Manual / Opname">Hasil Timbang Manual / Audit Opname</option>
                  <option value="Sampel Dapur">Pengujian Sampel Dapur</option>
                </select>
              </div>

              <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between text-[#5C5248]">
                  <span>Stok Setelah Koreksi:</span>
                  <span className="font-mono font-bold text-[#8B3350]">
                    {getKoreksiPreview().newQty} {selectedIng.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KOREKSI HARGA */}
          {activeTab === 'HARGA' && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-[#2A2420] block mb-1">Harga Beli Baru Per Satuan Dasar ({selectedIng.unit})</label>
                <input
                  type="number"
                  required
                  value={hargaBaru}
                  onChange={(e) => setHargaBaru(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl outline-none focus:border-[#8B3350] bg-white text-sm font-mono font-bold text-[#8B3350]"
                />
              </div>

              <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3 text-xs space-y-1 text-[#5C5248]">
                <p>
                  <strong>Catatan Penyesuaian:</strong> Mengubah harga beli secara manual akan memperbarui kalkulasi HPP pada resep donat yang menggunakan bahan ini.
                </p>
              </div>
            </div>
          )}

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
              Simpan Penyesuaian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
