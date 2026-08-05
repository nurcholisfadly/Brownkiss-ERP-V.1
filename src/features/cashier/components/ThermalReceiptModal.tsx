import React, { useState } from 'react';
import { Sale, ErpSettings } from '../../../types';
import { Bluetooth, CheckCircle, Printer, X } from 'lucide-react';

interface ThermalReceiptModalProps {
  sale: Sale;
  settings?: ErpSettings;
  currencySymbol: string;
  onClose: () => void;
}

export default function ThermalReceiptModal({
  sale,
  settings,
  currencySymbol,
  onClose,
}: ThermalReceiptModalProps) {
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [btPrintLog, setBtPrintLog] = useState<string | null>(null);

  const handlePrintStandard = () => {
    window.print();
  };

  const handlePrintBluetoothThermal = async () => {
    setIsPrintingBt(true);
    setBtPrintLog('Mencari printer Bluetooth...');

    try {
      if (!(navigator as any).bluetooth) {
        alert('Browser ini tidak mendukung Web Bluetooth API. Gunakan Chrome di Android/PC.');
        setIsPrintingBt(false);
        setBtPrintLog(null);
        return;
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455'],
      });

      setBtPrintLog(`Menghubungkan ke ${device.name || 'Printer Thermal'}...`);
      const server = await device.gatt.connect();

      setBtPrintLog('Mengirim data cetak...');
      // Simple text print payload
      const encoder = new TextEncoder();
      const textData = `
--------------------------------
${settings?.storeName || "BROWNKISS ERP"}
${settings?.storeAddress || "Yogyakarta"}
--------------------------------
Inv: ${sale.invoiceNo || sale.id}
Tgl: ${sale.date}
Kasir: ${sale.customerName || 'Staff'}
--------------------------------
${sale.items.map((i) => `${i.qty}x ${i.name} = Rp ${(i.qty * i.price).toLocaleString('id-ID')}`).join('\n')}
--------------------------------
TOTAL: Rp ${sale.total.toLocaleString('id-ID')}
Bayar: ${sale.paymentMethod}
--------------------------------
Terima Kasih Atas Kunjungan Anda!
--------------------------------

\n\n\n`;

      const data = encoder.encode(textData);

      // Attempt sending in chunks
      const services = await server.getPrimaryServices();
      if (services.length > 0) {
        const characteristics = await services[0].getCharacteristics();
        if (characteristics.length > 0) {
          const char = characteristics[0];
          await char.writeValue(data);
        }
      }

      setBtPrintLog('Berhasil mencetak ke printer Bluetooth!');
      setTimeout(() => {
        setIsPrintingBt(false);
        setBtPrintLog(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setBtPrintLog(`Gagal Bluetooth: ${err.message || 'Koneksi terputus'}`);
      setIsPrintingBt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E9E2D8] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-rise space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E2D8]">
          <h3 className="font-serif font-bold text-base text-[#2A2420] flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#8B3350]" />
            <span>Nota Transaksi Kasir</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#9A8E80] hover:text-[#2A2420] text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Printable Thermal Receipt Layout */}
        <div className="bg-[#FBF7F2] border border-[#E9E2D8] p-4 rounded-xl font-mono text-xs space-y-2 text-[#2A2420]">
          <div className="text-center pb-2 border-b border-dashed border-[#E9E2D8]">
            <p className="font-bold text-sm uppercase">{settings?.storeName || "BROWNKISS BAKERY"}</p>
            <p className="text-[10px] text-[#8F8377]">{settings?.storeAddress || 'Yogyakarta'}</p>
          </div>

          <div className="text-[10px] text-[#5C5248] space-y-0.5 border-b border-dashed border-[#E9E2D8] pb-2">
            <p>No: {sale.invoiceNo || sale.id}</p>
            <p>Tgl: {sale.date}</p>
            <p>Pelanggan: {sale.customerName || 'Pelanggan Umum'}</p>
          </div>

          <div className="space-y-1.5 py-1">
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {item.qty}x {item.name}
                </span>
                <span className="font-bold">
                  {currencySymbol} {(item.qty * item.price).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-[#E9E2D8] pt-2 space-y-1 text-xs">
            <div className="flex justify-between font-bold text-sm text-[#8B3350]">
              <span>TOTAL</span>
              <span>
                {currencySymbol} {sale.total.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-[#5C5248]">
              <span>Metode Bayar</span>
              <span>{sale.paymentMethod}</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-dashed border-[#E9E2D8] text-[10px] text-[#8F8377]">
            <p>Terima Kasih Atas Kunjungan Anda!</p>
            <p>Donat Nikmat Sajian Artisan</p>
          </div>
        </div>

        {btPrintLog && (
          <p className="text-[11px] text-center font-mono font-semibold text-indigo-800 bg-indigo-50 p-2 rounded-xl">
            {btPrintLog}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handlePrintStandard}
            className="px-3 py-2 border border-[#E9E2D8] text-[#2A2420] hover:bg-gray-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Standard</span>
          </button>

          <button
            type="button"
            disabled={isPrintingBt}
            onClick={handlePrintBluetoothThermal}
            className="px-3 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Bluetooth className="w-4 h-4 text-cyan-300" />
            <span>Print Bluetooth</span>
          </button>
        </div>
      </div>
    </div>
  );
}
