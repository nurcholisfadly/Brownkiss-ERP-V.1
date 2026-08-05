-- ====================================================================
-- SUPABASE SQL SETUP FOR BROWNKISS ERP SYSTEM
-- Salin dan tempel skrip ini ke Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- Skrip ini otomatis membuat seluruh tabel, kolom baru, relasi, RLS policy, indeks, dan fungsi RPC.
-- Aman dijalankan berulang kali (Idempotent).
-- ====================================================================

-- 1. TABLE: INGREDIENTS (Bahan Baku Utama Gudang)
CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('Bahan Utama', 'Bahan Kering', 'Cair', 'Topping', 'Segar', 'Packaging', 'Overhead', 'Lainnya')) NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_qty NUMERIC NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi/Pembaruan Constraint Kategori Ingredients untuk database yang sudah ada
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_category_check;
ALTER TABLE ingredients ADD CONSTRAINT ingredients_category_check CHECK (category IN ('Bahan Utama', 'Bahan Kering', 'Cair', 'Topping', 'Segar', 'Packaging', 'Overhead', 'Lainnya'));


-- 2. TABLE: RECIPES (Master Resep & Varian Donat)
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price NUMERIC NOT NULL DEFAULT 0,
    hpp NUMERIC NOT NULL DEFAULT 0,
    margin NUMERIC NOT NULL DEFAULT 0,
    emoji TEXT DEFAULT '🍩',
    category TEXT DEFAULT 'BASE',
    batch_output NUMERIC DEFAULT 1,
    status TEXT DEFAULT 'Aktif',
    version NUMERIC DEFAULT 1,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Antisipasi/Migrasi Kolom Baru di recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS version NUMERIC DEFAULT 1;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS batch_output NUMERIC DEFAULT 1;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'BASE';


-- 3. TABLE: RECIPE INGREDIENTS (Komposisi / Takaran Bahan Per Resep)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
    qty_needed NUMERIC NOT NULL DEFAULT 0,
    UNIQUE(recipe_id, ingredient_id)
);


-- 4. TABLE: PRODUCTION BATCHES (Riwayat Batch Produksi Dapur)
CREATE TABLE IF NOT EXISTS production_batches (
    id TEXT PRIMARY KEY,
    recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
    resep TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC NOT NULL DEFAULT 0,
    val NUMERIC NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Menunggu',
    progress NUMERIC NOT NULL DEFAULT 0,
    operator TEXT,
    scheduled_date TEXT,
    waste_qty NUMERIC DEFAULT 0,
    waste_reason TEXT,
    usable_qty NUMERIC,
    is_staged BOOLEAN DEFAULT false,
    stage_target_qty NUMERIC,
    staged_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Antisipasi/Migrasi Kolom & Constraint di production_batches
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS recipe_id TEXT;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS operator TEXT;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS scheduled_date TEXT;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS waste_qty NUMERIC DEFAULT 0;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS waste_reason TEXT;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS usable_qty NUMERIC;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS is_staged BOOLEAN DEFAULT false;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS stage_target_qty NUMERIC;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS staged_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;

ALTER TABLE production_batches DROP CONSTRAINT IF EXISTS production_batches_status_check;
ALTER TABLE production_batches ADD CONSTRAINT production_batches_status_check CHECK (status IN ('Diproses', 'Selesai', 'Menunggu', 'Batal'));


-- 5. TABLE: SALES (Riwayat Transaksi Penjualan Kasir)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'Tunai',
    customer_name TEXT DEFAULT 'Umum',
    customer_address TEXT DEFAULT '-',
    shipping_cost NUMERIC DEFAULT 0,
    invoice_no TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Selesai',
    voided_by TEXT,
    voided_at TEXT,
    void_reason TEXT,
    discount_type TEXT DEFAULT 'none',
    discount_value NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    promo_name TEXT,
    cash_paid NUMERIC DEFAULT 0,
    qris_paid NUMERIC DEFAULT 0,
    change_amount NUMERIC DEFAULT 0,
    return_details JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Antisipasi/Migrasi Kolom & Constraint di sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Selesai';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_by TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_at TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS void_reason TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS promo_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_paid NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS qris_paid NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS change_amount NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS return_details JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('Tunai', 'QRIS', 'Split Payment', 'Transfer', 'Kartu'));

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_status_check CHECK (status IN ('Selesai', 'Void', 'Diretur'));


-- 6. TABLE: SALE ITEMS (Detail Item Produk Terjual)
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0,
    returned_qty NUMERIC DEFAULT 0
);

ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS returned_qty NUMERIC DEFAULT 0;


-- 7. TABLE: SECURITY LOGS (Jurnal / Audit Trail Keamanan Sistem)
CREATE TABLE IF NOT EXISTS security_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    event TEXT NOT NULL,
    level TEXT CHECK (level IN ('Aman', 'Peringatan', 'Bahaya')) NOT NULL,
    user_name TEXT,
    user_role TEXT,
    date TEXT,
    time TEXT,
    before_value TEXT,
    after_value TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS before_value TEXT;
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS after_value TEXT;
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS category TEXT;


