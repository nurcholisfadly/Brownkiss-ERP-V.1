import { ErpSettings, ErpUser } from '../types';

/**
 * Single source of truth for ERP Default Settings and Fallback Values
 */
export const DEFAULT_SETTINGS: ErpSettings = {
  storeName: "Brownkiss ERP",
  storeAddress: "Jl. Kebon Jeruk No. 12, Jakarta",
  contactNumber: "0812-3456-7890",
  taxPercent: 10,
  servicePercent: 0,
  currency: "Rp",
  receiptHeader: "Terima kasih atas kunjungan Anda!",
  receiptFooter: "Brownkiss lezat diproduksi fresh setiap hari",
  allowOverSell: false,
  voidAuthorizationPin: '1234',
};

export const DEFAULT_CURRENCY = 'Rp';

export const DEFAULT_CUSTOMER = {
  name: 'Umum',
  address: '-',
  shippingCost: '0',
} as const;

export const DEFAULT_USERS: ErpUser[] = [
  {
    id: 'usr_init_2',
    name: 'Fadli Berniaga',
    email: 'fadliberniaga@gmail.com',
    role: 'Owner',
    status: 'Aktif',
    password: '123456',
  },
];
