# 🍩 Brownkiss ERP - Persistent Agent Instructions & Progress

Dokumen ini berisi rangkuman progress, aturan desain, dan petunjuk khusus proyek **Brownkiss ERP** yang otomatis dibaca dan dipatuhi oleh AI Coding Agent pada setiap sesi pengerjaan berikutnya.

---

## 📌 Status Terakhir & Progress Proyek

1. **Dashboard & Sinkronisasi Cloud**:
   * Panel Kontrol Supabase Cloud telah **dipindahkan ke tab Pengaturan (Settings > Database & Utilitas)** untuk menjaga kebersihan UI dashboard utama.
   * Mendukung auto-sync realtime, manual pull dari cloud, dan manual push cadangan.

2. **Login Page Modern**:
   * Menggunakan tema **Warm Gourmet Baker** dengan latar gradasi hangat, pendaran karamel, dan marmer kaca (*glaze*).
   * Formulir masuk telah disederhanakan (simple login) tanpa label berlebih, menggunakan placeholder intuitif agar tidak membingungkan pengguna.
   * Tersedia fitur **Bypass Login (Demo Mode)** untuk pengujian instan sekali klik.
   * Terintegrasi dengan real Supabase Auth menggunakan kredensial client aktif.

3. **Keamanan Data, Hashing Kata Sandi & Row Level Security (RLS)**:
   * **Pencegahan Bocor Data**: Mengganti kueri `select('*')` di `Login.tsx` menjadi kueri spesifik per email (`eq('email', cleanEmail)`). Mencegah kebocoran seluruh daftar staff/password ke browser DevTools Network tab.
   * **Cryptographic Hashing**: Password disimpan dan diverifikasi menggunakan salted SHA-256 hash (`hashPassword` & `verifyPassword`). Otomatis melakukan migrasi akun password lama (plaintext) menjadi salted hash saat login/save.
   * **Sembunyikan Password di UI**: Mengubah input kata sandi baru menjadi `type="password"` dan mengganti input teks biasa di tabel staff `SettingManager.tsx` dengan komponen `StaffPasswordCell` berfitur topeng sandi (`••••••••`) dan toggle eye icon.
   * **Row Level Security (RLS)**: `supabase_setup.sql` kini menyertakan perintah `ENABLE ROW LEVEL SECURITY` beserta definisi `POLICY` untuk semua tabel (termasuk `erp_users`), sehingga database aman untuk dipakai dengan anon key tanpa memblokir operasional ERP.

