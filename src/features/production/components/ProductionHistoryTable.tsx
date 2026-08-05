import React from 'react';
import { ProductionBatch } from '../../../types';

interface ProductionHistoryTableProps {
  completedBatches: ProductionBatch[];
  onDeleteBatch?: (id: string) => void;
}

export default function ProductionHistoryTable({
  completedBatches,
  onDeleteBatch,
}: ProductionHistoryTableProps) {
  return (
    <div className="bg-white border border-[#E9E2D8] rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E9E2D8] bg-[#FBF7F2]/40 text-xs font-bold uppercase tracking-wider text-[#9A8E80]">
              <th className="px-6 py-4">ID Batch</th>
              <th className="px-6 py-4">Resep Donat</th>
              <th className="px-6 py-4">Jumlah Target</th>
              <th className="px-6 py-4">Net Usable (Lulus QC)</th>
              <th className="px-6 py-4">Waste / Rusak</th>
              <th className="px-6 py-4">Operator</th>
              <th className="px-6 py-4">Waktu Selesai</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E2D8]">
            {completedBatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#9A8E80] font-mono">
                  Belum ada riwayat batch produksi selesai atau dibatalkan.
                </td>
              </tr>
            ) : (
              completedBatches.map((batch) => {
                const isCancelled = batch.status === 'Batal';
                const totalWaste = batch.wasteQty || 0;
                const netUsable = batch.usableQty || (isCancelled ? 0 : batch.qty - totalWaste);

                return (
                  <tr key={batch.id} className="hover:bg-[#FBF8F3] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#5C5248]">#{batch.id}</td>
                    <td className="px-6 py-4 font-semibold text-[#2A2420]">{batch.resep}</td>
                    <td className="px-6 py-4 font-mono">{batch.qty} Pcs</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                      {isCancelled ? '-' : `${netUsable} Pcs`}
                    </td>
                    <td className="px-6 py-4 font-mono text-red-600">
                      {totalWaste > 0 ? `${totalWaste} Pcs (${batch.wasteReason || 'Gagal'})` : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#5C5248]">{batch.operator || 'Chef Utama'}</td>
                    <td className="px-6 py-4 text-xs font-mono text-[#8F8377]">{batch.date || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          isCancelled
                            ? 'bg-red-50 text-red-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isCancelled ? '❌ Dibatalkan' : '✅ Selesai (QC Passed)'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
