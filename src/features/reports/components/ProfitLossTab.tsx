import React from 'react';
import { Sale, Recipe, CashTransaction } from '../../../types';
import { FileSpreadsheet, PieChart, TrendingUp } from 'lucide-react';

interface ProfitLossTabProps {
  sales: Sale[];
  recipes: Recipe[];
  cashTransactions: CashTransaction[];
  currencySymbol: string;
  recipeHppMap: Record<string, number>;
  onExportPDF: () => void;
}

export default function ProfitLossTab({
  sales,
  recipes,
  cashTransactions,
  currencySymbol,
  recipeHppMap,
  onExportPDF,
}: ProfitLossTabProps) {
  const nonVoidSales = sales.filter((s) => s.status !== 'Void');

  // 1. Gross Revenue
  const totalPenjualanKotor = nonVoidSales.reduce((sum, s) => sum + s.total, 0);

  // 2. Total COGS / HPP Donut Sold
  const totalHppTerjual = nonVoidSales.reduce((totalHpp, sale) => {
    const saleHpp = sale.items.reduce((itemSum, item) => {
      const netQty = Math.max(0, item.qty - (item.returnedQty || 0));
      const hppPerUnit = recipeHppMap[item.name] || 0;
      return itemSum + netQty * hppPerUnit;
    }, 0);
    return totalHpp + saleHpp;
  }, 0);

  // 3. Gross Profit
  const labaKotor = totalPenjualanKotor - totalHppTerjual;

  // 4. Operational Expenses (OpEx)
  const totalOpEx = cashTransactions
    .filter((t) => t.type === 'KELUAR')
    .reduce((sum, t) => sum + t.amount, 0);

  // 5. Net Operating Profit
  const labaBersihOperasional = labaKotor - totalOpEx;

  // 6. Net Profit Margin %
  const netMarginPercent =
    totalPenjualanKotor > 0
      ? Math.round((labaBersihOperasional / totalPenjualanKotor) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Export PDF */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 border border-[#E9E2D8] rounded-2xl shadow-xs">
        <div>
          <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#8B3350]" />
            <span>Laporan Laba Rugi Operasional (P&amp;L)</span>
          </h3>
          <p className="text-xs text-[#9A8E80]">
            Perhitungan Laba Kotor, HPP Donat Terjual, Beban Operasional (OpEx), dan Laba Bersih.
          </p>
        </div>

        <button
          onClick={onExportPDF}
          className="px-4 py-2 bg-[#8B3350] hover:bg-[#722740] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Cetak Laporan PDF</span>
        </button>
      </div>

      {/* P&L Statement Grid */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="space-y-4">
          {/* Revenue */}
          <div className="flex justify-between items-center pb-3 border-b border-[#E9E2D8]">
            <span className="font-bold text-sm text-[#2A2420]">1. Penjualan Bersih (Omzet POS)</span>
            <span className="font-mono font-bold text-base text-emerald-700">
              {currencySymbol} {totalPenjualanKotor.toLocaleString('id-ID')}
            </span>
          </div>

          {/* HPP / COGS */}
          <div className="flex justify-between items-center pb-3 border-b border-[#E9E2D8]">
            <div>
              <span className="font-bold text-sm text-[#2A2420]">2. Total HPP Donat Terjual (COGS)</span>
              <p className="text-[10px] text-[#8F8377]">Kalkulasi otomatis berdasarkan resep &amp; kuantitas terjual</p>
            </div>
            <span className="font-mono font-bold text-base text-red-600">
              - {currencySymbol} {Math.round(totalHppTerjual).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Gross Profit */}
          <div className="flex justify-between items-center p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="font-serif font-bold text-sm text-emerald-900">
              = LABA KOTOR (GROSS PROFIT)
            </span>
            <span className="font-mono font-bold text-lg text-emerald-800">
              {currencySymbol} {Math.round(labaKotor).toLocaleString('id-ID')}
            </span>
          </div>

          {/* OpEx */}
          <div className="flex justify-between items-center pb-3 border-b border-[#E9E2D8] pt-2">
            <div>
              <span className="font-bold text-sm text-[#2A2420]">3. Total Beban Operasional (OpEx)</span>
              <p className="text-[10px] text-[#8F8377]">Listrik, gas, gaji, sewa, maintenance, dan promosi</p>
            </div>
            <span className="font-mono font-bold text-base text-red-600">
              - {currencySymbol} {totalOpEx.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Net Profit Final Card */}
          <div className="flex justify-between items-center p-5 bg-[#8B3350] text-[#FBF7F2] rounded-2xl shadow-sm">
            <div>
              <span className="font-serif font-bold text-base block">
                = LABA BERSIH OPERASIONAL (NET PROFIT)
              </span>
              <span className="text-xs text-[#FBF7F2]/80">Net Profit Margin: {netMarginPercent}%</span>
            </div>
            <span className="font-mono font-bold text-2xl">
              {currencySymbol} {Math.round(labaBersihOperasional).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
