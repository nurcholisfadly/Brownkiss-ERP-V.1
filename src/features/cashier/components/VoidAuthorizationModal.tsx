import React, { useState } from 'react';
import { Sale, ErpSettings, ErpUser } from '../../../types';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface VoidAuthorizationModalProps {
  targetSale: Sale;
  currentUser?: ErpUser | null;
  settings?: ErpSettings;
  currencySymbol: string;
  onClose: () => void;
  onConfirmVoid: (saleId: string, voidedBy: string, voidReason: string) => void;
}

export default function VoidAuthorizationModal({
  targetSale,
  currentUser,
  settings,
  currencySymbol,
  onClose,
  onConfirmVoid,
}: VoidAuthorizationModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [reasonInput, setReasonInput] = useState('Salah Input Menu');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSupervisorOrOwner = currentUser?.role === 'Owner' || currentUser?.role === 'Manager';

  const handleProcessVoid = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Verify PIN if required or check role
    const correctPin = settings?.voidAuthorizationPin || '1234';

    if (!isSupervisorOrOwner) {
      if (pinInput !== correctPin) {
        setErrorMsg('PIN Otoritas Void Supervisor salah!');
        return;
      }
    }

    if (!reasonInput.trim()) {
      setErrorMsg('Alasan pembatalan wajib diisi!');
      return;
    }

    const voidedBy = currentUser?.name || 'Supervisor / Manager';
    onConfirmVoid(targetSale.id, voidedBy, reasonInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-md p-6 shadow-xl animate-rise space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <h3 className="font-serif font-bold text-base text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Otoritas Pembatalan Transaksi (Void)</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-none" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleProcessVoid} className="space-y-4">
          <div className="bg-[#FBF7F2] p-3 rounded-xl border border-[#E9E2D8] text-xs space-y-1">
            <p className="font-bold text-[#2A2420]">
              Invoice: #{targetSale.invoiceNo || targetSale.id}
            </p>
            <p className="text-[#5C5248]">
              Total Nominal: <strong>{currencySymbol} {targetSale.total.toLocaleString('id-ID')}</strong>
            </p>
            <p className="text-[#8F8377] text-[10px]">
              Item: {targetSale.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
            </p>
          </div>

          {!isSupervisorOrOwner && (
            <div>
              <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
                PIN Otoritas Supervisor / Owner
              </label>
              <input
                type="password"
                maxLength={6}
                required
                className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-center text-lg font-mono tracking-widest outline-none focus:border-[#8B3350]"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#5C5248] uppercase tracking-wider mb-1">
              Alasan Pembatalan Transaksi (Wajib)
            </label>
            <select
              className="w-full px-3 py-2 border border-[#E9E2D8] rounded-xl text-xs outline-none bg-white cursor-pointer"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
            >
              <option value="Salah Input Menu">🍩 Salah Input Menu / Varian Donat</option>
              <option value="Pelanggan Batal Beli">🛒 Pelanggan Batal Beli / Perubahan Pesanan</option>
              <option value="Pembayaran Gagal / Dobel">💳 Pembayaran Gagal / Dobel Scan QRIS</option>
              <option value="Kesalahan Sistem / Kasir">🧑‍💻 Kesalahan Operasional Kasir</option>
              <option value="Lainnya">❓ Alasan Lainnya</option>
            </select>
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
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Batalkan Transaksi (Void)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
