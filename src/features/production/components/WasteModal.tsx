import React from 'react';
import { ProductionBatch } from '../../../types';
import { AlertCircle, Flame, CheckCircle2 } from 'lucide-react';

interface WasteModalProps {
  targetBatch: ProductionBatch;
  inputWasteQty: string;
  inputWasteReason: string;
  isCompletingBatch: boolean;
  setInputWasteQty: (val: string) => void;
  setInputWasteReason: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function WasteModal({
  targetBatch,
  inputWasteQty,
  inputWasteReason,
  isCompletingBatch,
  setInputWasteQty,
  setInputWasteReason,
  onClose,
  onSubmit,
}: WasteModalProps) {
  const wasteQtyNum = parseInt(inputWasteQty) || 0;
  const usableQty = Math.max(0, targetBatch.qty - wasteQtyNum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-md p-6 shadow-xl animate-rise space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <h3 className="font-serif font-medium text-lg text-[#2A2420] flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600" />
            <span>Selesaikan &amp; Catat Kerusakan (Waste)</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-[#FBF7F2] p-3 rounded-xl border border-[#E9E2D8] space-y-1">
            <p className="text-xs font-bold text-[#2A2420]">
              Batch #{targetBatch.id} - {targetBatch.resep}
            </p>
            <p className="text-xs text-[#5C5248]">
              Total Target Batch: <strong>{targetBatch.qty} Pcs</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Jumlah Produk Rusak / Gagal (Pcs)
            </label>
            <input
              type="number"
              min="0"
              max={targetBatch.qty}
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm font-mono outline-none focus:border-[#8B3350]"
              value={inputWasteQty}
              onChange={(e) => setInputWasteQty(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Alasan Kerusakan / Fail
            </label>
            <select
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm outline-none bg-white cursor-pointer"
              value={inputWasteReason}
              onChange={(e) => setInputWasteReason(e.target.value)}
            >
              <option value="Gosong">🔥 Gosong / Overcooked</option>
              <option value="Bentuk Cacat">🍩 Bentuk Cacat / Patah / Bantat</option>
              <option value="Jatuh / Kontaminasi">🧹 Jatuh / Terkontaminasi</option>
              <option value="Topping Rusak">✨ Glaze / Topping Rusak</option>
              <option value="Lainnya">❓ Lainnya</option>
            </select>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Stok Jadi yang Diteruskan ke Display Kasir:</span>
            </p>
            <p className="font-mono text-xl font-bold text-emerald-800">{usableQty} Pcs</p>
            <p className="text-[10px] text-emerald-700">
              *Hanya donat lulus QC sebanyak {usableQty} Pcs yang akan ditambahkan ke etalase toko.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E9E2D8] rounded-xl text-xs font-semibold text-[#5C5248] hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCompletingBatch}
              className="px-5 py-2 bg-[#8B3350] hover:bg-[#722740] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompletingBatch ? 'Memproses...' : 'Selesaikan Batch & Update Stok'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