4. **Peningkatan Manajemen Kasir & Perhitungan POS**:
   * **Pencocokan Berbasis ID (`recipe.id`)**:
     - **ProductionBatch (`types.ts` & `ProductionManager.tsx`)**: Menambahkan field `recipeId?: string` pada `ProductionBatch`. Pembuatan batch baru menyimpan `recipeId`. Fungsi helper `findRecipeForBatch(batch)` memprioritaskan pencarian resep via `recipeId` dengan fallback pencocokan nama untuk data lama.
     - **Keranjang POS (`KasirManager.tsx`)**: State `cart` di-key penuh menggunakan `recipe.id` unik (bukan nama) untuk penambahan, pengurangan, dan kalkulasi checkout, sementara persediaan `donutInventory` tetap dilookup via nama varian donat jadi.
   * **Deduksi Stok Atomik**: Pembaruan stok donat saat *checkout* dan *void/cancel* dilakukan secara atomik dalam satu objek batch update (`onUpdateDonutInventory(stockAdjustments)`), mencegah race condition dan mengurangi request cloud.
   * **Utilitas Kalkulasi Terpusat**: Seluruh perhitungan subtotal, biaya layanan, PPN, ongkir, dan total akhir disatukan dalam fungsi `calculateSaleSummary()`, digunakan konsisten di POS, preview nota, dan cetak printer thermal.
   * **Bluetooth Print Retry**: Penulisan chunk data ke printer Bluetooth dilengkapi mekanisme percobaan ulang (*retry loop* hingga 3x) untuk mencegah struk kepotong di printer.
   * **Otoritas Void 2 Lapis (Role & PIN Supervisor)**: Pembukaan tab Otoritas Void dan fungsi `handleCancelSale` dilindungi 2 lapis keamanan. Lapis 1 mengecek role staff (`Owner` atau `Manager`). Lapis 2 meminta PIN Otoritas Void (`voidAuthorizationPin` di `ErpSettings` yang dapat dikonfigurasi via `SettingManager`). Percobaan ilegal/PIN salah otomatis ditolak dengan alert dan dicatat ke Audit Trail level `Bahaya`.
   * **Mekanisme Pembatalan Non-Destruktif (Status Void)**: Transaksi tidak dihapus permanen. Fungsi `onVoidSale()` mengubah status transaksi menjadi `'Void'` beserta metadata (`voidedBy`, `voidedAt`, `voidReason` wajib dari prompt). Tombol batalkan disembunyikan untuk transaksi yang sudah Void. Statistik omzet & jumlah transaksi di Rekapitulasi secara presisi mengabaikan transaksi Void, sementara Jurnal Rekapitulasi tetap menampilkan transaksi Void bertanda badge merah `DIBATALKAN` dan alasannya.
   * **Pencegahan Stok Minus saat Pembatalan Batch Produksi**: Fungsi `handleCancelBatch` di `ProductionManager.tsx` menghitung `qtyToReclaim` berdasarkan sisa `currentStock` display (`Math.min(batch.qty, currentStock)`). Jika donat dari batch tersebut telah sebagian terjual (`alreadySold > 0`), dialog konfirmasi menampilkan peringatan eksplisit dan hanya menarik sisa stok yang ada tanpa menyebabkan angka persediaan minus. Kejadian dicatat ke Audit Trail level `Bahaya` jika `alreadySold > 0`.

5. **Peningkatan Rekapitulasi & Ekspor CSV**:
   * **Proteksi CSV/Formula Injection**: Semua sel string di-sanitize agar karakter sensitif (`=`, `+`, `-`, `@`, `\t`, `\r`) di-prefix dengan `'` sebelum diekspor.
   * **UTF-8 BOM Blob**: Mengubah metode unduh dari data URI ke `Blob` berawalan UTF-8 BOM (`\uFEFF`) sehingga karakter khusus dan format rupiah dirender sempurna di Microsoft Excel Windows.
   * **Pencarian, Filter & Paginasi Jurnal**: Menambahkan pencarian fleksibel, filter periode tanggal/custom, filter metode bayar, serta paginasi tabel (10/20/50 baris) agar siap menangani ribuan transaksi harian.

6. **Refactoring, Integritas Referensial & Arsitektur Terpusat**:
   * **Custom Hook `useCurrentUser()`**: Ekstraksi logika parsing `localStorage` user aktif (`donat_erp_logged_user`) dengan penanganan `try/catch` aman dan event listener sinkronisasi antar-tab ke dalam custom hook `src/hooks/useCurrentUser.ts`.
   * **Central Configuration `defaults.ts`**: Menyatukan seluruh konstanta nilai bawaan (seperti `DEFAULT_SETTINGS`, `DEFAULT_CUSTOMER`, `DEFAULT_CURRENCY`, dan `DEFAULT_USERS`) ke dalam `src/constants/defaults.ts` sebagai single source of truth.
   * **Validasi Referensial Hapus Data**:
     - **Bahan Baku (`IngredientManager.tsx`)**: Menerima prop `recipes`. Sebelum menghapus bahan baku, sistem memeriksa apakah bahan tersebut masih digunakan dalam resep aktif. Jika ada, penghapusan dibatalkan dan alert menampilkan rincian nama resep yang memakainya.
     - **Resep (`RecipeManager.tsx`)**: Menerima prop `batches`. Sebelum menghapus resep, sistem memeriksa apakah resep tersebut mereferensikan batch produksi yang berstatus `'Diproses'` atau `'Menunggu'`. Jika ada, penghapusan dibatalkan dengan alert daftar batch aktif.

