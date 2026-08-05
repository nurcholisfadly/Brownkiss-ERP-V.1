# 🍩 Brownkiss ERP: Sistem Manajemen Roti & POS Terintegrasi Cloud

Selamat datang di **Brownkiss ERP** — solusi Enterprise Resource Planning (ERP) modern, responsif, dan elegan yang dirancang khusus untuk mengelola seluruh aspek operasional bisnis donat dan roti. Mulai dari manajemen stok bahan baku, kalkulasi resep otomatis, perencanaan produksi harian, kasir POS terintegrasi, hingga pencatatan rekapitulasi keuangan real-time yang tersinkronisasi dengan **Supabase Cloud**.

---

## 🌟 Fitur Utama & Keunggulan

Brownkiss ERP mengintegrasikan seluruh departemen toko roti Anda dalam satu dashboard intuitif:

1. **Dashboard Ringkasan (Analytics & Security Logs)**
   * Grafik tren penjualan mingguan interaktif menggunakan Recharts.
   * Status kabinet display donat siap saji secara real-time.
   * Audit trail/Security Logs otomatis untuk memantau aktivitas sistem yang mencurigakan atau aman.

2. **Manajemen Stok Bahan Baku (Inventory)**
   * Pencatatan stok bahan baku basah & kering dengan satuan otomatis.
   * Indikator status stok otomatis (**Aman**, **Menipis**, atau **Habis**) berdasarkan batas minimum (*alert limit*).
   * Fitur restock instan dan riwayat penyesuaian bahan baku.

3. **Formula & Manajemen Resep (Recipe Creator)**
   * Manajemen resep pembuatan varian donat.
   * Kalkulator otomatis yang menghitung estimasi donat yang bisa diproduksi berdasarkan ketersediaan bahan baku di gudang.
   * Estimasi biaya produksi per biji donat (*Cost of Goods Sold* - COGS) untuk membantu penentuan harga jual.

4. **Mesin Produksi & Cabinet Loader (Production)**
   * Sistem rilis batch produksi dari dapur pemanggangan (Baker).
   * Validasi otomatis: Mengurangi stok bahan baku secara proporsional sesuai resep yang digunakan saat produksi dimulai.
   * Pengiriman otomatis donat matang dari dapur ke rak pajangan kasir (*Load to Cabinet*).

5. **Aplikasi Kasir POS Modern (Point of Sales)**
   * Antarmuka kasir ramah sentuhan (touch-friendly) untuk penjualan cepat.
   * Sistem keranjang belanja dinamis dengan perhitungan subtotal, diskon, biaya pengiriman, biaya layanan, dan pajak PPN secara otomatis.
   * Proteksi stok: Mencegah kasir menjual rasa donat yang tidak tersedia di rak display (dapat disesuaikan di menu pengaturan/Over-Sell).

6. **Rekapitulasi Penjualan & Keuangan (Reports)**
   * Laporan komprehensif seluruh transaksi kasir.
   * Filter riwayat transaksi dan statistik performa penjualan varian rasa paling laris.
   * Fitur ekspor/backup transaksi untuk pembukuan eksternal.

7. **Konfigurasi ERP & Sinkronisasi Cloud (Settings)**
   * **Profil Toko & Parameter POS**: Atur nama toko, alamat, kontak, pajak PPN, biaya layanan, serta teks kustom pada struk belanja Anda.
   * **Manajemen Staff**: Kelola hak akses multi-peran (*Owner*, *Manager*, *Kasir*, dan *Baker*) serta status keaktifan mereka.
   * **Integrasi Supabase Cloud**: Sinkronisasi data lokal instan ke database cloud, pencadangan manual (push/pull), serta backup offline dalam format file JSON.

---

## 🔄 Alur Kerja & Workflow Operasional (End-to-End)

Berikut adalah visualisasi alur bagaimana data mengalir di dalam ekosistem **Brownkiss ERP**:

```
[ Gudang Bahan Baku ] ──► [ Pembuatan Resep ] ──► [ Batasan Produksi ]
        │                                                │
        ▼ (Mengurangi Bahan)                             ▼ (Menambah Stok Kabinet)
[ Mulai Produksi Dapur ] ─────────────────────────► [ Rak Display Kasir ]
                                                         │
                                                         ▼ (Penjualan Pelanggan)
[ Rekap Keuangan & Laporan ] ◄──────────────────── [ Kasir POS Terbuka ]
```

