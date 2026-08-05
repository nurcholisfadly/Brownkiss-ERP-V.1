import { useState, useMemo } from 'react';
import { Sale, ProductionBatch, Ingredient, IngredientPurchase, Recipe, CashTransaction, ErpSettings, SecurityLog } from '../../../types';
import { exportExecutiveSummaryPDF } from '../../../utils/pdfExport';

export interface UseDashboardOptions {
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

export function useDashboard({
  sales,
  productionBatches,
  ingredients,
  purchases,
  recipes,
  cashTransactions,
  settings,
  donutInventory,
  securityLogs,
  onNavigateView,
}: UseDashboardOptions) {
  const [salesTimeframe, setSalesTimeframe] = useState<'7days' | 'today' | 'all'>('7days');
  const currencySymbol = settings.currency || 'Rp';

  // Current Date Strings for filtering
  const todayDateObj = new Date();
  const todayYMD = todayDateObj.toISOString().split('T')[0];
  const formattedToday = todayDateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Helper to normalize date strings to YYYY-MM-DD
  const getYYYYMMDD = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    if (dateStr.length >= 10 && dateStr.charAt(4) === '-' && dateStr.charAt(7) === '-') {
      return dateStr.substring(0, 10);
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return dateStr.substring(0, 10);
  };

  // KPI 1: Sales today
  const todaySalesList = useMemo(() => {
    return sales.filter((s) => s.status !== 'Void' && getYYYYMMDD(s.date) === todayYMD);
  }, [sales, todayYMD]);

  const totalSalesToday = useMemo(() => {
    return todaySalesList.reduce((sum, s) => sum + s.total, 0);
  }, [todaySalesList]);

  const nonVoidSales = useMemo(() => {
    return sales.filter((s) => s.status !== 'Void');
  }, [sales]);

  const totalSalesAllTime = useMemo(() => {
    return nonVoidSales.reduce((sum, s) => sum + s.total, 0);
  }, [nonVoidSales]);

  // KPI 2: Production today
  const todayBatches = useMemo(() => {
    return productionBatches.filter((b) => getYYYYMMDD(b.date || b.scheduledDate || '') === todayYMD);
  }, [productionBatches, todayYMD]);

  const totalProductionTodayQty = useMemo(() => {
    return todayBatches.reduce((sum, b) => sum + (b.usableQty ?? b.qty), 0);
  }, [todayBatches]);

  const totalProductionAllTimeQty = useMemo(() => {
    return productionBatches.reduce((sum, b) => sum + (b.usableQty ?? b.qty), 0);
  }, [productionBatches]);

  // KPI 3: Waste & Damage
  const wasteAnalysis = useMemo(() => {
    let batchWastePcs = 0;
    let batchWasteCost = 0;
    productionBatches.forEach((b) => {
      if (b.wasteQty && b.wasteQty > 0) {
        batchWastePcs += b.wasteQty;
        const perPieceCost = b.qty > 0 ? b.cost / b.qty : 0;
        batchWasteCost += b.wasteQty * perPieceCost;
      }
    });

    let returnWastePcs = 0;
    let returnWasteCost = 0;
    sales.forEach((s) => {
      if (s.returnDetails && s.returnDetails.length > 0) {
        s.returnDetails.forEach((ret) => {
          if (ret.returnedItems) {
            ret.returnedItems.forEach((item) => {
              returnWastePcs += item.qty;
              const recipe = recipes.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
              const hpp = recipe ? recipe.hpp || 0 : 5000;
              returnWasteCost += item.qty * hpp;
            });
          }
        });
      }
    });

    return {
      totalItems: batchWastePcs + returnWastePcs,
      totalCost: batchWasteCost + returnWasteCost,
      batchWastePcs,
      returnWastePcs,
    };
  }, [productionBatches, sales, recipes]);

  // KPI 4: Ingredient Inventory Valuation
  const ingredientInventoryValuation = useMemo(() => {
    let totalVal = 0;
    let lowStockCount = 0;
    ingredients.forEach((ing) => {
      const unitCost = ing.costPerUnit || 0;
      totalVal += ing.qty * unitCost;
      if (ing.qty <= ing.minQty) {
        lowStockCount++;
      }
    });
    return {
      totalValuation: totalVal,
      itemCount: ingredients.length,
      lowStockCount,
    };
  }, [ingredients]);

  // KPI 5: HPP & Profit
  const financialSummary = useMemo(() => {
    const netSales = nonVoidSales.reduce((sum, s) => sum + s.total, 0);

    let totalHppSold = 0;
    nonVoidSales.forEach((sale) => {
      if (sale.items) {
        sale.items.forEach((item) => {
          const qtyNet = item.qty - (item.returnedQty || 0);
          if (qtyNet > 0) {
            const recipe = recipes.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
            const unitHpp = recipe ? recipe.hpp || 0 : item.price * 0.4;
            totalHppSold += qtyNet * unitHpp;
          }
        });
      }
    });

    const opExTotal = cashTransactions
      .filter((t) => t.type === 'KELUAR' && t.category !== 'Pembelian Bahan')
      .reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = netSales - totalHppSold;
    const netProfit = grossProfit - opExTotal;

    const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    return {
      netSales,
      totalHppSold,
      opExTotal,
      grossProfit,
      netProfit,
      grossMarginPct,
      netMarginPct,
    };
  }, [nonVoidSales, recipes, cashTransactions]);

  // KPI 6: Best Sellers
  const bestSellers = useMemo(() => {
    const stats: Record<string, { qty: number; revenue: number; hpp: number }> = {};

    nonVoidSales.forEach((sale) => {
      if (sale.items) {
        sale.items.forEach((item) => {
          const qtyNet = item.qty - (item.returnedQty || 0);
          if (qtyNet > 0) {
            if (!stats[item.name]) {
              const recipe = recipes.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
              const unitHpp = recipe ? recipe.hpp || 0 : item.price * 0.4;
              stats[item.name] = { qty: 0, revenue: 0, hpp: unitHpp };
            }
            stats[item.name].qty += qtyNet;
            stats[item.name].revenue += qtyNet * item.price;
          }
        });
      }
    });

    const totalVolumeSold = Object.values(stats).reduce((a, b) => a + b.qty, 0);

    const list = Object.entries(stats)
      .map(([name, data]) => {
        const recipe = recipes.find((r) => r.name.toLowerCase() === name.toLowerCase());
        const sharePct = totalVolumeSold > 0 ? (data.qty / totalVolumeSold) * 100 : 0;
        const totalCost = data.qty * data.hpp;
        const profit = data.revenue - totalCost;

        return {
          name,
          qty: data.qty,
          revenue: data.revenue,
          profit,
          sharePct,
          emoji: recipe?.emoji || '🍩',
          sellingPrice: recipe?.price || data.revenue / (data.qty || 1),
          image: (recipe as any)?.image,
        };
      })
      .sort((a, b) => b.qty - a.qty);

    return { list, totalVolumeSold };
  }, [nonVoidSales, recipes]);

  // Chart Data: Sales Trend
  const salesChartData = useMemo(() => {
    const days: { dayName: string; dateYMD: string; sales: number; txCount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateYMD = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });

      const salesOnDay = nonVoidSales.filter((s) => getYYYYMMDD(s.date) === dateYMD);
      const totalRev = salesOnDay.reduce((a, b) => a + b.total, 0);

      days.push({
        dayName: `${dayName} (${d.getDate()}/${d.getMonth() + 1})`,
        dateYMD,
        sales: totalRev,
        txCount: salesOnDay.length,
      });
    }
    return days;
  }, [nonVoidSales]);

  // Chart Data: Production Trend
  const productionChartData = useMemo(() => {
    const days: { dayName: string; dateYMD: string; totalPcs: number; batchCount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateYMD = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });

      const batchesOnDay = productionBatches.filter(
        (b) => getYYYYMMDD(b.date || b.scheduledDate || '') === dateYMD
      );
      const totalPcs = batchesOnDay.reduce((a, b) => a + (b.usableQty ?? b.qty), 0);

      days.push({
        dayName: `${dayName} (${d.getDate()}/${d.getMonth() + 1})`,
        dateYMD,
        totalPcs,
        batchCount: batchesOnDay.length,
      });
    }
    return days;
  }, [productionBatches]);

  const handleExportExecutivePDF = () => {
    exportExecutiveSummaryPDF(sales, recipes, ingredients, cashTransactions, settings);
  };

  return {
    salesTimeframe,
    setSalesTimeframe,
    currencySymbol,
    formattedToday,
    todaySalesList,
    totalSalesToday,
    totalSalesAllTime,
    todayBatches,
    totalProductionTodayQty,
    totalProductionAllTimeQty,
    wasteAnalysis,
    ingredientInventoryValuation,
    financialSummary,
    bestSellers,
    salesChartData,
    productionChartData,
    handleExportExecutivePDF,
  };
}
