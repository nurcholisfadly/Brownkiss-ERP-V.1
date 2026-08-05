import React from 'react';
import { CashTransaction } from '../../../types';
import { ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';

interface CashTransactionModalProps {
  modalType: 'MASUK' | 'KELUAR';
  amountInput: string;
  categoryInput: CashTransaction['category'];
  noteInput: string;
  paymentMethodInput: 'Tunai' | 'Transfer Bank' | 'QRIS';
  currencySymbol: string;
  setAmountInput: (val: string) => void;
  setCategoryInput: (val: CashTransaction['category']) => void;
  setNoteInput: (val: string) => void;
  setPaymentMethodInput: (val: 'Tunai' | 'Transfer Bank' | 'QRIS') => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CashTransactionModal({
  modalType,
  amountInput,
  categoryInput,
  noteInput,
  paymentMethodInput,
  currencySymbol,
  setAmountInput,
  setCategoryInput,
  setNoteInput,
  setPaymentMethodInput,
  onClose,
  onSubmit,
}: CashTransactionModalProps) {
  const isMasuk = modalType === 'MASUK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-md p-6 shadow-xl animate-rise space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <h3 className="font-serif font-medium text-lg text-[#2A2420] flex items-center gap-2">
            {isMasuk ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowDownLeft className="w-5 h-5 text-red-600" />
            )}
            <span>{isMasuk ? 'Catat Kas Masuk (Pemasukan)' : 'Catat Kas Keluar (Pengeluaran)'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Nominal Transaksi ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9A8E80]">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="1"
                required
                className="w-full pl-9 pr-3 py-2 border border-[#E9E2D8] rounded-xl text-sm font-mono outline-none focus:border-[#8B3350]"
                placeholder="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Kategori
            </label>
            <select
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value as any)}
            >
              {isMasuk ? (
                <>
                  <option value="Modal Awal">💰 Modal Awal / Tambahan Modal</option>
                  <option value="Penjualan Non-POS">🛍️ Penjualan Non-POS / Pesanan Khusus</option>
                  <option value="Setoran Tunai">BCA/Mandiri Setoran Tunai</option>
                  <option value="Lainnya">📂 Pemasukan Lainnya</option>
                </>
              ) : (
                <>
                  <option value="Pembelian Bahan">🌾 Pembelian Bahan Baku / Kemasan</option>
                  <option value="Operasional (Listrik/Gas/Air)">⚡ Operasional (Listrik/Gas/Air)</option>
                  <option value="Gaji Staff">👥 Gaji Staff &amp; Bonus Baker</option>
                  <option value="Sewa Tempat">🏢 Sewa Tempat / Booth</option>
                  <option value="Pemasaran/Iklan">📢 Pemasaran &amp; Iklan Promo</option>
                  <option value="Maintenance Alat">🔧 Maintenance Mesin &amp; Peralatan</option>
                  <option value="Prive / Ambil Modal">🏧 Prive / Pengambilan Pemilik</option>
                  <option value="Lainnya">📂 Pengeluaran Lainnya</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Metode Pembayaran
            </label>
            <select
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
              value={paymentMethodInput}
              onChange={(e) => setPaymentMethodInput(e.target.value as any)}
            >
              <option value="Tunai">💵 Tunai (Kas Fisik)</option>
              <option value="Transfer Bank">🏦 Transfer Bank</option>
              <option value="QRIS">📱 QRIS / E-Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Keterangan / Catatan
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none focus:border-[#8B3350]"
              placeholder={isMasuk ? 'Contoh: Setoran modal awal shift pagi' : 'Contoh: Beli tabung gas 3kg &amp; sabun cuci'}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
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
              className={`px-5 py-2 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isMasuk ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'
              }`}
            >
              {isMasuk ? 'Simpan Kas Masuk' : 'Simpan Kas Keluar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
