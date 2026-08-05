import React, { useState } from 'react';
import { ErpUser, ErpSettings, SecurityLog } from '../../../types';
import { verifyPassword } from '../../../supabaseClient';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import AuditTrailManager from './AuditTrailManager';
import { 
  UserPlus, 
  Trash2, 
  Store, 
  Shield, 
  FileText, 
  Save, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Mail,
  Users,
  RefreshCw,
  Download,
  Upload,
  Coins,
  CloudLightning,
  DownloadCloud,
  UploadCloud,
  Lock,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

function StaffPasswordCell({
  user,
  onPasswordSave
}: {
  user: ErpUser;
  onPasswordSave: (user: ErpUser, newPass: string) => Promise<void>;
}) {
  const [newPass, setNewPass] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newPass.trim()) return;
    setSaving(true);
    await onPasswordSave(user, newPass);
    setSaving(false);
    setNewPass('');
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          placeholder="••••••••"
          className="w-24 pl-2 pr-6 py-1 font-mono text-xxs bg-[#FBF7F2] border border-[#E9E2D8] rounded-lg focus:bg-white focus:border-[#8B3350] focus:outline-none transition-all text-[#2E2013]"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-[#9A8E80] hover:text-[#2A2420] p-0.5 cursor-pointer"
          title={show ? 'Sembunyikan' : 'Tampilkan'}
        >
          {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      </div>
      {newPass.trim().length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-2 py-1 bg-[#8B3350] hover:bg-[#722740] text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
        >
          {saving ? '...' : 'Simpan'}
        </button>
      )}
    </div>
  );
}

function ResetDataSection({ onResetAllData }: { onResetAllData?: () => void }) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [inputPhrase, setInputPhrase] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const currentUser = useCurrentUser();
  const REQUIRED_PHRASE = "RESET DATA ERP BROWNKISS";

  const handleOpen = () => {
    setInputPassword('');
    setInputPhrase('');
    setErrorMsg('');
    setIsOpenModal(true);
  };

  const handleClose = () => {
    setIsOpenModal(false);
    setInputPassword('');
    setInputPhrase('');
    setErrorMsg('');
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (inputPhrase.trim().toUpperCase() !== REQUIRED_PHRASE) {
      setErrorMsg(`Kalimat konfirmasi tidak sesuai! Harap ketik persis: ${REQUIRED_PHRASE}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const storedPass = currentUser?.password || '123456';
      const isValidPass = await verifyPassword(inputPassword, storedPass);
      if (!isValidPass) {
        setErrorMsg('Kata sandi yang Anda masukkan salah!');
        setIsSubmitting(false);
        return;
      }

      if (onResetAllData) {
        onResetAllData();
      }
      setIsSubmitting(false);
      setIsOpenModal(false);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 7000);
    } catch (err: any) {
      console.error('Reset error:', err);
      setErrorMsg('Gagal memverifikasi kata sandi: ' + (err.message || String(err)));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-serif font-semibold text-base text-[#B3432F] flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#B3432F]" />
            Reset &amp; Kosongkan Seluruh Data ERP
          </h3>
          <p className="text-xs text-[#5C5248] leading-relaxed">
            Pembersihan total seluruh database &amp; simpanan ERP lokal. Menghapus data bahan baku, resep donat, batch produksi dapur, riwayat transaksi penjualan kasir, jurnal kas &amp; keuangan, persediaan kabinet display, serta log aktivitas audit. Fitur ini dilindungi 2-Factor Authentication (Kata Sandi &amp; Kalimat Konfirmasi).
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-none" />
          <span>Seluruh data ERP berhasil direset ke kondisi bersih (kosong).</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white text-red-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Reset Semua Data ERP (Proteksi 2FA: Sandi &amp; Kalimat)</span>
      </button>

      {/* Confirmation Modal 2FA */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl flex-none">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-lg text-red-900">
                  Konfirmasi Hapus Seluruh Data ERP
                </h4>
                <p className="text-xs text-red-700 leading-relaxed mt-1">
                  Peringatan Keamanan: Semua data operasional toko akan dihapus dari sistem. Lakukan 2-Factor Authentication (2FA) di bawah ini untuk mengonfirmasi:
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReset} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-none" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Factor 1: Password */}
              <div className="space-y-1.5 bg-[#FBF7F2] p-3.5 border border-[#E9E2D8] rounded-xl">
                <label className="block text-xs font-bold text-[#2A2420] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#8B3350]" />
                  <span>Faktor 1: Kata Sandi Akun Anda ({currentUser?.name || 'Staff'})</span>
                </label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E9E2D8] rounded-lg focus:border-[#8B3350] focus:outline-none font-mono"
                  required
                />
              </div>

              {/* Factor 2: Sentence phrase */}
              <div className="space-y-1.5 bg-red-50/50 p-3.5 border border-red-200 rounded-xl">
                <label className="block text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-600" />
                  <span>Faktor 2: Ketik Kalimat Konfirmasi Persis</span>
                </label>
                <div className="select-all text-xs font-mono font-extrabold text-red-700 bg-red-100/80 px-2.5 py-1.5 rounded-md border border-red-200 tracking-wide text-center">
                  {REQUIRED_PHRASE}
                </div>
                <input
                  type="text"
                  value={inputPhrase}
                  onChange={(e) => setInputPhrase(e.target.value)}
                  placeholder="Ketik kalimat di atas di sini..."
                  className="w-full px-3 py-2 text-xs bg-white border border-red-300 rounded-lg focus:border-red-600 focus:outline-none font-mono text-red-900 font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !inputPassword || !inputPhrase}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Memverifikasi...' : 'Konfirmasi & Hapus Permanen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface SettingManagerProps {
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

export default function SettingManager(props: SettingManagerProps) {
  const {
    settings,
    users,
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
  } = props;

  const {
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
  } = useSettings(props);

  return (
    <div className="space-y-6" id="settings-manager">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#E9E2D8] gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-[#8B3350] text-[#8B3350] font-bold'
              : 'border-transparent text-[#9A8E80] hover:text-[#2A2420]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Profil Toko & POS</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#8B3350] text-[#8B3350] font-bold'
              : 'border-transparent text-[#9A8E80] hover:text-[#2A2420]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pengguna & Staff ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-[#8B3350] text-[#8B3350] font-bold'
              : 'border-transparent text-[#9A8E80] hover:text-[#2A2420]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Utilitas & Backup</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[#8B3350] text-[#8B3350] font-bold'
              : 'border-transparent text-[#9A8E80] hover:text-[#2A2420]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Audit Trail &amp; Keamanan</span>
        </button>
      </div>

      {isSavedAlert && (
        <div className="bg-emerald-50 text-emerald-700 text-xs p-3.5 rounded-xl border border-emerald-200 flex items-center gap-2 animate-fadeIn shadow-xxs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-none" />
          <span>Konfigurasi toko berhasil disimpan dan sinkronisasi dijalankan!</span>
        </div>
      )}

      {/* ============ TAB 1: STORE PROFILE & POS PARAMETERS ============ */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-5">
            <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#8B3350]" />
              Identitas & Informasi Toko Roti
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#5C5248]">Nama Toko / Bisnis</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#5C5248]">Nomor Kontak / Telepon</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-[#5C5248]">Alamat Lengkap Toko</label>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <hr className="border-[#E9E2D8]" />

            <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2 pt-2">
              <FileText className="w-4 h-4 text-[#8B3350]" />
              Desain Header & Footer Nota POS (Struk Belanja)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#5C5248]">Header Nota (Paling Atas)</label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="Contoh: Terima kasih atas kunjungan Anda!"
                  className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#5C5248]">Footer Nota (Paling Bawah)</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Contoh: Brownkiss lezat, segar setiap hari"
                  className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:ring-2 focus:ring-[#8B3350]/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B3350] hover:bg-[#722740] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Seluruh Pengaturan</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Parameters card */}
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#8B3350]" />
                Parameter Keuangan & Kasir
              </h3>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C5248]">Pajak PPN (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-[#9A8E80] text-xs font-mono">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C5248]">Biaya Layanan / Service Fee (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={servicePercent}
                      onChange={(e) => setServicePercent(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-[#9A8E80] text-xs font-mono">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C5248]">Mata Uang (Currency)</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C5248]">PIN Otoritas Void / Supervisor</label>
                  <input
                    type="password"
                    maxLength={10}
                    value={voidAuthorizationPin}
                    onChange={(e) => setVoidAuthorizationPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none transition-all font-mono tracking-widest text-[#8B3350] font-bold"
                  />
                  <p className="text-[10px] text-[#9A8E80]">PIN supervisor wajib dimasukkan saat Owner/Manager membatalkan transaksi.</p>
                </div>

                <hr className="border-[#E9E2D8] my-3" />

                {/* Over-sell toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7F2] border border-[#E9E2D8]">
                  <div className="space-y-0.5 pr-3">
                    <p className="text-xs font-bold text-[#2A2420]">Penjualan Minus (Over-sell)</p>
                    <p className="text-[10px] text-[#9A8E80] leading-snug">
                      Izinkan kasir menjual rasa donat meskipun stok di kabinet katering kosong.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-none">
                    <input
                      type="checkbox"
                      checked={allowOverSell}
                      onChange={(e) => setAllowOverSell(e.target.checked)}
                      className="sr-only peer cursor-pointer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B3350]" />
                  </label>
                </div>
              </div>
            </div>

            {/* Cloud warning / sync status helper */}
            <div className="bg-[#FBF7F2] border border-[#E9E2D8] rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#2A2420]">
                <Shield className="w-4 h-4 text-[#8B3350]" />
                <span>Otoritas & Hak Akses</span>
              </div>
              <p className="text-[#5C5248] text-xxs leading-relaxed">
                Pengaturan parameter toko ini berlaku global untuk seluruh kasir dan dashboard staff lainnya. 
                {cloudSyncEnabled ? (
                  <span className="text-emerald-700 font-semibold block mt-1">
                    ● Database Cloud Aktif: Parameter ini akan segera di-push ke server Supabase Anda secara aman.
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold block mt-1">
                    ● Mode Offline Lokal: Perubahan saat ini hanya disimpan dalam browser ini saja. Gunakan tombol 'Push' untuk mengunggah ke cloud.
                  </span>
                )}
              </p>
            </div>
          </div>
        </form>
      )}

      {/* ============ TAB 2: USER MANAGEMENT (STAFF/USERS) ============ */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-rise">
          {dbUpdateNotice ? (
            <div className={`flex items-center gap-3 p-3.5 border rounded-2xl animate-fade-in shadow-xs ${
              dbUpdateNotice.includes('Gagal') || dbUpdateNotice.includes('Error')
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  dbUpdateNotice.includes('Gagal') || dbUpdateNotice.includes('Error') ? 'bg-red-400' : 'bg-emerald-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  dbUpdateNotice.includes('Gagal') || dbUpdateNotice.includes('Error') ? 'bg-red-500' : 'bg-emerald-500'
                }`}></span>
              </span>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold font-serif">
                  {dbUpdateNotice.includes('Gagal') || dbUpdateNotice.includes('Error') ? '✗ KESALAHAN DATABASE' : '✓ DATABASE TERUPDATE'}
                </span>
                <span className={`text-xxs font-mono font-medium ${
                  dbUpdateNotice.includes('Gagal') || dbUpdateNotice.includes('Error') ? 'text-red-700' : 'text-emerald-700'
                }`}>{dbUpdateNotice}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 bg-[#FBF7F2] border border-[#E9E2D8] rounded-2xl">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cloudSyncEnabled ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cloudSyncEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#5C5248] font-serif">KONEKSI TABEL: `erp_users`</span>
                <span className="text-xxs text-[#9A8E80] font-mono">
                  {cloudSyncEnabled 
                    ? '● Supabase Cloud Aktif: Setiap pendaftaran staff & pembaruan password tersinkron secara realtime.' 
                    : '● Mode Offline: Perubahan data staff saat ini hanya tersimpan lokal di browser.'}
                </span>
              </div>
            </div>
          )}

          {isErpUsersTableMissing && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-red-800">
                <AlertTriangle className="w-5 h-5 flex-none text-red-600 mt-0.5" />
                <div>
                  <p className="font-serif font-bold text-sm">Tabel `erp_users` Tidak Ditemukan</p>
                  <p className="text-xs text-red-700 leading-relaxed mt-0.5">
                    Kami mendeteksi tabel <strong>erp_users</strong> belum dibuat di database Supabase Anda. 
                    Harap salin perintah SQL di bawah ini, buka <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong>, tempelkan perintahnya, lalu klik <strong>Run</strong>.
                  </p>
                </div>
              </div>
              <div className="bg-gray-900 text-gray-100 rounded-xl p-3 font-mono text-[10px] relative overflow-x-auto whitespace-pre leading-relaxed">
                {`CREATE TABLE IF NOT EXISTS erp_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Owner', 'Manager', 'Kasir', 'Baker')) NOT NULL DEFAULT 'Kasir',
    status TEXT CHECK (status IN ('Aktif', 'Nonaktif')) NOT NULL DEFAULT 'Aktif',
    password TEXT DEFAULT '123456',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kolom password default (antisipasi)
ALTER TABLE erp_users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';

-- Matikan RLS agar aplikasi ERP bisa langsung input/delete dari browser
ALTER TABLE erp_users DISABLE ROW LEVEL SECURITY;`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS erp_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Owner', 'Manager', 'Kasir', 'Baker')) NOT NULL DEFAULT 'Kasir',
    status TEXT CHECK (status IN ('Aktif', 'Nonaktif')) NOT NULL DEFAULT 'Aktif',
    password TEXT DEFAULT '123456',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kolom password default (antisipasi)
ALTER TABLE erp_users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';

-- Matikan RLS agar aplikasi ERP bisa langsung input/delete dari browser
ALTER TABLE erp_users DISABLE ROW LEVEL SECURITY;`);
                    alert('Perintah SQL berhasil disalin! Silakan jalankan di Supabase SQL Editor.');
                  }}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xxs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Salin Perintah SQL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onForceSync();
                  }}
                  className="px-3 py-1.5 bg-[#8B3350] hover:bg-[#722740] text-white text-xxs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-hover" />
                  <span>Cek Ulang & Tarik Data Supabase</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add user form */}
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4 h-fit">
              <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#8B3350]" />
                Tambah Staff / Pengguna Baru
              </h3>
              
              <p className="text-xs text-[#9A8E80]">
                Daftarkan operator, kasir, pemanggang (baker), atau manajer toko baru ke sistem ERP ini.
              </p>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C5248]">Nama Lengkap Staff</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Contoh: Ahmad Subardjo"
                    className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C5248]">Alamat Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#9A8E80]">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="ahmad@brownkiss.com"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C5248]">Kata Sandi (Password)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#9A8E80]">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#5C5248]">Peran (Role)</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none cursor-pointer"
                    >
                      <option value="Kasir">Kasir</option>
                      <option value="Baker">Baker</option>
                      <option value="Manager">Manager</option>
                      <option value="Owner">Owner</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#5C5248]">Status Awal</label>
                    <select
                      value={newUserStatus}
                      onChange={(e) => setNewUserStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs bg-[#FBF7F2] border border-[#E9E2D8] rounded-xl focus:border-[#8B3350] focus:outline-none cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#8B3350] hover:bg-[#722740] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Staff</span>
                </button>
              </form>
            </div>

            {/* User List Panel */}
            <div className="lg:col-span-2 bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-semibold text-base text-[#2A2420]">
                    Daftar Staff & Otoritas Sistem
                  </h3>
                  <p className="text-xs text-[#9A8E80]">
                    Gunakan daftar ini untuk menonaktifkan akun atau mengubah peran akses kerja staff.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold bg-[#8B3350]/15 text-[#8B3350] px-3 py-1 rounded-full">
                  {users.length} Total
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E9E2D8] text-[#5C5248] font-bold">
                      <th className="py-2.5 px-3">Nama Staff</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Kata Sandi</th>
                      <th className="py-2.5 px-3">Peran / Hak</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FBF7F2]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FBF7F2]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#2A2420]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#8B3350]/10 text-[#8B3350] flex items-center justify-center font-mono font-bold text-xxs">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#5C5248] font-mono">{user.email}</td>
                        <td className="py-3 px-3">
                          <StaffPasswordCell user={user} onPasswordSave={handlePasswordChange} />
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user, e.target.value as any)}
                            className="px-2 py-1 bg-[#FBF7F2] border border-[#E9E2D8] rounded-lg text-xxs font-semibold text-[#5C5248] focus:outline-none cursor-pointer"
                          >
                            <option value="Kasir">Kasir</option>
                            <option value="Baker">Baker</option>
                            <option value="Manager">Manager</option>
                            <option value="Owner">Owner</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              user.status === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {user.status}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Hapus staff ${user.name}? Tindakan ini tidak bisa dibatalkan.`)) {
                                try {
                                  await onDeleteUser(user.id);
                                  if (cloudSyncEnabled) {
                                    triggerDbNotice(`Database Terupdate: Staff ${user.name} berhasil dihapus dari database Supabase.`);
                                  } else {
                                    triggerDbNotice(`Lokal Terupdate: Staff ${user.name} berhasil dihapus secara lokal di browser.`);
                                  }
                                } catch (err: any) {
                                  console.error(err);
                                  triggerDbNotice(`Gagal Menghapus: Gagal menghapus staff dari Supabase - ${err.message || String(err)}`);
                                }
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#9A8E80] font-medium italic">
                          Belum ada staff terdaftar. Silakan tambah staff baru di panel sebelah kiri.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 3: BACKUP & UTILITIES ============ */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* ============ SUPABASE CLOUD SYNC CONTROL PANEL ============ */}
          <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4 animate-rise">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#8B3350]/10 text-[#8B3350] rounded-xl flex-none">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
                    Koneksi & Sinkronisasi Supabase Cloud
                    {cloudStatus === 'connected' && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-sans px-2 py-0.5 rounded-full font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Terhubung
                      </span>
                    )}
                    {cloudStatus === 'syncing' && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 font-sans px-2 py-0.5 rounded-full font-bold">
                        <CloudLightning className="w-3 h-3 animate-spin" />
                        Sinkronisasi...
                      </span>
                    )}
                    {cloudStatus === 'error' && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 font-sans px-2 py-0.5 rounded-full font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        Error Koneksi
                      </span>
                    )}
                    {cloudStatus === 'idle' && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-gray-50 text-gray-600 font-sans px-2 py-0.5 rounded-full font-bold">
                        Lokal (Offline)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#9A8E80]">
                    Kelola data operasional ERP Brownkiss Anda di cloud server Supabase secara terpusat dan real-time.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Real-time Toggle */}
                <label className="inline-flex items-center gap-2 bg-[#FBF7F2] border border-[#E9E2D8] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5C5248] cursor-pointer hover:bg-[#F3EDE4] transition-all">
                  <input
                    type="checkbox"
                    checked={cloudSyncEnabled}
                    onChange={(e) => onToggleCloudSync(e.target.checked)}
                    className="rounded border-[#E9E2D8] text-[#8B3350] focus:ring-[#8B3350] cursor-pointer"
                  />
                  <span>Auto-Sync Realtime</span>
                </label>

                {/* Manual Pull Button */}
                <button
                  onClick={onForceSync}
                  disabled={cloudStatus === 'syncing'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E9E2D8] rounded-xl bg-white hover:bg-[#F3EDE4] text-[#5C5248] text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                  title="Ambil seluruh data terbaru dari Supabase Cloud"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-[#8B3350]" />
                  <span>Tarik dari Cloud (Pull)</span>
                </button>

                {/* Manual Push Button */}
                <button
                  onClick={onPushToCloud}
                  disabled={cloudStatus === 'syncing'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E9E2D8] rounded-xl bg-white hover:bg-[#F3EDE4] text-[#5C5248] text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                  title="Unggah data lokal Anda ke Supabase Cloud"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#8B3350]" />
                  <span>Cadangkan ke Cloud (Push)</span>
                </button>
              </div>
            </div>

            {cloudStatus === 'error' && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100 space-y-2">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 flex-none" />
                  Gagal terhubung ke Database Supabase Cloud:
                </p>
                <p className="font-mono bg-white/60 p-2 rounded border border-red-200">
                  {cloudErrorMessage}
                </p>
                <p className="text-xxs text-red-600">
                  Tips: Hal ini biasa terjadi jika tabel di database Supabase Anda belum dibuat. Silakan buka file <strong>supabase_setup.sql</strong> di workspace ini, salin isinya, lalu jalankan di menu <strong>SQL Editor</strong> pada Supabase Dashboard Anda.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResetDataSection onResetAllData={onResetAllData} />

            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
                <Download className="w-4 h-4 text-[#8B3350]" />
                Pencadangan Data Mandiri (Backup JSON)
              </h3>
              
              <p className="text-xs text-[#5C5248] leading-relaxed">
                Ekspor seluruh parameter konfigurasi toko, desain struk pembayaran, dan daftar pengguna/staff ERP ke dalam berkas cadangan JSON tunggal. Berkas ini dapat disimpan secara aman di komputer lokal Anda untuk diimpor kembali kapan saja jika browser dibersihkan.
              </p>

              <button
                onClick={handleExportBackup}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8B3350] hover:bg-[#722740] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Berkas Cadangan (.json)</span>
              </button>
            </div>

            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-serif font-semibold text-base text-[#2A2420] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#8B3350]" />
                Pulihkan Berkas Cadangan (Import JSON)
              </h3>
              
              <p className="text-xs text-[#5C5248] leading-relaxed">
                Unggah berkas cadangan JSON yang sebelumnya Anda unduh untuk memulihkan seluruh identitas toko, parameter pajak/pos, serta daftar nama pengguna sistem secara instan.
              </p>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                  id="file-import-settings"
                />
                <label
                  htmlFor="file-import-settings"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E9E2D8] hover:border-[#8B3350] text-[#5C5248] hover:text-[#8B3350] text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xxs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih & Impor Berkas Cadangan</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 4: AUDIT TRAIL ============ */}
      {activeTab === 'audit' && (
        <AuditTrailManager securityLogs={securityLogs} settings={settings} />
      )}
    </div>
  );
}