### Langkah demi Langkah Alur Kerja:

1. **Penerimaan Bahan Baku**: 
   Manager menginput bahan baku baru di tab **Stok Bahan** (misal: Tepung Terigu, Mentega, Cokelat).
2. **Perancangan Resep**:
   Baker menyusun resep donat di tab **Resep**. Sistem secara otomatis membaca stok gudang dan menampilkan info: *"Bahan Anda cukup untuk memproduksi maksimal 45 pcs donat rasa ini."*
3. **Proses Produksi**:
   Baker memulai batch produksi di tab **Produksi**. Saat batch disetujui, stok bahan baku di gudang otomatis terpotong sesuai porsi resep. Setelah donat matang, Baker menekan tombol **"Kirim ke Kabinet"** untuk mengirim produk segar ke rak kasir.
4. **Penjualan Kasir**:
   Kasir membuka tab **Kasir**, memilih donat yang dipesan pelanggan, menginput biaya ongkir (jika ada), lalu memproses transaksi. Stok donat di rak display berkurang secara real-time.
5. **Pencatatan Keuangan & Sinkronisasi**:
   Setiap transaksi dicatat di tab **Rekap Jual** dan log keamanan dicatat di audit trail. Jika **Auto-Sync** aktif, data tersebut langsung terkirim secara aman ke server **Supabase Cloud**.

---

## 🛠️ Panduan Integrasi Database Supabase Cloud

Sistem ini didesain dengan arsitektur **Hybrid-Offline First**. Aplikasi dapat berjalan penuh menggunakan penyimpanan browser lokal, namun disarankan untuk menghubungkannya ke Supabase Cloud untuk kolaborasi multi-perangkat.

### Langkah Inisialisasi Database:

1. Buat akun gratis dan sebuah proyek baru di [Supabase Console](https://supabase.com).
2. Dapatkan kredensial **Project URL** dan **Anon API Key** dari dashboard Supabase Anda (Settings > API).
3. Buat file `.env` di direktori root aplikasi ini dan masukkan kredensial tersebut:
   ```env
   VITE_SUPABASE_URL=https://proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Buka **Supabase Dashboard** proyek Anda, masuk ke menu **SQL Editor**, buat query baru, lalu salin seluruh isi dari file `supabase_setup.sql` yang ada di aplikasi ini.
5. Klik **Run** pada SQL Editor Supabase untuk membangun seluruh tabel database lengkap beserta log inisialisasinya.
6. Masuk ke aplikasi **Brownkiss ERP > Pengaturan > Utilitas & Backup**, lalu aktifkan tombol **Auto-Sync Realtime**. Sistem Anda sekarang resmi bertenaga Cloud!

---

## 💻 Cara Menjalankan Aplikasi di Komputer Lokal

### Prasyarat:
* Node.js (versi 18 ke atas)
* npm atau yarn / bun

### Langkah-langkah:

1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```
2. **Menjalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di alamat `http://localhost:3000`.

3. **Membangun Aplikasi untuk Produksi**:
   ```bash
   npm run build
   ```

---

## 🎨 Palet Warna & Desain Estetika

Aplikasi ini mengusung tema **Warm Gourmet Baker** yang memberikan kesan hangat, premium, dan profesional:
* **Warna Utama**: `#8B3350` (Deep Velvet Burgundy — warna khas buah beri dan cokelat artisan).
* **Warna Latar Belakang**: `#FBF7F2` (Warm Vanilla Crema — nyaman di mata untuk penggunaan kasir berjam-jam).
* **Warna Aksen**: `#E9E2D8` (Toasted Almond Oak — memberikan batas sekat antar komponen yang alami dan lembut).
* **Tipografi**: Serif elegan untuk judul dipadukan dengan Sans-serif modern dan fungsional untuk teks operasional dan angka numerik kasir.

---

*Dibuat dengan cinta untuk para pengusaha kuliner mandiri. Semoga bisnis donat Anda semakin berkembang pesat! 🍩🚀*
