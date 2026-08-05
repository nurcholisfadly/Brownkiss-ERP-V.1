import React from 'react';
import { Ingredient, IngredientPurchase } from '../../../types';
import { humanFormat, getDisplayPriceUnit } from '../../../utils/formatters';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, History, Receipt, X } from 'lucide-react';

interface IngredientHistoryModalProps {
  historyIng: Ingredient;
  purchases: IngredientPurchase[];
  onClose: () => void;
  onOpenRestock: (ing: Ingredient) => void;
}

export default function IngredientHistoryModal({
  historyIng,
  purchases,
  onClose,
  onOpenRestock,
}: IngredientHistoryModalProps) {
  const ingPurchases = purchases.filter((p) => p.ingredientId === historyIng.id);
  const priceDisplay = getDisplayPriceUnit(historyIng.costPerUnit, historyIng.unit);

  const pricesList = ingPurchases
    .map((p) => getDisplayPriceUnit(p.costPerUnit, p.unit).unitPriceNum)
    .filter((p) => p > 0);

  const minPrice = pricesList.length > 0 ? Math.min(...pricesList) : priceDisplay.unitPriceNum;
  const maxPrice = pricesList.length > 0 ? Math.max(...pricesList) : priceDisplay.unitPriceNum;

  // Recharts dataset formatting
  const chartData = [...ingPurchases]
    .reverse()
    .map((p) => {
      const pDisp = getDisplayPriceUnit(p.costPerUnit, p.unit);
      return {
        date: p.date.split(' ')[0] || p.date,
        fullDate: p.date,
        type: p.type,
        unitPrice: pDisp.unitPriceNum,
        formattedPrice: pDisp.priceFormatted,
        totalCost: p.totalCost,
        note: p.note || p.type,
      };
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#E9E2D8] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#8B3350]/10 text-[#8B3350] text-xs font-bold uppercase tracking-wider">
                {historyIng.category}
              </span>
              <h3 className="font-serif font-bold text-xl text-[#2A2420]">{historyIng.name}</h3>
            </div>
            <p className="text-xs text-[#8F8377]">
              Histori Restock Pembelian Nota &amp; Perubahan Trend Harga Beli
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] p-1.5 rounded-lg hover:bg-[#FBF7F2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stat Highlights */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3">
              <p className="text-[10px] text-[#8F8377] uppercase font-bold">Stok Gudang</p>
              <p className="font-serif text-lg font-bold text-[#2A2420] mt-0.5">
                {humanFormat(historyIng.qty, historyIng.unit)}
              </p>
            </div>

            <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3">
              <p className="text-[10px] text-[#8F8377] uppercase font-bold">Harga Saat Ini</p>
              <p className="font-serif text-lg font-bold text-[#8B3350] mt-0.5">
                {priceDisplay.priceFormatted}
              </p>
            </div>

            <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3">
              <p className="text-[10px] text-[#8F8377] uppercase font-bold">Harga Terendah</p>
              <p className="font-serif text-lg font-bold text-emerald-700 mt-0.5">
                Rp {minPrice.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl p-3">
              <p className="text-[10px] text-[#8F8377] uppercase font-bold">Harga Tertinggi</p>
              <p className="font-serif text-lg font-bold text-red-700 mt-0.5">
                Rp {maxPrice.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* PRICE TREND CHART */}
          <div className="bg-white border border-[#E9E2D8] rounded-2xl p-4 shadow-xxs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-sm text-[#2A2420] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8B3350]" />
                Grafik Fluktuasi Harga Beli (Rp / {priceDisplay.unitLabel})
              </h4>
              <span className="text-[10px] font-mono text-[#9A8E80]">
                {chartData.length} data rekaman
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEE3D0" />
                    <XAxis dataKey="date" stroke="#8F8377" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#8F8377"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) => `Rp ${val / 1000}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#2A2420] text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
                              <p className="font-mono text-[10px] text-[#D8C2A8]">{d.fullDate}</p>
                              <p className="font-bold text-[#FBF7F2]">{d.note}</p>
                              <p className="font-serif text-amber-400 font-bold">
                                Harga Beli: {d.formattedPrice} / {priceDisplay.unitLabel}
                              </p>
                              {d.totalCost > 0 && (
                                <p className="text-[10px] text-gray-300">
                                  Total Bayar: Rp {Math.round(d.totalCost).toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="unitPrice"
                      stroke="#8B3350"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#8B3350', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#2A2420' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#9A8E80] font-mono">
                Belum ada grafik histori harga tercatat untuk bahan baku ini.
              </div>
            )}
          </div>

          {/* RESTOCK HISTORY TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-sm text-[#2A2420] flex items-center gap-2">
                <History className="w-4 h-4 text-[#8B3350]" />
                Riwayat Restock &amp; Stok Masuk
              </h4>

              <button
                onClick={() => {
                  onOpenRestock(historyIng);
                }}
                className="px-3 py-1.5 bg-[#8B3350] hover:bg-[#722840] text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Input Restock Baru</span>
              </button>
            </div>

            <div className="bg-white border border-[#E9E2D8] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E9E2D8] bg-[#FBF7F2]/60 text-[#8F8377] font-bold uppercase">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Jumlah Masuk</th>
                    <th className="px-4 py-3">Harga Beli Satuan</th>
                    <th className="px-4 py-3">Total Bayar</th>
                    <th className="px-4 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E2D8]">
                  {ingPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#9A8E80] font-mono">
                        Belum ada riwayat pembelian untuk bahan baku ini.
                      </td>
                    </tr>
                  ) : (
                    ingPurchases.map((p) => {
                      const pDisp = getDisplayPriceUnit(p.costPerUnit, p.unit);
                      return (
                        <tr key={p.id} className="hover:bg-[#FBF8F3] transition-colors">
                          <td className="px-4 py-3 font-mono text-[#5C5248]">{p.date}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B3350]/10 text-[#8B3350]">
                              {p.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#2A2420]">
                            {p.qtyAdded > 0 ? `+${humanFormat(p.qtyAdded, p.unit)}` : p.qtyAdded < 0 ? humanFormat(p.qtyAdded, p.unit) : '-'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#5C5248]">
                            {pDisp.priceFormatted} / {pDisp.unitLabel}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#8B3350]">
                            {p.totalCost > 0 ? `Rp ${Math.round(p.totalCost).toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-[#8F8377]">{p.note || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
