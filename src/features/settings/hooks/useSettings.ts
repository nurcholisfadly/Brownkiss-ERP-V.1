import { useState, FormEvent, ChangeEvent } from 'react';
import { ErpUser, ErpSettings, SecurityLog } from '../../../types';
import { hashPassword } from '../../../supabaseClient';

export interface UseSettingsOptions {
  settings: ErpSettings;
  onUpdateSettings: (updated: ErpSettings) => void;
  users: ErpUser[];
  onAddUser: (user: Omit<ErpUser, 'id'>) => void;
  onUpdateUser: (user: ErpUser) => void;
  onDeleteUser: (id: string) => void;
  securityLogs?: SecurityLog[];
  cloudSyncEnabled: boolean;
  onToggleCloudSync: (enabled: boolean) => void;
  cloudStatus: 'idle' | 'syncing' | 'connected' | 'error';
  cloudErrorMessage: string;
  isErpUsersTableMissing?: boolean;
  onForceSync: () => void;
  onPushToCloud: () => void;
  onResetAllData?: () => void;
}

export function useSettings({
  settings,
  onUpdateSettings,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  securityLogs = [],
  cloudSyncEnabled,
  onToggleCloudSync,
  cloudStatus,
  cloudErrorMessage,
  isErpUsersTableMissing = false,
  onForceSync,
  onPushToCloud,
  onResetAllData,
}: UseSettingsOptions) {
  // Local states for settings form
  const [storeName, setStoreName] = useState(settings.storeName || "Brownkiss");
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress || 'Jl. Kebon Jeruk No. 12, Jakarta');
  const [contactNumber, setContactNumber] = useState(settings.contactNumber || '0812-3456-7890');
  const [taxPercent, setTaxPercent] = useState(String(settings.taxPercent ?? 10));
  const [servicePercent, setServicePercent] = useState(String(settings.servicePercent ?? 0));
  const [currency, setCurrency] = useState(settings.currency || 'Rp');
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader || 'Terima kasih atas kunjungan Anda!');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || 'Brownkiss diproduksi segar setiap hari');
  const [allowOverSell, setAllowOverSell] = useState(settings.allowOverSell ?? false);
  const [voidAuthorizationPin, setVoidAuthorizationPin] = useState(settings.voidAuthorizationPin || '1234');

  // User management form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState<ErpUser['role']>('Kasir');
  const [newUserStatus, setNewUserStatus] = useState<ErpUser['status']>('Aktif');

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'database' | 'audit'>('profile');
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [dbUpdateNotice, setDbUpdateNotice] = useState<string | null>(null);

  const triggerDbNotice = (message: string) => {
    setDbUpdateNotice(message);
    setTimeout(() => {
      setDbUpdateNotice(null);
    }, 4500);
  };

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    const updated: ErpSettings = {
      storeName,
      storeAddress,
      contactNumber,
      taxPercent: parseFloat(taxPercent) || 0,
      servicePercent: parseFloat(servicePercent) || 0,
      currency,
      receiptHeader,
      receiptFooter,
      allowOverSell,
      voidAuthorizationPin,
    };
    onUpdateSettings(updated);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleAddUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      alert('Mohon isi nama lengkap dan alamat email staff!');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === newUserEmail.toLowerCase().trim())) {
      alert('Email sudah terdaftar untuk pengguna lain!');
      return;
    }

    try {
      const hashedPassword = await hashPassword(newUserPassword || '123456');
      await onAddUser({
        name: newUserName,
        email: newUserEmail.toLowerCase().trim(),
        role: newUserRole,
        status: newUserStatus,
        password: hashedPassword,
      });

      if (cloudSyncEnabled) {
        triggerDbNotice('Pendaftaran Sukses: Data staff baru berhasil disimpan & disinkronkan ke Database Supabase.');
      } else {
        triggerDbNotice('Disimpan Lokal: Data staff baru berhasil disimpan di browser. Aktifkan Auto-Sync untuk mengirim ke Supabase.');
      }

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('123456');
      setNewUserRole('Kasir');
      setNewUserStatus('Aktif');
    } catch (err: any) {
      console.error(err);
      triggerDbNotice(`Gagal Menyimpan: Terjadi kesalahan saat menyimpan ke Supabase Cloud - ${err.message || String(err)}`);
    }
  };

  const toggleUserStatus = async (user: ErpUser) => {
    const updatedStatus: ErpUser['status'] = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    try {
      await onUpdateUser({
        ...user,
        status: updatedStatus,
      });
      if (cloudSyncEnabled) {
        triggerDbNotice(`Database Terupdate: Status ${user.name} berhasil diubah menjadi ${updatedStatus}.`);
      } else {
        triggerDbNotice(`Lokal Terupdate: Status ${user.name} berhasil diubah menjadi ${updatedStatus} (Lokal).`);
      }
    } catch (err: any) {
      console.error(err);
      triggerDbNotice(`Gagal Memperbarui: Gagal mengubah status ke Supabase - ${err.message || String(err)}`);
    }
  };

  const handleRoleChange = async (user: ErpUser, newRole: ErpUser['role']) => {
    try {
      await onUpdateUser({
        ...user,
        role: newRole,
      });
      if (cloudSyncEnabled) {
        triggerDbNotice(`Database Terupdate: Peran ${user.name} berhasil diubah menjadi ${newRole}.`);
      } else {
        triggerDbNotice(`Lokal Terupdate: Peran ${user.name} berhasil diubah menjadi ${newRole} (Lokal).`);
      }
    } catch (err: any) {
      console.error(err);
      triggerDbNotice(`Gagal Memperbarui: Gagal mengubah peran ke Supabase - ${err.message || String(err)}`);
    }
  };

  const handlePasswordChange = async (user: ErpUser, newPassword: string) => {
    if (!newPassword || !newPassword.trim()) return;
    try {
      const hashedPassword = await hashPassword(newPassword.trim());
      await onUpdateUser({
        ...user,
        password: hashedPassword,
      });
      if (cloudSyncEnabled) {
        triggerDbNotice(`Database Terupdate: Kata sandi untuk ${user.name} berhasil diperbarui.`);
      } else {
        triggerDbNotice(`Lokal Terupdate: Kata sandi untuk ${user.name} berhasil diperbarui (Lokal).`);
      }
    } catch (err: any) {
      console.error(err);
      triggerDbNotice(`Gagal Memperbarui: Gagal memperbarui kata sandi ke Supabase - ${err.message || String(err)}`);
    }
  };

  const handleExportBackup = () => {
    const dataToBackup = {
      settings: {
        storeName,
        storeAddress,
        contactNumber,
        taxPercent,
        servicePercent,
        currency,
        receiptHeader,
        receiptFooter,
        allowOverSell,
        voidAuthorizationPin,
      },
      users,
      exportDate: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `donat_erp_settings_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        if (parsedData.settings) {
          const s = parsedData.settings;
          setStoreName(s.storeName || '');
          setStoreAddress(s.storeAddress || '');
          setContactNumber(s.contactNumber || '');
          setTaxPercent(String(s.taxPercent || 0));
          setServicePercent(String(s.servicePercent || 0));
          setCurrency(s.currency || 'Rp');
          setReceiptHeader(s.receiptHeader || '');
          setReceiptFooter(s.receiptFooter || '');
          setAllowOverSell(s.allowOverSell ?? false);
          setVoidAuthorizationPin(s.voidAuthorizationPin || '1234');

          onUpdateSettings({
            storeName: s.storeName,
            storeAddress: s.storeAddress,
            contactNumber: s.contactNumber,
            taxPercent: parseFloat(s.taxPercent) || 0,
            servicePercent: parseFloat(s.servicePercent) || 0,
            currency: s.currency,
            receiptHeader: s.receiptHeader,
            receiptFooter: s.receiptFooter,
            allowOverSell: s.allowOverSell,
            voidAuthorizationPin: s.voidAuthorizationPin || '1234',
          });
        }
        if (Array.isArray(parsedData.users)) {
          parsedData.users.forEach((u: ErpUser) => {
            if (!users.some((existing) => existing.email === u.email)) {
              onAddUser({
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.status,
              });
            }
          });
        }
        alert('Data cadangan lokal berhasil diimpor!');
      } catch (err) {
        alert('File tidak valid atau terjadi error saat membaca JSON backup.');
      }
    };
    fileReader.readAsText(files[0]);
  };

  return {
    storeName,
    setStoreName,
    storeAddress,
    setStoreAddress,
    contactNumber,
    setContactNumber,
    taxPercent,
    setTaxPercent,
    servicePercent,
    setServicePercent,
    currency,
    setCurrency,
    receiptHeader,
    setReceiptHeader,
    receiptFooter,
    setReceiptFooter,
    allowOverSell,
    setAllowOverSell,
    voidAuthorizationPin,
    setVoidAuthorizationPin,
    newUserName,
    setNewUserName,
    newUserEmail,
    setNewUserEmail,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    newUserStatus,
    setNewUserStatus,
    activeTab,
    setActiveTab,
    isSavedAlert,
    dbUpdateNotice,
    triggerDbNotice,
    handleSaveSettings,
    handleAddUserSubmit,
    toggleUserStatus,
    handleRoleChange,
    handlePasswordChange,
    handleExportBackup,
    handleImportBackup,
  };
}
