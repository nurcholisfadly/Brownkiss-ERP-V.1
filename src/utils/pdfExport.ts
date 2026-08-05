import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, CashTransaction, SecurityLog, Ingredient, ErpSettings, Recipe, ClosingReport, InventorySnapshot } from '../types';

// Palette Colors matching Fudgy Chocolate Brownie & Milk Plate Tone
const BURGUNDY = [122, 62, 43];  // #7A3E2B (Fudgy Chocolate Glaze)
const CHARCOAL = [58, 35, 25];   // #3A2319 (Rich Cocoa Dark Ink)
const TOASTED = [229, 220, 208]; // #E5DCD0 (Warm Ceramic Plate Border)
const CREAM = [250, 246, 240];   // #FAF6F0 (Creamy Milk Canvas)
const MUTED = [158, 138, 120];   // #9E8A78 (Toasted Brownie Crumb Muted)

interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
  period?: string;
  settings?: ErpSettings;
}

/**
 * Draws standard header and footer for Brownkiss ERP PDF Reports
 */
function drawHeaderAndFooter(doc: jsPDF, options: PdfHeaderOptions) {
  const storeName = options.settings?.storeName || "Brownkiss Artisan Bakery";
  const storeAddress = options.settings?.storeAddress || "Jl. Malioboro No. 45, Yogyakarta";
  const storeContact = options.settings?.contactNumber || "Telp: +62 812-3456-7890";

  // Top Accent Bar
  doc.setFillColor(BURGUNDY[0], BURGUNDY[1], BURGUNDY[2]);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 8, 'F');

  // Store Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(BURGUNDY[0], BURGUNDY[1], BURGUNDY[2]);
  doc.text(storeName.toUpperCase(), 14, 20);

  // Address & Contact
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`${storeAddress} | ${storeContact}`, 14, 25);

  // Divider Line
  doc.setDrawColor(TOASTED[0], TOASTED[1], TOASTED[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 28, doc.internal.pageSize.getWidth() - 14, 28);

  // Report Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
  doc.text(options.title, 14, 36);

  // Metadata Right Aligned
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(`Dicetak: ${dateStr}`, pageWidth - 14, 34, { align: 'right' });
  if (options.period) {
    doc.text(`Periode: ${options.period}`, pageWidth - 14, 39, { align: 'right' });
  }

  return 44; // Start Y position for content
}

/**
 * Add Page Footer to all pages
 */
function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(TOASTED[0], TOASTED[1], TOASTED[2]);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text("Brownkiss ERP - Dokumen Laporan Resmi & Rahasia Toko", 14, pageHeight - 6);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
  }
}

