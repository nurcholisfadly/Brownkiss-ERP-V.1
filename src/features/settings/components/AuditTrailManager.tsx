import React, { useState, useMemo } from 'react';
import { SecurityLog, ErpSettings } from '../../../types';
import { exportAuditTrailPDF } from '../../../utils/pdfExport';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  FileText,
  User, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Lock,
  Tag
} from 'lucide-react';

interface AuditTrailManagerProps {
  securityLogs: SecurityLog[];
  settings?: ErpSettings;
  onAddSecurityLog?: (event: string, level: SecurityLog['level'], details?: any) => void;
}

export default function AuditTrailManager({
  securityLogs,
  settings,
  onAddSecurityLog
}: AuditTrailManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [selectedLevel, setSelectedLevel] = useState<string>('semua');
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Category filter options matching user requirement
  const categories = [
    { key: 'semua', label: 'Semua Kategori' },
    { key: 'Login', label: 'Login Sesi' },
    { key: 'Logout', label: 'Logout Sesi' },
    { key: 'Restock', label: 'Restock Bahan' },
    { key: 'Koreksi Stok', label: 'Koreksi Stok' },
    { key: 'Perubahan Harga', label: 'Perubahan Harga' },
    { key: 'Void Transaksi', label: 'Void Transaksi' },
    { key: 'Penghapusan Data', label: 'Hapus Data' },
    { key: 'Perubahan Setting', label: 'Setting ERP' },
    { key: 'Perubahan User', label: 'Pengguna Staff' },
    { key: 'Lainnya', label: 'Lainnya' },
  ];

  // Helper to sanitize CSV against Formula Injection
  const sanitizeCSVCell = (val: any): string => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.some(char => str.startsWith(char))) {
      str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return securityLogs.filter((log) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        !term ||
        log.event.toLowerCase().includes(term) ||
        (log.userName && log.userName.toLowerCase().includes(term)) ||
        (log.userRole && log.userRole.toLowerCase().includes(term)) ||
        (log.beforeValue && log.beforeValue.toLowerCase().includes(term)) ||
        (log.afterValue && log.afterValue.toLowerCase().includes(term));

      // 2. Category filter
      let matchesCategory = true;
      if (selectedCategory !== 'semua') {
        if (log.category) {
          matchesCategory = log.category === selectedCategory;
        } else {
          // Infer category if missing
          const evt = log.event.toLowerCase();
          if (selectedCategory === 'Login') matchesCategory = evt.includes('login') || evt.includes('masuk');
          else if (selectedCategory === 'Logout') matchesCategory = evt.includes('logout') || evt.includes('keluar');
          else if (selectedCategory === 'Restock') matchesCategory = evt.includes('restock') || evt.includes('pembelian');
          else if (selectedCategory === 'Koreksi Stok') matchesCategory = evt.includes('koreksi') || evt.includes('stok');
          else if (selectedCategory === 'Perubahan Harga') matchesCategory = evt.includes('harga') || evt.includes('hpp');
          else if (selectedCategory === 'Void Transaksi') matchesCategory = evt.includes('void') || evt.includes('batal');
          else if (selectedCategory === 'Penghapusan Data') matchesCategory = evt.includes('hapus') || evt.includes('delete');
          else if (selectedCategory === 'Perubahan Setting') matchesCategory = evt.includes('setting') || evt.includes('konfigurasi');
          else if (selectedCategory === 'Perubahan User') matchesCategory = evt.includes('user') || evt.includes('staff');
          else matchesCategory = false;
        }
      }

      // 3. Level filter
      const matchesLevel = selectedLevel === 'semua' || log.level === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [securityLogs, searchTerm, selectedCategory, selectedLevel]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada data audit log untuk diekspor!');
      return;
    }

    const headers = ['ID Log', 'Tanggal', 'Jam', 'Nama User', 'Role', 'Kategori', 'Severity Level', 'Aktivitas Detail', 'Nilai Sebelum', 'Nilai Sesudah'];
    
    const rows = filteredLogs.map((log) => [
      sanitizeCSVCell(log.id),
      sanitizeCSVCell(log.date || log.timestamp.split(' ')[0] || '-'),
      sanitizeCSVCell(log.time || log.timestamp.split(' ')[1] || '-'),
      sanitizeCSVCell(log.userName || 'Fadli Berniaga'),
      sanitizeCSVCell(log.userRole || 'Owner'),
      sanitizeCSVCell(log.category || 'Lainnya'),
      sanitizeCSVCell(log.level),
      sanitizeCSVCell(log.event),
      sanitizeCSVCell(log.beforeValue || '-'),
      sanitizeCSVCell(log.afterValue || '-'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Add UTF-8 BOM
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Trail_Brownkiss_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada data audit log untuk diekspor ke PDF!');
      return;
    }
    exportAuditTrailPDF(filteredLogs, settings);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#2A2420] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8B3350]" />
            Audit Trail &amp; Log Keamanan Sistem
          </h3>
          <p className="text-xs text-[#9A8E80] mt-0.5">
            Pencatatan real-time seluruh aktivitas pengguna, perubahan stok, void transaksi, hingga pembaruan konfigurasi ERP.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-[#FBF7F2] border border-[#E9E2D8] hover:border-[#8B3350] text-[#2A2420] hover:text-[#8B3350] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Ekspor CSV"
          >
            <Download className="w-4 h-4 text-[#5C5248]" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-[#8B3350] hover:bg-[#722740] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            title="Unduh Audit Trail PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari user, aktivitas, nilai..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-[#9A8E80] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all font-medium text-[#2A2420]"
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div>
          <select
            value={selectedLevel}
            onChange={(e) => {
              setSelectedLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all font-medium text-[#2A2420]"
          >
            <option value="semua">Semua Severity Level</option>
            <option value="Aman">Aman (Informasi)</option>
            <option value="Peringatan">Peringatan (Warning)</option>
            <option value="Bahaya">Bahaya (Critical Alert)</option>
          </select>
        </div>

        {/* Items per Page */}
        <div>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all font-medium text-[#2A2420]"
          >
            <option value={15}>Tampilkan 15 Baris</option>
            <option value={30}>Tampilkan 30 Baris</option>
            <option value={50}>Tampilkan 50 Baris</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E9E2D8] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBF7F2] border-b border-[#E9E2D8] text-[11px] font-bold text-[#5C5248] uppercase tracking-wider">
                <th className="py-3 px-4">Waktu &amp; Tanggal</th>
                <th className="py-3 px-4">Pengguna (User)</th>
                <th className="py-3 px-4">Kategori &amp; Level</th>
                <th className="py-3 px-4">Aktivitas Detail</th>
                <th className="py-3 px-4">Perubahan Nilai (Sebelum &rarr; Sesudah)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E2D8] text-xs">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#9A8E80]">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-[#C9BEB0]" />
                    <p className="font-semibold text-sm text-[#2A2420]">Tidak ada riwayat log yang sesuai filter</p>
                    <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau kategori filter di atas.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  let badgeClass = 'bg-[#7FA88B]/10 text-[#4A6B53] border-[#7FA88B]/30';
                  if (log.level === 'Bahaya') {
                    badgeClass = 'bg-[#B3432F]/10 text-[#B3432F] border-[#B3432F]/30';
                  } else if (log.level === 'Peringatan') {
                    badgeClass = 'bg-[#C08A34]/10 text-[#C08A34] border-[#C08A34]/30';
                  }

                  const dateDisplay = log.date || (log.timestamp ? log.timestamp.split(' ')[0] : '-');
                  const timeDisplay = log.time || (log.timestamp ? log.timestamp.split(' ')[1] : '-');

                  return (
                    <tr key={log.id} className="hover:bg-[#FBF7F2]/60 transition-colors">
                      {/* Waktu & Tanggal */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#5C5248] whitespace-nowrap">
                        <div className="font-bold text-[#2A2420]">{dateDisplay}</div>
                        <div className="text-[10px] text-[#9A8E80] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {timeDisplay}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#2A2420]">
                          {log.userName || 'Fadli Berniaga'}
                        </div>
                        <span className="inline-block text-[10px] font-mono text-[#8F8377] bg-[#F3EDE4] px-1.5 py-0.5 rounded-md mt-0.5">
                          {log.userRole || 'Owner'}
                        </span>
                      </td>

                      {/* Kategori & Level */}
                      <td className="py-3 px-4 whitespace-nowrap space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badgeClass}`}>
                          {log.level}
                        </span>
                        {log.category && (
                          <div className="text-[10px] text-[#9A8E80] font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3 text-[#8B3350]" />
                            {log.category}
                          </div>
                        )}
                      </td>

                      {/* Aktivitas Detail */}
                      <td className="py-3 px-4 text-[#2A2420] max-w-xs font-medium">
                        {log.event}
                      </td>

                      {/* Before & After Value */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {log.beforeValue && log.beforeValue !== '-' ? (
                          <div className="space-y-1">
                            <div className="text-[#B3432F] bg-red-50/60 border border-red-100 px-2 py-1 rounded-md text-[10px] flex items-center gap-1">
                              <span className="font-bold uppercase text-[9px] text-[#B3432F]/70">Sebelum:</span>
                              <span className="truncate">{log.beforeValue}</span>
                            </div>
                            <div className="text-[#4A6B53] bg-emerald-50/60 border border-emerald-100 px-2 py-1 rounded-md text-[10px] flex items-center gap-1">
                              <span className="font-bold uppercase text-[9px] text-[#4A6B53]/70">Sesudah:</span>
                              <span className="truncate">{log.afterValue || '-'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#9A8E80] text-[10px] italic">- Tidak ada perubahan nilai -</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E9E2D8] bg-[#FBF7F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-[#9A8E80] font-mono text-[11px]">
            Menampilkan <span className="font-bold text-[#2A2420]">{paginatedLogs.length}</span> dari <span className="font-bold text-[#2A2420]">{filteredLogs.length}</span> total audit log
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-[#E9E2D8] rounded-xl bg-white text-[#5C5248] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3EDE4] transition-all cursor-pointer font-semibold"
            >
              &larr; Prev
            </button>
            <span className="font-mono text-xs font-bold text-[#2A2420] px-2">
              Hal {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-[#E9E2D8] rounded-xl bg-white text-[#5C5248] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3EDE4] transition-all cursor-pointer font-semibold"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
