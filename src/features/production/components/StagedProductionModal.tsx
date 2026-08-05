import React from 'react';
import { ProductionBatch } from '../../../types';
import { CheckCircle2, Layers } from 'lucide-react';

interface StagedProductionModalProps {
  targetBatch: ProductionBatch;
  stageCompletedQty: string;
  stageWasteQty: string;
  stageWasteReason: string;
  stageOperator: string;
  bakerOperators: string[];
  isCompletingBatch: boolean;
  setStageCompletedQty: (val: string) => void;
  setStageWasteQty: (val: string) => void;
  setStageWasteReason: (val: string) => void;
  setStageOperator: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function StagedProductionModal({
  targetBatch,
  stageCompletedQty,
  stageWasteQty,
  stageWasteReason,
  stageOperator,
  bakerOperators,
  isCompletingBatch,
  setStageCompletedQty,
  setStageWasteQty,
  setStageWasteReason,
  setStageOperator,
  onClose,
  onSubmit,
}: StagedProductionModalProps) {
  const currentDoneSoFar = targetBatch.stagedLogs?.reduce((sum, l) => sum + l.qtyCompleted, 0) || 0;
  const targetBatchQty = targetBatch.stageTargetQty || targetBatch.qty;
  const remainingQtyNeeded = Math.max(0, targetBatchQty - currentDoneSoFar);

  const inputCompleted = parseInt(stageCompletedQty) || 0;
  const inputWaste = parseInt(stageWasteQty) || 0;
  const netUsableThisStage = Math.max(0, inputCompleted - inputWaste);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-md p-6 shadow-xl animate-rise space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <h3 className="font-serif font-medium text-lg text-[#2A2420] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8B3350]" />
            <span>Catat Tahap Hasil Produksi (Pencatatan Bertahap)</span>
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
            <div className="flex justify-between text-xs text-[#5C5248]">
              <span>Target Keseluruhan: <strong>{targetBatchQty} Pcs</strong></span>
              <span>Selesai Sejauh Ini: <strong className="text-emerald-700">{currentDoneSoFar} Pcs</strong></span>
            </div>
            <p className="text-xs font-bold text-[#8B3350] pt-1">
              Sisa Target Produksi: {remainingQtyNeeded} Pcs
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Jumlah Selesai Digoreng / Di-topping Tahap Ini (Pcs)
            </label>
            <input
              type="number"
              min="1"
              max={remainingQtyNeeded > 0 ? remainingQtyNeeded : 9999}
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm font-mono outline-none focus:border-[#8B3350]"
              value={stageCompletedQty}
              onChange={(e) => setStageCompletedQty(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
                Waste / Rusak Tahap Ini
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-sm font-mono outline-none focus:border-[#8B3350]"
                value={stageWasteQty}
                onChange={(e) => setStageWasteQty(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
                Alasan Kerusakan
              </label>
              <select
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
                value={stageWasteReason}
                onChange={(e) => setStageWasteReason(e.target.value)}
              >
                <option value="Gosong">🔥 Gosong / Overcooked</option>
                <option value="Bentuk Cacat">🍩 Bentuk Cacat / Patah</option>
                <option value="Jatuh / Kontaminasi">🧹 Jatuh / Terkontaminasi</option>
                <option value="Topping Rusak">✨ Glaze Rusak</option>
                <option value="Tidak Ada">TIDAK ADA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Operator / Baker Penanggung Jawab
            </label>
            <select
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
              value={stageOperator}
              onChange={(e) => setStageOperator(e.target.value)}
            >
              {bakerOperators.map((op, idx) => (
                <option key={idx} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Net Ditambahkan Ke Display Kasir Tahap Ini:</span>
            </p>
            <p className="font-mono text-xl font-bold text-emerald-800">{netUsableThisStage} Pcs</p>
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
              <span>{isCompletingBatch ? 'Memproses...' : 'Simpan Tahap Ini'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