// ============================================================================
// 1. EXPORT LAPORAN REKAPITULASI PENJUALAN (SALES REPORT PDF)
// ============================================================================
export function exportSalesReportPDF(
  sales: Sale[],
  periodText: string,
  settings?: ErpSettings
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let startY = drawHeaderAndFooter(doc, {
    title: 'LAPORAN REKAPITULASI PENJUALAN',
    period: periodText,
    settings
  });

  // Calculate Metrics
  const validSales = sales.filter((s) => s.status !== 'Void');
  const totalOmzet = validSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = validSales.length;
  const avgBasket = totalTransactions > 0 ? Math.round(totalOmzet / totalTransactions) : 0;
  const totalVoidCount = sales.filter((s) => s.status === 'Void').length;

  // Draw Summary KPI Box Grid
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 9) / 4; // 4 boxes with 3mm gaps
  const boxHeight = 16;

  const kpis = [
    { label: 'Total Omzet (Net)', val: `Rp ${totalOmzet.toLocaleString('id-ID')}` },
    { label: 'Transaksi Selesai', val: `${totalTransactions} Tx` },
    { label: 'Rata-Rata Keranjang', val: `Rp ${avgBasket.toLocaleString('id-ID')}` },
    { label: 'Transaksi Void', val: `${totalVoidCount} Tx` }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
    doc.setDrawColor(TOASTED[0], TOASTED[1], TOASTED[2]);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(kpi.label, x + 3, startY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(kpi.val, x + 3, startY + 12);
  });

  startY += boxHeight + 6;

  // Prepare Table Data
  const tableHeaders = [
    'No. Invoice / ID',
    'Waktu',
    'Pelanggan',
    'Rincian Item',
    'Metode',
    'Total (Rp)',
    'Status'
  ];

  const tableRows = sales.map((s) => {
    const itemsText = s.items.map((i) => `${i.qty}x ${i.name}`).join(', ');
    const isVoid = s.status === 'Void';
    return [
      s.invoiceNo || s.id,
      s.date,
      s.customerName || 'Pelanggan Umum',
      itemsText,
      s.paymentMethod,
      `Rp ${s.total.toLocaleString('id-ID')}`,
      isVoid ? 'VOID (BATAL)' : 'SELESAI'
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: CHARCOAL as [number, number, number]
    },
    alternateRowStyles: {
      fillColor: CREAM as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 26 },
      2: { cellWidth: 28 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 20 },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'VOID (BATAL)') {
          data.cell.styles.textColor = [200, 30, 30];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [40, 140, 60];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  addFooters(doc);
  doc.save(`Laporan_Penjualan_Brownkiss_${Date.now()}.pdf`);
}

// ============================================================================
// 2. EXPORT LAPORAN KEUANGAN & LABA RUGI (FINANCIAL REPORT PDF)
// ============================================================================
export function exportFinancialReportPDF(
  sales: Sale[],
  recipes: Recipe[],
  cashTransactions: CashTransaction[],
  periodText: string,
  settings?: ErpSettings
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let startY = drawHeaderAndFooter(doc, {
    title: 'LAPORAN KEUANGAN & LABA RUGI OPERASIONAL',
    period: periodText,
    settings
  });

  // Calculate Financial Metrics
  const recipeHppMap: Record<string, number> = {};
  recipes.forEach((r) => { recipeHppMap[r.name.toLowerCase()] = r.hpp || 0; });

  const validSales = sales.filter((s) => s.status !== 'Void');
  let grossSales = 0;
  let totalDiscounts = 0;
  let totalCogs = 0;

  validSales.forEach((s) => {
    grossSales += s.items.reduce((acc, i) => acc + i.qty * i.price, 0);
    totalDiscounts += s.discountAmount || 0;
    s.items.forEach((i) => {
      const netQty = i.qty - (i.returnedQty || 0);
      if (netQty > 0) {
        const unitHpp = recipeHppMap[i.name.toLowerCase()] || (i.price * 0.4);
        totalCogs += netQty * unitHpp;
      }
    });
  });

  const netSales = Math.max(0, grossSales - totalDiscounts);
  const grossProfit = netSales - totalCogs;
  const opex = cashTransactions
    .filter((c) => c.type === 'KELUAR')
    .reduce((sum, c) => sum + c.amount, 0);
  const netOperatingProfit = grossProfit - opex;

  // Draw Financial Executive Summary Cards
  doc.setFillColor(BURGUNDY[0], BURGUNDY[1], BURGUNDY[2]);
  doc.rect(14, startY, doc.internal.pageSize.getWidth() - 28, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('RINGKASAN KINERJA LABA RUGI', 18, startY + 4.2);

  startY += 8;

  const pnlRows = [
    ['Penjualan Kotor (Gross Sales)', `Rp ${grossSales.toLocaleString('id-ID')}`],
    ['Total Potongan & Diskon Promosi', `- Rp ${totalDiscounts.toLocaleString('id-ID')}`],
    ['PENJUALAN BERSIH (NET REVENUE)', `Rp ${netSales.toLocaleString('id-ID')}`],
    ['Harga Pokok Penjualan (Total HPP)', `- Rp ${totalCogs.toLocaleString('id-ID')}`],
    ['LABA KOTOR (GROSS PROFIT)', `Rp ${grossProfit.toLocaleString('id-ID')}`],
    ['Beban Operasional (OpEx / Kas Keluar)', `- Rp ${opex.toLocaleString('id-ID')}`],
    ['LABA BERSIH OPERASIONAL (NET PROFIT)', `Rp ${netOperatingProfit.toLocaleString('id-ID')}`]
  ];

  autoTable(doc, {
    startY: startY,
    head: [['Komponen Keuangan', 'Nominal (IDR)']],
    body: pnlRows,
    theme: 'plain',
    headStyles: {
      fillColor: TOASTED as [number, number, number],
      textColor: CHARCOAL as [number, number, number],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: CHARCOAL as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const text = String(data.cell.raw);
        if (text.includes('BERSIH') || text.includes('LABA')) {
          data.cell.styles.fontStyle = 'bold';
          if (text.includes('NET PROFIT')) {
            data.cell.styles.fillColor = CREAM as [number, number, number];
            data.cell.styles.textColor = BURGUNDY as [number, number, number];
          }
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // Title for Cash Ledger Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
  doc.text('RINCIAN BUKU KAS & MUTASI OPERASIONAL', 14, startY);

  startY += 4;

  const cashHeaders = ['Tanggal', 'Tipe', 'Kategori', 'Catatan / Keterangan', 'Pencatat', 'Metode', 'Nominal (Rp)'];
  const cashRows = cashTransactions.map((c) => [
    c.date,
    c.type,
    c.category,
    c.note,
    c.createdBy || '-',
    c.paymentMethod || 'Tunai',
    `Rp ${c.amount.toLocaleString('id-ID')}`
  ]);

  autoTable(doc, {
    startY: startY,
    head: [cashHeaders],
    body: cashRows,
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: CHARCOAL as [number, number, number]
    },
    alternateRowStyles: {
      fillColor: CREAM as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 16 },
      2: { cellWidth: 26 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 22 },
      5: { cellWidth: 20 },
      6: { cellWidth: 28, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        if (data.cell.raw === 'MASUK') {
          data.cell.styles.textColor = [40, 140, 60];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [200, 30, 30];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  addFooters(doc);
  doc.save(`Laporan_Keuangan_Brownkiss_${Date.now()}.pdf`);
}

// ============================================================================
// 3. EXPORT AUDIT TRAIL & LOG KEAMANAN (SECURITY AUDIT PDF)
// ============================================================================
export function exportAuditTrailPDF(
  logs: SecurityLog[],
  settings?: ErpSettings
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let startY = drawHeaderAndFooter(doc, {
    title: 'LAPORAN AUDIT TRAIL & LOG KEAMANAN SISTEM',
    period: 'Keseluruhan Log Terdaftar',
    settings
  });

  // Calculate Severity Metrics
  const totalLogs = logs.length;
  const amanCount = logs.filter((l) => l.level === 'Aman').length;
  const peringatanCount = logs.filter((l) => l.level === 'Peringatan').length;
  const bahayaCount = logs.filter((l) => l.level === 'Bahaya').length;

  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 15;

  const kpis = [
    { label: 'Total Aktivitas', val: `${totalLogs} Log` },
    { label: 'Level Aman', val: `${amanCount} Log` },
    { label: 'Level Peringatan', val: `${peringatanCount} Log` },
    { label: 'Level Bahaya', val: `${bahayaCount} Log` }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
    doc.setDrawColor(TOASTED[0], TOASTED[1], TOASTED[2]);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(kpi.label, x + 3, startY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    if (idx === 1) doc.setTextColor(40, 140, 60);
    else if (idx === 2) doc.setTextColor(210, 130, 20);
    else if (idx === 3) doc.setTextColor(200, 30, 30);
    else doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);

    doc.text(kpi.val, x + 3, startY + 11);
  });

  startY += boxHeight + 6;

  const tableHeaders = ['Waktu', 'Pengguna & Role', 'Kategori', 'Severity', 'Aktivitas Detail', 'Perubahan Data'];
  const tableRows = logs.map((l) => {
    const timeStr = `${l.date || l.timestamp.split(' ')[0] || ''} ${l.time || l.timestamp.split(' ')[1] || ''}`.trim();
    const userStr = `${l.userName || 'System'} (${l.userRole || 'Admin'})`;
    let changeStr = '-';
    if (l.beforeValue || l.afterValue) {
      changeStr = `Awal: ${l.beforeValue || '-'}\nBaru: ${l.afterValue || '-'}`;
    }
    return [
      timeStr,
      userStr,
      l.category || 'Umum',
      l.level.toUpperCase(),
      l.event,
      changeStr
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: CHARCOAL as [number, number, number]
    },
    alternateRowStyles: {
      fillColor: CREAM as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 32 },
      2: { cellWidth: 24 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 38 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const lvl = String(data.cell.raw);
        if (lvl === 'BAHAYA') {
          data.cell.styles.textColor = [200, 30, 30];
          data.cell.styles.fontStyle = 'bold';
        } else if (lvl === 'PERINGATAN') {
          data.cell.styles.textColor = [210, 130, 20];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [40, 140, 60];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  addFooters(doc);
  doc.save(`Audit_Trail_Brownkiss_${Date.now()}.pdf`);
}

// ============================================================================
// 4. EXPORT RINGKASAN EKSEKUTIF OWNER (EXECUTIVE SUMMARY PDF)
// ============================================================================
export function exportExecutiveSummaryPDF(
  sales: Sale[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  cashTransactions: CashTransaction[],
  settings?: ErpSettings
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let startY = drawHeaderAndFooter(doc, {
    title: 'LAPORAN EKSKLUSIF EKSKUTIF OWNER & PERFORMA TOKO',
    period: 'Analisis Komprehensif Operasional',
    settings
  });

  // KPI Calculations
  const validSales = sales.filter((s) => s.status !== 'Void');
  const totalOmzet = validSales.reduce((s, x) => s + x.total, 0);
  const totalTx = validSales.length;

  const recipeHppMap: Record<string, number> = {};
  recipes.forEach((r) => { recipeHppMap[r.name.toLowerCase()] = r.hpp || 0; });

  let totalHpp = 0;
  const variantSales: Record<string, { qty: number; revenue: number; cogs: number }> = {};

  validSales.forEach((s) => {
    s.items.forEach((i) => {
      const netQty = i.qty - (i.returnedQty || 0);
      if (netQty > 0) {
        const unitHpp = recipeHppMap[i.name.toLowerCase()] || (i.price * 0.4);
        const cogs = netQty * unitHpp;
        const revenue = netQty * i.price;
        totalHpp += cogs;

        if (!variantSales[i.name]) {
          variantSales[i.name] = { qty: 0, revenue: 0, cogs: 0 };
        }
        variantSales[i.name].qty += netQty;
        variantSales[i.name].revenue += revenue;
        variantSales[i.name].cogs += cogs;
      }
    });
  });

  const grossProfit = totalOmzet - totalHpp;
  const opex = cashTransactions.filter((c) => c.type === 'KELUAR').reduce((s, x) => s + x.amount, 0);
  const netProfit = grossProfit - opex;

  // KPI Section
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 16;

  const kpis = [
    { label: 'Penjualan Bersih', val: `Rp ${totalOmzet.toLocaleString('id-ID')}` },
    { label: 'Estimasi Laba Bersih', val: `Rp ${netProfit.toLocaleString('id-ID')}` },
    { label: 'Total Transaksi', val: `${totalTx} Tx` },
    { label: 'Jumlah Variansi Resep', val: `${recipes.length} Produk` }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
    doc.setDrawColor(TOASTED[0], TOASTED[1], TOASTED[2]);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(kpi.label, x + 3, startY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(kpi.val, x + 3, startY + 12);
  });

  startY += boxHeight + 8;

  // Top 5 Donut Performance Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
  doc.text('PERFORMA PENJUALAN PER VARIAN PRODUK (TOP SELLERS)', 14, startY);

  startY += 4;

  const topVariants = Object.keys(variantSales)
    .map((name) => {
      const v = variantSales[name];
      const profit = v.revenue - v.cogs;
      const margin = v.revenue > 0 ? ((profit / v.revenue) * 100).toFixed(1) : '0';
      return [name, `${v.qty} pcs`, `Rp ${v.revenue.toLocaleString('id-ID')}`, `Rp ${profit.toLocaleString('id-ID')}`, `${margin}%`];
    })
    .sort((a, b) => parseInt(b[1]) - parseInt(a[1]));

  autoTable(doc, {
    startY: startY,
    head: [['Nama Varian Donat', 'Kuantitas Terjual', 'Pendapatan Kotor', 'Estimasi Laba Kotor', 'Margin %']],
    body: topVariants,
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: CHARCOAL as [number, number, number]
    },
    alternateRowStyles: {
      fillColor: CREAM as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 38, halign: 'right' },
      4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // Low Stock Warning Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
  doc.text('STATUS STOK BAHAN BAKU BERISIKO (LOW STOCK)', 14, startY);

  startY += 4;

  const lowStock = ingredients.filter((ing) => ing.qty <= ing.minQty);
  const stockRows = lowStock.map((ing) => [
    ing.name,
    ing.category,
    `${ing.qty} ${ing.unit}`,
    `${ing.minQty} ${ing.unit}`,
    ing.qty === 0 ? 'HABIS (KRITIS)' : 'PERLU RESTOCK'
  ]);

  if (stockRows.length === 0) {
    stockRows.push(['Semua Bahan Baku Dalam Kondisi Aman', '-', '-', '-', 'NORMAL']);
  }

  autoTable(doc, {
    startY: startY,
    head: [['Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Batas Minimum', 'Status Peringatan']],
    body: stockRows,
    theme: 'grid',
    headStyles: {
      fillColor: TOASTED as [number, number, number],
      textColor: CHARCOAL as [number, number, number],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: CHARCOAL as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 36, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const raw = String(data.cell.raw);
        if (raw.includes('KRITIS') || raw.includes('HABIS')) {
          data.cell.styles.textColor = [200, 30, 30];
          data.cell.styles.fontStyle = 'bold';
        } else if (raw.includes('RESTOCK')) {
          data.cell.styles.textColor = [210, 130, 20];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [40, 140, 60];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  addFooters(doc);
  doc.save(`Ringkasan_Eksekutif_Brownkiss_${Date.now()}.pdf`);
}

// ============================================================================
// 5. EXPORT LAPORAN STOK & VALUASI INVENTORY PDF
// ============================================================================
export function exportInventoryReportPDF(
  ingredients: Ingredient[],
  settings?: ErpSettings
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let startY = drawHeaderAndFooter(doc, {
    title: 'LAPORAN STOK & VALUASI INVENTARIS BAHAN BAKU',
    period: 'Kondisi Stok Realtime',
    settings
  });

  const totalItems = ingredients.length;
  const lowStockCount = ingredients.filter((i) => i.qty <= i.minQty).length;
  const totalValuation = ingredients.reduce((sum, i) => sum + i.qty * i.costPerUnit, 0);

  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 6) / 3;
  const boxHeight = 15;

  const kpis = [
    { label: 'Total Item Bahan Baku', val: `${totalItems} Bahan` },
    { label: 'Bahan Perlu Restock', val: `${lowStockCount} Item` },
    { label: 'Total Valuasi Aset Stok', val: `Rp ${totalValuation.toLocaleString('id-ID')}` }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
    doc.setDrawColor(TOASTED[0], TOASTED[1], TOASTED[2]);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(kpi.label, x + 3, startY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    if (idx === 1 && lowStockCount > 0) doc.setTextColor(200, 30, 30);
    else doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);

    doc.text(kpi.val, x + 3, startY + 11);
  });

  startY += boxHeight + 6;

  const tableHeaders = ['ID', 'Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Min. Stok', 'Harga / Satuan', 'Total Valuasi (Rp)'];
  const tableRows = ingredients.map((ing) => {
    const totalCost = ing.qty * ing.costPerUnit;
    return [
      ing.id,
      ing.name,
      ing.category,
      `${ing.qty} ${ing.unit}`,
      `${ing.minQty} ${ing.unit}`,
      `Rp ${ing.costPerUnit.toLocaleString('id-ID')} / ${ing.unit}`,
      `Rp ${totalCost.toLocaleString('id-ID')}`
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: CHARCOAL as [number, number, number]
    },
    alternateRowStyles: {
      fillColor: CREAM as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26 },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 32, halign: 'right' },
      6: { cellWidth: 32, halign: 'right' }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  addFooters(doc);
  doc.save(`Laporan_Stok_Bahan_Brownkiss_${Date.now()}.pdf`);
}

/**
 * Generates & downloads a PDF Report for Daily Closing (Tutup Buku Harian)
 */
export function exportClosingReportPDF(
  report: ClosingReport,
  snapshot?: InventorySnapshot,
  settings?: ErpSettings
) {
  const doc = new jsPDF();

  drawHeaderAndFooter(doc, {
    title: 'LAPORAN TUTUP BUKU HARIAN (DAILY CLOSING)',
    subtitle: `Periode Tanggal: ${report.date}`,
    period: report.date,
    settings
  });

  let startY = 46;

  // Key Information Cards
  const kpiData = [
    { label: 'Total Penjualan', val: `Rp ${report.totalPenjualan.toLocaleString('id-ID')}` },
    { label: 'Kas Tunai Sistem', val: `Rp ${report.totalTunaiSistem.toLocaleString('id-ID')}` },
    { label: 'Uang Fisik Laci', val: `Rp ${report.kasFisik.toLocaleString('id-ID')}` },
    {
      label: 'Selisih Kas',
      val: `${report.selisihKas >= 0 ? '+' : ''}Rp ${report.selisihKas.toLocaleString('id-ID')}`
    }
  ];

  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 16;

  kpiData.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
    doc.setDrawColor(TOASTED[0], TOASTED[1], TOASTED[2]);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(kpi.label, x + 3, startY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    if (idx === 3 && report.selisihKas < 0) {
      doc.setTextColor(180, 40, 40);
    } else if (idx === 3 && report.selisihKas > 0) {
      doc.setTextColor(30, 120, 180);
    } else {
      doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    }

    doc.text(kpi.val, x + 3, startY + 11);
  });

  startY += boxHeight + 8;

  // Executive Summary Details Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
  doc.text('1. RINGKASAN PENUTUPAN BUKU', 14, startY);
  startY += 4;

  const summaryRows = [
    ['Tanggal & Waktu Tutup Buku', `${report.date} (Status: ${report.status})`],
    ['Otoritas Pengunci (Staff / User)', `${report.closedBy} (${report.closedByRole || 'Manager'})`],
    ['Total Omset Penjualan Sistem', `Rp ${report.totalPenjualan.toLocaleString('id-ID')}`],
    ['Pemasukan QRIS / Transfer Bank', `Rp ${report.totalQrisSistem.toLocaleString('id-ID')}`],
    ['Pemasukan Tunai Sistem', `Rp ${report.totalTunaiSistem.toLocaleString('id-ID')}`],
    ['Uang Fisik di Laci Kasir', `Rp ${report.kasFisik.toLocaleString('id-ID')}`],
    [
      'Selisih Kas (Fisik - Sistem)',
      `${report.selisihKas === 0 ? 'Rp 0 (Pas / Match)' : (report.selisihKas > 0 ? `+Rp ${report.selisihKas.toLocaleString('id-ID')} (Surplus)` : `-Rp ${Math.abs(report.selisihKas).toLocaleString('id-ID')} (Defisit)`)}`
    ],
    ['Sisa Donat Display Dizerokan (Waste)', `${report.wasteDonutQty} pcs`],
    ['Catatan Operasional', report.notes || '-']
  ];

  autoTable(doc, {
    startY: startY,
    head: [['Parameter Operasional', 'Nilai / Rincian']],
    body: summaryRows,
    theme: 'plain',
    headStyles: {
      fillColor: BURGUNDY as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: CHARCOAL as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // Inventory Snapshot Section if available
  if (snapshot && snapshot.snapshotData && snapshot.snapshotData.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(`2. SNAPSHOT STOK BAHAN BAKU AKHIR (Valuasi Total: Rp ${snapshot.totalValue.toLocaleString('id-ID')})`, 14, startY);
    startY += 4;

    const snapHeaders = ['ID', 'Nama Bahan', 'Kategori', 'Jumlah Akhir', 'Cost / Satuan', 'Valuasi (Rp)'];
    const snapRows = snapshot.snapshotData.map((item) => [
      item.ingredientId,
      item.ingredientName,
      item.category,
      `${item.qty} ${item.unit}`,
      `Rp ${item.costPerUnit.toLocaleString('id-ID')}`,
      `Rp ${(item.qty * item.costPerUnit).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: startY,
      head: [snapHeaders],
      body: snapRows,
      theme: 'grid',
      headStyles: {
        fillColor: BURGUNDY as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: CHARCOAL as [number, number, number]
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 32, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 14, right: 14, bottom: 18 }
    });
  }

  addFooters(doc);
  doc.save(`Laporan_Tutup_Buku_${report.date.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
