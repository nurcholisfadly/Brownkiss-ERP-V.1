import React from 'react';
import { ProductionBatch, Recipe } from '../../../types';
import { AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronRight, Layers, Play, User } from 'lucide-react';

interface BatchCardProps {
  key?: React.Key;
  batch: ProductionBatch;
  recipe?: Recipe;
  expandedStagedBatchId: string | null;
  setExpandedStagedBatchId: (id: string | null) => void;
  onStartScheduledBatch: (batch: ProductionBatch) => void;
  onOpenStageModal: (batch: ProductionBatch) => void;
  onOpenWasteModal: (batch: ProductionBatch) => void;
  onCancelBatch: (batch: ProductionBatch) => void;
  onDeleteBatch?: (id: string) => void;
}

export default function BatchCard({
  batch,
  recipe,
  expandedStagedBatchId,
  setExpandedStagedBatchId,
  onStartScheduledBatch,
  onOpenStageModal,
  onOpenWasteModal,
  onCancelBatch,
  onDeleteBatch,
}: BatchCardProps) {
  const isScheduled = batch.status === 'Menunggu';
  const isStaged = batch.isStaged;

  const currentDoneSoFar = batch.stagedLogs?.reduce((sum, l) => sum + l.qtyCompleted, 0) || 0;
  const currentWasteSoFar = batch.stagedLogs?.reduce((sum, l) => sum + l.wasteQty, 0) || 0;
  const targetBatchQty = batch.stageTargetQty || batch.qty;
  const remainingQtyNeeded = Math.max(0, targetBatchQty - currentDoneSoFar);
  const isExpanded = expandedStagedBatchId === batch.id;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden ${
        isScheduled ? 'border-amber-200 bg-amber-50/10' : 'border-[#E9E2D8]'
      }`}
    >
      {/* Top Banner Accent */}
      <div
        className={`absolute top-0 left-0 w-full h-1 ${
          isScheduled ? 'bg-amber-400' : 'bg-[#8B3350]'
        }`}
      />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#8F8377]">#{batch.id}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isScheduled
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isScheduled ? '📅 Menunggu Jadwal' : '🔥 Sedang Diproses'}
            </span>
            {isStaged && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                🔄 Bertahap
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-lg text-[#2A2420] mt-1 flex items-center gap-2">
            <span>{recipe?.emoji || '🍩'}</span>
            <span>{batch.resep}</span>
          </h3>
        </div>

        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-[#8B3350]">{batch.qty} Pcs</p>
          <p className="text-[10px] text-[#8F8377]">Target Batch</p>
        </div>
      </div>

      {/* Operator & Time Info */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FBF7F2] rounded-xl border border-[#E9E2D8] text-xs">
        <div className="flex items-center gap-1.5 text-[#5C5248]">
          <User className="w-3.5 h-3.5 text-[#8B3350]" />
          <span>Operator: <strong>{batch.operator || 'Chef Utama'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[#5C5248] justify-end">
          <Calendar className="w-3.5 h-3.5 text-[#8B3350]" />
          <span>{batch.scheduledDate || batch.date || 'Shift Pagi'}</span>
        </div>
      </div>

      {/* Staged Progress Bar */}
      {isStaged && !isScheduled && (
        <div className="space-y-2 p-3 bg-purple-50/50 border border-purple-200/60 rounded-xl">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-purple-900 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Progres Bertahap:
            </span>
            <span className="font-mono font-bold text-purple-900">
              {currentDoneSoFar} / {targetBatchQty} Pcs ({Math.round((currentDoneSoFar / targetBatchQty) * 100)}%)
            </span>
          </div>

          <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-700 transition-all duration-300"
              style={{ width: `${Math.min(100, (currentDoneSoFar / targetBatchQty) * 100)}%` }}
            />
          </div>

          {batch.stagedLogs && batch.stagedLogs.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedStagedBatchId(isExpanded ? null : batch.id)}
                className="text-[11px] font-semibold text-purple-800 hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>
                  Lihat {batch.stagedLogs.length} Log Riwayat Tahap (Net: {currentDoneSoFar} Pcs, Waste: {currentWasteSoFar} Pcs)
                </span>
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-1.5 text-[11px] font-mono border-t border-purple-200 pt-2">
                  {batch.stagedLogs.map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center text-purple-900 bg-white/80 p-2 rounded-lg border border-purple-100">
                      <span>Tahap #{log.stageNumber} ({log.completedAt})</span>
                      <span>Operator: {log.operator}</span>
                      <span className="font-bold text-emerald-700">+{log.qtyCompleted} Pcs</span>
                      {log.wasteQty > 0 && (
                        <span className="text-red-600 font-semibold">(Waste: {log.wasteQty} {log.wasteReason})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-[#E9E2D8] flex items-center justify-between gap-2">
        <button
          onClick={() => onCancelBatch(batch)}
          className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
          title="Batalkan Batch & Kembalikan Bahan Baku"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Batal</span>
        </button>

        <div className="flex items-center gap-2">
          {isScheduled ? (
            <button
              onClick={() => onStartScheduledBatch(batch)}
              className="px-4 py-2 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Mulai Sekarang (Potong Bahan)</span>
            </button>
          ) : isStaged ? (
            <>
              {remainingQtyNeeded > 0 && (
                <button
                  onClick={() => onOpenStageModal(batch)}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>+ Catat Tahap</span>
                </button>
              )}
              <button
                onClick={() => onOpenWasteModal(batch)}
                className="px-3 py-1.5 bg-[#2A2420] hover:bg-[#3A322B] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selesaikan Batch Final</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenWasteModal(batch)}
              className="px-4 py-2 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selesaikan Batch &amp; Update Display</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