7. **Dokumentasi**:
   * File `README.md` telah diperbarui dengan visualisasi alur fungsi (workflow) roti, dari gudang bahan baku -> resep -> dapur produksi -> rak display kasir -> hingga rekap transaksi keuangan.

8. **Modul Manajemen Keuangan & Kas Home Industry**:
   * **Modul Terpisah (`KeuanganManager.tsx`)**: Didesain khusus untuk operasional UMKM / home industry tanpa beban kerumitan General Ledger atau akuntansi ganda.
   * **Kas Masuk & Kas Keluar**: Pencatatan cepat pemasukan (modal awal, penjualan non-POS, setoran tunai) dan pengeluaran (pembelian bahan, listrik/gas, gaji staff, maintenance) dilengkapi kustomisasi kategori, metode bayar (Tunai/Transfer/QRIS), dan ekspor CSV UTF-8.
   * **Saldo Kas Harian**: Menampilkan saldo kas awal, pemasukan tunai vs QRIS, pengeluaran harian, dan saldo kas akhir bersih dengan log pergerakan kas kronologis.
   * **Ringkasan Laba berdasarkan Penjualan & HPP**: Mengkalkulasi Penjualan Kotor, Diskon POS, Penjualan Bersih, Total HPP Donat Terjual (dikalkulasi presisi berdasarkan resep dan kuantitas terjual non-void net retur), Laba Kotor, OpEx, serta Laba Bersih Operasional dan % marginnya.
   * **Dukungan Cloud Sync & SQL**: Tabel `cash_transactions` beserta RLS policy dan helper sync cloud (`getCashTransactionsFromCloud`, `saveCashTransactionToCloud`, `deleteCashTransactionFromCloud`) megenai kas telah diintegrasikan.

9. **Penyelarasan Logika Stok Bahan Masuk & Flow Pemotongan Produksi**:
   * **Prinsip Konversi Pembelian**: Mengadopsi prinsip konversi nota pembelian otomatis (`total_qty_dasar = qty_nota * isi_bersih * pengali` dengan `pengali = 1000` untuk KG/Liter dan `1` untuk Gram/Ml/Pcs/Butir/LOT).
   * **Perhitungan Harga Beli Terakhir**: `harga_per_satuan_dasar = total_bayar / total_qty_dasar`. Disimpan sebagai `costPerUnit` untuk akurasi HPP resep per gram/ml.
   * **Kategori Lengkap**: Mendukung kategori `'Bahan Utama'`, `'Bahan Kering'`, `'Cair'`, `'Topping'`, `'Segar'`, `'Packaging'`, `'Overhead'`, dan `'Lainnya'` pada `IngredientManager.tsx` dan `types.ts`.
   * **Skema Supabase (`supabase_setup.sql`)**: Kolom `category` pada tabel `ingredients` diperbarui dengan constraint `CHECK` lengkap serta perintah migrasi `ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_category_check;` agar sinkronisasi cloud tidak bermasalah.
   * **Flow Pemotongan Bahan Baku di Produksi**:
     - Memulai batch (`'Diproses'`): Memeriksa ketersediaan stok tiap bahan baku resep (`(ri.qtyNeeded / recipe.batchOutput) * batch.qty`). Memblokir jika stok kurang, atau memotong stok gudang jika cukup.
     - Selesai (`'Selesai'`): Menambahkan jumlah donat jadi (`usableQty`) ke display kabinet POS (`donutInventory`).
     - Batal Batch (`Cancel`): Mengembalikan bahan baku secara akurat ke gudang dan mengamankan stok display agar tidak terjadi stok minus.