-- 8. TABLE: DONUT INVENTORY (Stok Persediaan Display Kabinet POS)
CREATE TABLE IF NOT EXISTS donut_inventory (
    flavor TEXT PRIMARY KEY,
    qty NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 9. TABLE: ERP_USERS (Pengguna & Staff)
CREATE TABLE IF NOT EXISTS erp_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Owner', 'Manager', 'Kasir', 'Baker')) NOT NULL DEFAULT 'Kasir',
    status TEXT CHECK (status IN ('Aktif', 'Nonaktif')) NOT NULL DEFAULT 'Aktif',
    password TEXT DEFAULT '123456',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE erp_users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';


-- 10. TABLE: ERP_SETTINGS (Konfigurasi Global & Profil Toko ERP)
CREATE TABLE IF NOT EXISTS erp_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 11. TABLE: INGREDIENT_PURCHASES (Riwayat Pembelian & Stok Masuk Bahan)
CREATE TABLE IF NOT EXISTS ingredient_purchases (
    id TEXT PRIMARY KEY,
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT CHECK (type IN ('RESTOCK', 'STOK_AWAL', 'KOREKSI_HARGA', 'KOREKSI_STOK')) DEFAULT 'RESTOCK',
    qty_added NUMERIC DEFAULT 0,
    unit TEXT NOT NULL,
    cost_per_unit NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 12. TABLE: CASH TRANSACTIONS (Kas Masuk & Kas Keluar)
CREATE TABLE IF NOT EXISTS cash_transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT CHECK (type IN ('MASUK', 'KELUAR')) NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    note TEXT,
    created_by TEXT,
    payment_method TEXT DEFAULT 'Tunai',
    ref_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE cash_transactions DROP CONSTRAINT IF EXISTS cash_transactions_type_check;
ALTER TABLE cash_transactions ADD CONSTRAINT cash_transactions_type_check CHECK (type IN ('MASUK', 'KELUAR'));


-- 13. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_purchases_ingredient_id ON ingredient_purchases(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(date);
CREATE INDEX IF NOT EXISTS idx_production_batches_recipe_id ON production_batches(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date);


-- 14. ROW LEVEL SECURITY (RLS) CONFIGURATION
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE donut_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (Anon Key) untuk Operasional ERP
DROP POLICY IF EXISTS "Allow anon full access on ingredients" ON ingredients;
CREATE POLICY "Allow anon full access on ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on recipes" ON recipes;
CREATE POLICY "Allow anon full access on recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Allow anon full access on recipe_ingredients" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on production_batches" ON production_batches;
CREATE POLICY "Allow anon full access on production_batches" ON production_batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on sales" ON sales;
CREATE POLICY "Allow anon full access on sales" ON sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on sale_items" ON sale_items;
CREATE POLICY "Allow anon full access on sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on security_logs" ON security_logs;
CREATE POLICY "Allow anon full access on security_logs" ON security_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on donut_inventory" ON donut_inventory;
CREATE POLICY "Allow anon full access on donut_inventory" ON donut_inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on erp_users" ON erp_users;
CREATE POLICY "Allow anon full access on erp_users" ON erp_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on erp_settings" ON erp_settings;
CREATE POLICY "Allow anon full access on erp_settings" ON erp_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on ingredient_purchases" ON ingredient_purchases;
CREATE POLICY "Allow anon full access on ingredient_purchases" ON ingredient_purchases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on cash_transactions" ON cash_transactions;
CREATE POLICY "Allow anon full access on cash_transactions" ON cash_transactions FOR ALL USING (true) WITH CHECK (true);


-- 15. INSERT DEFAULT USERS & INITIAL SECURITY LOGS
INSERT INTO erp_users (id, name, email, role, status)
VALUES 
  ('usr_init_2', 'Fadli Berniaga', 'fadliberniaga@gmail.com', 'Owner', 'Aktif')
ON CONFLICT (id) DO NOTHING;

INSERT INTO security_logs (id, timestamp, event, level)
VALUES ('init_log_1', to_char(now(), 'DD Mon YYYY HH24:MI'), 'Inisialisasi database Supabase Cloud selesai', 'Aman')
ON CONFLICT (id) DO NOTHING;


-- 16. SUPABASE RPC: ATOMIC BULK STOCK UPDATE FUNCTION
CREATE OR REPLACE FUNCTION bulk_update_ingredients_stock(updates jsonb)
RETURNS void AS $$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(updates) LOOP
        UPDATE ingredients
        SET qty = (item->>'qty')::numeric
        WHERE id = item->>'id';
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 17. TABLES FOR DAILY CLOSING & INVENTORY SNAPSHOTS
CREATE TABLE IF NOT EXISTS closing_reports (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    total_penjualan NUMERIC NOT NULL DEFAULT 0,
    total_tunai_sistem NUMERIC NOT NULL DEFAULT 0,
    total_qris_sistem NUMERIC NOT NULL DEFAULT 0,
    kas_fisik NUMERIC NOT NULL DEFAULT 0,
    selisih_kas NUMERIC NOT NULL DEFAULT 0,
    closed_by TEXT NOT NULL,
    closed_by_role TEXT,
    notes TEXT,
    waste_donut_qty NUMERIC DEFAULT 0,
    waste_donut_details JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'CLOSED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_snapshots (
    id TEXT PRIMARY KEY,
    closing_report_id TEXT REFERENCES closing_reports(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    snapshot_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_value NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks Performa Tambahan
CREATE INDEX IF NOT EXISTS idx_sales_is_closed ON sales(is_closed);
CREATE INDEX IF NOT EXISTS idx_production_batches_is_closed ON production_batches(is_closed);
CREATE INDEX IF NOT EXISTS idx_closing_reports_date ON closing_reports(date);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_date ON inventory_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_closing_id ON inventory_snapshots(closing_report_id);

-- Row Level Security (RLS)
ALTER TABLE closing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access on closing_reports" ON closing_reports;
CREATE POLICY "Allow anon full access on closing_reports" ON closing_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on inventory_snapshots" ON inventory_snapshots;
CREATE POLICY "Allow anon full access on inventory_snapshots" ON inventory_snapshots FOR ALL USING (true) WITH CHECK (true);

