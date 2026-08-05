import React from 'react';
import { Sale, ProductionBatch, Ingredient, IngredientPurchase, Recipe, CashTransaction, ErpSettings, SecurityLog } from '../../../types';
import { 
  TrendingUp, 
  ChefHat, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  Clock, 
  BarChart3, 
  Award, 
  ShieldCheck, 
  ChevronRight,
  Boxes,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Cell 
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';

interface DashboardOwnerProps {
  sales: Sale[];
  productionBatches: ProductionBatch[];
  ingredients: Ingredient[];
  purchases: IngredientPurchase[];
  recipes: Recipe[];
  cashTransactions: CashTransaction[];
  settings: ErpSettings;
  donutInventory: Record<string, number>;
  securityLogs: SecurityLog[];
  onNavigateView: (view: 'stok' | 'resep' | 'produksi' | 'kasir' | 'rekap' | 'keuangan' | 'pengaturan') => void;
}

export default function DashboardOwner(props: DashboardOwnerProps) {
  const { settings, securityLogs, onNavigateView } = props;

  const {
    currencySymbol,
    formattedToday,
    todaySalesList,
    totalSalesToday,
    todayBatches,
    totalProductionTodayQty,
    wasteAnalysis,
    ingredientInventoryValuation,
    financialSummary,
    bestSellers,
    salesChartData,
    productionChartData,
    handleExportExecutivePDF,
  } = useDashboard(props);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="bg-gradient-to-r from-[#28160E] via-[#382015] to-[#7A3E2B] text-[#FAF6F0] rounded-2xl p-6 shadow-md border border-[#E5DCD0]/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center justify-center pr-8">
          <ChefHat className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#7A3E2B] text-white">
                Executive Owner Dashboard
              </span>
              <span className="text-xs text-[#D8CFC4] font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#A2583E]" />
                Hari Ini: {formattedToday}
              </span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white">
              Ringkasan Kinerja {(settings.storeName || "Brownkiss ERP").replace(/D'?Donuts/gi, 'Brownkiss')}
            </h2>
            <p className="text-xs text-[#D8CFC4] mt-1 max-w-2xl">
              Pantau arus penjualan realtime, pergerakan batch produksi oven, persediaan bahan baku, margin keuntungan, dan audit sistem secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleExportExecutivePDF}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Unduh Executive Summary Laporan Lengkap PDF"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Unduh Laporan Executive (PDF)</span>
            </button>
            <button
              onClick={() => onNavigateView('kasir')}
              className="px-4 py-2 bg-[#7A3E2B] hover:bg-[#5E2D1E] text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buka POS Kasir</span>
            </button>
            <button
              onClick={() => onNavigateView('keuangan')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <DollarSign className="w-4 h-4" />
              <span>Manajemen Kas</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 9 PRIMARY KPI CARDS GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Penjualan Hari Ini */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xxs font-mono font-bold tracking-wider text-[#9E8A78] uppercase block">
                KPI Penjualan
              </span>
              <h3 className="text-xs font-semibold text-[#614B3E]">Total Penjualan Hari Ini</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#7A3E2B]/10 text-[#7A3E2B] flex items-center justify-center flex-none group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-[#3A2319]">
            {currencySymbol} {totalSalesToday.toLocaleString('id-ID')}
          </div>
          <div className="mt-2 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
            <span className="text-[#9E8A78] font-mono text-[11px]">
              {todaySalesList.length} Transaksi Sukses
            </span>
            <span className="font-mono text-[11px] font-bold text-[#5B8A68] flex items-center gap-0.5">
              Realtime
            </span>
          </div>
        </div>

        {/* KPI 2: Total Produksi Hari Ini */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xxs font-mono font-bold tracking-wider text-[#9E8A78] uppercase block">
                KPI Produksi
              </span>
              <h3 className="text-xs font-semibold text-[#614B3E]">Produksi Hari Ini</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#C67D42]/10 text-[#C67D42] flex items-center justify-center flex-none group-hover:scale-110 transition-transform">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-[#3A2319]">
            {totalProductionTodayQty.toLocaleString('id-ID')} <span className="text-sm font-sans font-normal text-[#9E8A78]">Pcs</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
            <span className="text-[#9E8A78] font-mono text-[11px]">
              {todayBatches.length} Batch Oven
            </span>
            <button 
              onClick={() => onNavigateView('produksi')}
              className="font-semibold text-[11px] text-[#7A3E2B] hover:underline cursor-pointer"
            >
              Lihat Batch &rarr;
            </button>
          </div>
        </div>

        {/* KPI 3: Margin Keuntungan */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xxs font-mono font-bold tracking-wider text-[#9E8A78] uppercase block">
                KPI Efisiensi
              </span>
              <h3 className="text-xs font-semibold text-[#614B3E]">Margin Keuntungan</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#5B8A68]/10 text-[#5B8A68] flex items-center justify-center flex-none group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-[#3A2319]">
            {financialSummary.grossMarginPct.toFixed(1)}% <span className="text-xs font-sans text-[#5B8A68] font-semibold">Kotor</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
            <span className="text-[#9E8A78] font-mono text-[11px]">
              Margin Bersih: {financialSummary.netMarginPct.toFixed(1)}%
            </span>
            <span className="font-mono text-[11px] font-bold text-[#5B8A68]">
              {financialSummary.grossMarginPct >= 40 ? 'Sangat Sehat' : 'Moderat'}
            </span>
          </div>
        </div>

        {/* KPI 4: Estimasi Profit Bersih */}
        <div className="bg-white border border-l-4 border-l-[#7A3E2B] border-[#E5DCD0] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xxs font-mono font-bold tracking-wider text-[#7A3E2B] uppercase block">
                KPI Keuangan
              </span>
              <h3 className="text-xs font-bold text-[#3A2319]">Estimasi Profit Bersih</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#7A3E2B] text-white flex items-center justify-center flex-none group-hover:scale-110 transition-transform shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`font-serif font-bold text-2xl ${financialSummary.netProfit >= 0 ? 'text-[#7A3E2B]' : 'text-[#B03E2B]'}`}>
            {currencySymbol} {financialSummary.netProfit.toLocaleString('id-ID')}
          </div>
          <div className="mt-2 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
            <span className="text-[#9A8E80] font-mono text-[11px]">
              Setalah HPP &amp; OpEx
            </span>
            <button 
              onClick={() => onNavigateView('keuangan')}
              className="font-bold text-[11px] text-[#8B3350] hover:underline cursor-pointer"
            >
              Rincian Laba &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* SECONDARY KPI ROW: Waste, Material Valuation, & Low Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Secondary KPI: Total Waste */}
        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#B3432F]/10 text-[#B3432F] flex items-center justify-center flex-none">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xxs font-mono font-bold text-[#9A8E80] uppercase">Total Waste / Rusak</p>
            <p className="font-serif font-bold text-lg text-[#2A2420] truncate">
              {wasteAnalysis.totalItems} Pcs <span className="text-xs font-sans font-normal text-[#9A8E80]">({currencySymbol} {wasteAnalysis.totalCost.toLocaleString('id-ID')})</span>
            </p>
            <p className="text-[10px] text-[#9A8E80] mt-0.5 truncate">
              Afkir adonan &amp; retur kasir
            </p>
          </div>
        </div>

        {/* Secondary KPI: Nilai Persediaan Bahan Baku */}
        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#C79458]/10 text-[#C79458] flex items-center justify-center flex-none">
            <Boxes className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xxs font-mono font-bold text-[#9A8E80] uppercase">Nilai Persediaan Bahan</p>
            <p className="font-serif font-bold text-lg text-[#2A2420] truncate">
              {currencySymbol} {ingredientInventoryValuation.totalValuation.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-[#9A8E80] mt-0.5 truncate">
              {ingredientInventoryValuation.itemCount} Jenis bahan baku gudang
            </p>
          </div>
        </div>

        {/* Secondary KPI: Bahan Baku Menipis */}
        <div className="bg-white border border-[#E9E2D8] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-none ${ingredientInventoryValuation.lowStockCount > 0 ? 'bg-[#B3432F]/10 text-[#B3432F]' : 'bg-[#7FA88B]/10 text-[#7FA88B]'}`}>
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xxs font-mono font-bold text-[#9A8E80] uppercase">Bahan Baku Menipis</p>
            <p className="font-serif font-bold text-lg text-[#2A2420] truncate">
              {ingredientInventoryValuation.lowStockCount} Item <span className="text-xs font-sans font-normal text-[#9A8E80]">(Di bawah min)</span>
            </p>
            <p className="text-[10px] text-[#9A8E80] mt-0.5 truncate">
              {ingredientInventoryValuation.lowStockCount > 0 ? 'Butuh restock toko segera' : 'Stok bahan baku aman'}
            </p>
          </div>
        </div>
      </div>

      {/* ================= CHARTS SECTION: SALES & PRODUCTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Penjualan (Sales Trend) */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DCD0] pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#3A2319] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#7A3E2B]" />
                Grafik Penjualan (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-[#9E8A78]">
                Tren penerimaan kasir &amp; omset harian toko
              </p>
            </div>
            <button
              onClick={() => onNavigateView('rekap')}
              className="text-xs font-bold text-[#7A3E2B] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Detail Rekap</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7A3E2B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7A3E2B" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE1" />
                <XAxis dataKey="dayName" stroke="#9E8A78" fontSize={11} tickLine={false} />
                <YAxis stroke="#9E8A78" fontSize={11} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  formatter={(value: any) => [`${currencySymbol} ${Number(value).toLocaleString('id-ID')}`, 'Penjualan']}
                  labelStyle={{ color: '#3A2319', fontWeight: 'bold' }}
                  contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E5DCD0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#7A3E2B" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Produksi (Production Output) */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DCD0] pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#3A2319] flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#C67D42]" />
                Grafik Hasil Produksi Oven (Pcs)
              </h3>
              <p className="text-xs text-[#9E8A78]">
                Volume donat matang diproduksi per hari
              </p>
            </div>
            <button
              onClick={() => onNavigateView('produksi')}
              className="text-xs font-bold text-[#7A3E2B] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Atur Dapur</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE1" />
                <XAxis dataKey="dayName" stroke="#9E8A78" fontSize={11} tickLine={false} />
                <YAxis stroke="#9E8A78" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString('id-ID')} Pcs Donat`, 'Hasil Produksi']}
                  labelStyle={{ color: '#3A2319', fontWeight: 'bold' }}
                  contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E5DCD0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="totalPcs" fill="#C67D42" radius={[8, 8, 0, 0]}>
                  {productionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === productionChartData.length - 1 ? '#7A3E2B' : '#C67D42'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================= PRODUK TERLARIS & AUDIT TRAIL SHORTCUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produk Terlaris (Top Selling Products) - 2 Cols */}
        <div className="lg:col-span-2 bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5DCD0] pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#3A2319] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#7A3E2B]" />
                Peringkat Produk Terlaris (Best Seller)
              </h3>
              <p className="text-xs text-[#9E8A78]">
                Varian donat paling diminati konsumen berdasarkan volume penjualan
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#7A3E2B]/10 text-[#7A3E2B] px-3 py-1 rounded-xl">
              {bestSellers.totalVolumeSold} Pcs Terjual
            </span>
          </div>

          {bestSellers.list.length === 0 ? (
            <div className="py-12 text-center text-[#9E8A78] bg-[#FAF6F0] rounded-xl border border-dashed border-[#E5DCD0]">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#C9BEB0]" />
              <p className="text-sm font-semibold">Belum ada data transaksi penjualan</p>
              <p className="text-xs mt-1">Lakukan transaksi di Kasir POS untuk menganalisis varian donat terlaris.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.list.slice(0, 5).map((item, index) => (
                <div key={item.name} className="p-3 bg-[#FAF6F0] border border-[#E5DCD0] rounded-xl flex items-center gap-3 hover:border-[#7A3E2B]/40 transition-colors">
                  <div className="relative flex-none">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-[#E5DCD0]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#E5DCD0] flex items-center justify-center text-xl">
                        {item.emoji}
                      </div>
                    )}
                    <span className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-white ${
                      index === 0 ? 'bg-[#C67D42]' : index === 1 ? 'bg-[#8F8377]' : index === 2 ? 'bg-[#A35D4C]' : 'bg-[#614B3E]'
                    }`}>
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold text-[#3A2319] truncate">{item.name}</span>
                      <span className="font-mono font-bold text-[#7A3E2B]">
                        {currencySymbol} {item.revenue.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#E5DCD0] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#7A3E2B] to-[#A2583E] rounded-full transition-all"
                          style={{ width: `${Math.min(item.sharePct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#614B3E] flex-none">
                        {item.qty} pcs ({item.sharePct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Audit Trail Quick Preview - 1 Col */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#E5DCD0] pb-3 mb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#3A2319] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#7A3E2B]" />
                  Audit System Logs
                </h3>
                <p className="text-xs text-[#9E8A78]">
                  Aktivitas &amp; keamanan terbaru
                </p>
              </div>
              <button
                onClick={() => onNavigateView('pengaturan')}
                className="text-xs font-bold text-[#7A3E2B] hover:underline cursor-pointer"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {securityLogs.slice(0, 4).map((log) => {
                let badgeColor = 'bg-[#5B8A68]/10 text-[#3D6348] border-[#5B8A68]/30';
                if (log.level === 'Bahaya') {
                  badgeColor = 'bg-[#B03E2B]/10 text-[#B03E2B] border-[#B03E2B]/30';
                } else if (log.level === 'Peringatan') {
                  badgeColor = 'bg-[#C67D42]/10 text-[#C67D42] border-[#C67D42]/30';
                }

                return (
                  <div key={log.id} className="p-2.5 bg-[#FAF6F0] border border-[#E5DCD0] rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#3A2319] truncate max-w-[140px]">
                        {log.userName || 'System User'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold border ${badgeColor}`}>
                        {log.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#614B3E] line-clamp-2">
                      {log.event}
                    </p>
                    <p className="text-[9px] font-mono text-[#9E8A78]">
                      {log.timestamp}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5DCD0]">
            <button
              onClick={() => onNavigateView('pengaturan')}
              className="w-full py-2.5 bg-[#FAF6F0] hover:bg-[#7A3E2B] hover:text-white border border-[#E5DCD0] text-[#7A3E2B] font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kelola Keamanan &amp; Audit Trail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