10. **Fitur Reset Data ERP dengan Proteksi 2FA**:
    * **Lokasi**: Ditempatkan khusus di tab **Pengaturan > Database & Utilitas (Utilitas & Backup)**.
    * **Keamanan 2-Factor Authentication (2FA)**:
      - **Faktor 1 (Kata Sandi)**: Memverifikasi kata sandi pengguna aktif via `verifyPassword` (salted SHA-256 hash check).
      - **Faktor 2 (Kalimat Konfirmasi)**: Mengharuskan pengguna mengetik persis frasa `RESET DATA ERP BROWNKISS`.
    * **Pembersihan Data**: Menghapus seluruh memori `localStorage` dan mereset state lokal (bahan baku, resep, batch produksi, transaksi kasir, kas/keuangan, stok kabinet display, serta log audit) dan mencatat aktivitas ke Audit Trail dengan level `Bahaya`.

11. **Penyelarasan Skema Supabase (`supabase_setup.sql`)**:
    * **Integritas Relasi & Foreign Keys**: `recipe_ingredients` (dengan `ON DELETE CASCADE`), `sale_items` (`ON DELETE CASCADE`), `ingredient_purchases` (`ON DELETE CASCADE`), dan `production_batches` (`recipe_id REFERENCES recipes(id) ON DELETE SET NULL`).
    * **Penyelarasan Constraint CHECK**: Memperbarui constraint `CHECK` pada `sales.payment_method` (`'Tunai', 'QRIS', 'Split Payment', 'Transfer', 'Kartu'`), `sales.status` (`'Selesai', 'Void', 'Diretur'`), `production_batches.status` (`'Diproses', 'Selesai', 'Menunggu', 'Batal'`), serta `cash_transactions.type` (`'MASUK', 'KELUAR'`).
    * **Indeks Performa & Safe Idempotent Migrations**: Menambahkan indeks untuk `production_batches(recipe_id)` serta perintah `DROP CONSTRAINT IF EXISTS` sebelum menambahkan ulang constraint agar skrip SQL dapat dijalankan ulang tanpa error di Supabase.

12. **Cetak Laporan PDF Keuangan**:
    * Menambahkan tombol **Cetak Laporan PDF** pada seluruh sub-tab di **Menu Keuangan (Aliran Kas Ledger, Saldo Kas Harian, dan Laba Rugi P&L)**.
    * Menghasilkan dokumen PDF profesional siap cetak (`exportFinancialReportPDF`) yang mencakup identitas toko, ringkasan kinerja laba rugi operasional (Gross Sales, Diskon, Net Revenue, HPP, Gross Profit, OpEx, Net Operating Profit), serta rincian buku kas & mutasi operasional.

---

## 🎨 Panduan Identitas Visual & Estetika (Wajib Dipatuhi)

Setiap pengerjaan atau modifikasi UI baru harus selalu konsisten dengan palet warna hangat premium berikut:
* **Warna Utama**: `#8B3350` (Deep Velvet Burgundy — warna khas berry/cokelat artisan)
* **Warna Latar**: `#FBF7F2` atau `#FBF6EC` (Warm Vanilla Crema — eye-safe untuk operasional kasir)
* **Aksen/Border**: `#E9E2D8` atau `#EEE3D0` (Toasted Almond Oak — sekat alami yang lembut)
* **Tipografi**: Judul menggunakan Serif elegan (font-serif), teks angka numerik/data menggunakan font-mono yang presisi.

---

## 🔒 Aturan Teknis & Aturan Integrasi

* **No UI Key Prompts**: Jangan pernah memunculkan input field atau modal untuk meminta API Key / Secrets di client-side. Gunakan `.env.example` dan client initialization statis di `src/supabaseClient.ts` dan `src/components/Login.tsx`.
* **Single-Page Simplicity**: Kecuali jika diminta navigasi kompleks, semua fitur utama diletakkan di tab-tab dashboard utama yang dikontrol melalui state di `App.tsx`.
* **No Telemetry / No AI Slop**: Hindari penambahan status debug, log mentah (kecuali di tab Audit Trail yang sudah disediakan), atau teks koordinat infrastruktur yang merusak estetika profesional.
