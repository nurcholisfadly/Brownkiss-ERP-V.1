export type ActiveView =
  | 'ringkasan'
  | 'stok'
  | 'resep'
  | 'produksi'
  | 'kasir'
  | 'rekap'
  | 'keuangan'
  | 'pengaturan';

export const VIEWS = {
  RINGKASAN: 'ringkasan' as ActiveView,
  STOK: 'stok' as ActiveView,
  RESEP: 'resep' as ActiveView,
  PRODUKSI: 'produksi' as ActiveView,
  KASIR: 'kasir' as ActiveView,
  REKAP: 'rekap' as ActiveView,
  KEUANGAN: 'keuangan' as ActiveView,
  PENGATURAN: 'pengaturan' as ActiveView,
};
