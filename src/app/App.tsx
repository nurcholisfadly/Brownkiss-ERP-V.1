import React, { useState, useEffect } from 'react';
import {
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_PRODUCTION,
  INITIAL_SALES,
  INITIAL_SECURITY_LOGS,
  WEEKLY_SALES_TREND,
  INITIAL_PURCHASES,
  INITIAL_CASH_TRANSACTIONS
} from '../data';
import { Ingredient, Recipe, ProductionBatch, Sale, SecurityLog, ErpUser, ErpSettings, IngredientPurchase, CashTransaction } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_USERS } from '../constants/defaults';
import { getCurrentUser } from '../hooks/useCurrentUser';
import { IngredientManager } from '../features/inventory';
import { RecipeManager } from '../features/recipes';
import { ProductionManager } from '../features/production';
import { KasirManager } from '../features/cashier';
import { RekapManager, KeuanganManager, ClosingManager } from '../features/reports';
import { SettingManager, Login } from '../features/settings';
import { DashboardOwner } from '../features/dashboard';

// Import Supabase Client and Cloud sync utilities
import {
  getIngredientsFromCloud,
  saveIngredientsToCloud,
  deleteIngredientFromCloud,
  getIngredientPurchasesFromCloud,
  saveIngredientPurchaseToCloud,
  getRecipesFromCloud,
  saveRecipeToCloud,
  deleteRecipeFromCloud,
  getProductionBatchesFromCloud,
  saveProductionBatchToCloud,
  deleteProductionBatchFromCloud,
  getSalesFromCloud,
  saveSaleToCloud,
  deleteSaleFromCloud,
  getSecurityLogsFromCloud,
  saveSecurityLogToCloud,
  getDonutInventoryFromCloud,
  saveDonutInventoryToCloud,
  getErpUsersFromCloud,
  saveErpUserToCloud,
  deleteErpUserFromCloud,
  getErpSettingsFromCloud,
  saveErpSettingsToCloud,
  bulkUpdateIngredientsStockCloud,
  getCashTransactionsFromCloud,
  saveCashTransactionToCloud,
  deleteCashTransactionFromCloud,
  getClosingReportsFromCloud,
  saveClosingReportToCloud,
  getInventorySnapshotsFromCloud,
  saveInventorySnapshotToCloud
} from '../supabaseClient';

import {
  LayoutDashboard,
  Boxes,
  BookOpen,
  ChefHat,
  Receipt,
  History,
  Wallet,
  Bell,
  Calendar,
  Menu,
  X,
  Plus,
  RefreshCw,
  ShoppingBag,
  HeartCrack,
  LogOut,
  Cloud,
  CloudOff,
  CloudLightning,
  DownloadCloud,
  UploadCloud,
  Database,
  Terminal,
  AlertTriangle,
  Settings,
  Lock
} from 'lucide-react';


// One-time self-executing cleanup block to purge old dummy data from user local storage
if (typeof window !== 'undefined') {
  const isCleaned = localStorage.getItem('donat_erp_clean_v3_blank');
  if (!isCleaned) {
    localStorage.removeItem('donat_erp_ingredients');
    localStorage.removeItem('donat_erp_recipes');
    localStorage.removeItem('donat_erp_production');
    localStorage.removeItem('donat_erp_sales');
    localStorage.removeItem('donat_erp_security');
    localStorage.removeItem('donat_erp_donut_inventory');
    localStorage.setItem('donat_erp_clean_v3_blank', 'true');
  }

  // Clear cached dummy users from previous sessions to load the updated clean list
  const isCleanedUsers = localStorage.getItem('donat_erp_clean_users_v2');
  if (!isCleanedUsers) {
    localStorage.removeItem('donat_erp_users');
    localStorage.setItem('donat_erp_clean_users_v2', 'true');
  }
}

export default function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('donat_erp_is_logged_in') === 'true';
  });

  const [loggedInUser, setLoggedInUser] = useState<ErpUser | null>(() => getCurrentUser());

  // Navigation State
  const [activeView, setActiveView] = useState<'ringkasan' | 'stok' | 'resep' | 'produksi' | 'kasir' | 'rekap' | 'keuangan' | 'tutup_buku' | 'pengaturan'>('ringkasan');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateToView = (view: 'ringkasan' | 'stok' | 'resep' | 'produksi' | 'kasir' | 'rekap' | 'keuangan' | 'tutup_buku' | 'pengaturan') => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  // Business States
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('donat_erp_ingredients');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [purchases, setPurchases] = useState<IngredientPurchase[]>(() => {
    const saved = localStorage.getItem('donat_erp_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('donat_erp_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(() => {
    const saved = localStorage.getItem('donat_erp_production');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTION;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('donat_erp_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('donat_erp_cash_transactions');
    return saved ? JSON.parse(saved) : INITIAL_CASH_TRANSACTIONS;
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => {
    const saved = localStorage.getItem('donat_erp_security');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_LOGS;
  });

  // Ready donut stock (ready in display cabinet for POS sale)
  const [donutInventory, setDonutInventory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('donat_erp_donut_inventory');
    if (saved) return JSON.parse(saved);
    return {};
  });

  // ERP Users and Settings states
  const [users, setUsers] = useState<ErpUser[]>(() => {
    const saved = localStorage.getItem('donat_erp_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [settings, setSettings] = useState<ErpSettings>(() => {
    const saved = localStorage.getItem('donat_erp_settings');
    if (!saved) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.storeName) {
        parsed.storeName = parsed.storeName.replace(/D'?Donuts/gi, 'Brownkiss');
      } else {
        parsed.storeName = DEFAULT_SETTINGS.storeName;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Supabase Cloud Sync States
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('donat_erp_cloud_sync_enabled') === 'true';
  });
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'connected' | 'error'>('idle');
  const [cloudErrorMessage, setCloudErrorMessage] = useState('');
  const [isErpUsersTableMissing, setIsErpUsersTableMissing] = useState<boolean>(false);

  // Auto-sync function to pull on mount if enabled
  useEffect(() => {
    if (cloudSyncEnabled) {
      fetchFromCloud(true);
    }
  }, [cloudSyncEnabled]);

  // Handle localStorage sync for cloud option
  useEffect(() => {
    localStorage.setItem('donat_erp_cloud_sync_enabled', String(cloudSyncEnabled));
  }, [cloudSyncEnabled]);

  const fetchFromCloud = async (silent = false) => {
    if (!silent) setCloudStatus('syncing');
    let hasError = false;
    let lastErrorMsg = '';

    try {
      const cloudIngs = await getIngredientsFromCloud();
      setIngredients(cloudIngs);
    } catch (err: any) {
      console.warn('Silent warning pulling ingredients table:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    try {
      const cloudPurchases = await getIngredientPurchasesFromCloud();
      setPurchases(cloudPurchases);
    } catch (err: any) {
      console.warn('Silent warning pulling ingredient_purchases table:', err);
    }

    try {
      const cloudRecs = await getRecipesFromCloud();
      setRecipes(cloudRecs);
    } catch (err: any) {
      console.warn('Silent warning pulling recipes table:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    try {
      const cloudProds = await getProductionBatchesFromCloud();
      setProductionBatches(cloudProds);
    } catch (err: any) {
      console.warn('Silent warning pulling production_batches table:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    try {
      const cloudSales = await getSalesFromCloud();
      setSales(cloudSales);
    } catch (err: any) {
      console.warn('Silent warning pulling sales table:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    try {
      const cloudCash = await getCashTransactionsFromCloud();
      setCashTransactions(cloudCash);
    } catch (err: any) {
      console.warn('Silent warning pulling cash_transactions table:', err);
    }

    try {
      const cloudLogs = await getSecurityLogsFromCloud();
      setSecurityLogs(cloudLogs);
    } catch (err: any) {
      console.warn('Silent warning pulling security_logs table:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    try {
      const cloudInv = await getDonutInventoryFromCloud();
      setDonutInventory(cloudInv);
    } catch (err: any) {
      console.warn('Silent warning pulling donut_inventory table:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Fetch users & settings with grace
    try {
      const cloudUsers = await getErpUsersFromCloud();
      setUsers(cloudUsers);
      setIsErpUsersTableMissing(false);
    } catch (err: any) {
      console.warn('Silent warning pulling erp_users table:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('erp_users') || errMsg.includes('relation') || errMsg.includes('cache')) {
        setIsErpUsersTableMissing(true);
      }
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    try {
      const cloudSettings = await getErpSettingsFromCloud();
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    } catch (err: any) {
      console.warn('Silent warning pulling erp_settings table:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    if (hasError) {
      setCloudStatus('error');
      setCloudErrorMessage(lastErrorMsg);
      if (!silent) {
        alert('Beberapa tabel gagal disinkronkan:\n' + lastErrorMsg + '\n\nPastikan Anda telah menjalankan perintah SQL setup lengkap di Supabase SQL Editor.');
      }
    } else {
      setCloudStatus('connected');
      setCloudErrorMessage('');
      if (!silent) {
        addSecurityLog('Sistem berhasil sinkronisasi (pull) data dari Supabase Cloud', 'Aman');
        alert('Berhasil menarik (pull) seluruh data terbaru dari Supabase Cloud!');
      }
    }
  };

  const pushToCloud = async () => {
    const confirmMsg = 'Apakah Anda yakin ingin mengunggah (push) seluruh data lokal saat ini ke database Supabase Cloud?\n\n' +
      'Data yang ada di cloud akan ditimpa dengan data lokal Anda saat ini.';
    if (!window.confirm(confirmMsg)) return;

    setCloudStatus('syncing');
    let hasError = false;
    let lastErrorMsg = '';

    // Save ingredients
    try {
      await saveIngredientsToCloud(ingredients);
    } catch (err: any) {
      console.warn('Failed pushing ingredients to Cloud:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Save purchases
    try {
      for (const pur of purchases) {
        await saveIngredientPurchaseToCloud(pur);
      }
    } catch (err: any) {
      console.warn('Failed pushing purchases to Cloud:', err);
    }

    // Save recipes
    try {
      for (const recipe of recipes) {
        await saveRecipeToCloud(recipe);
      }
    } catch (err: any) {
      console.warn('Failed pushing recipes to Cloud:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Save production batches
    try {
      for (const batch of productionBatches) {
        await saveProductionBatchToCloud(batch);
      }
    } catch (err: any) {
      console.warn('Failed pushing production batches to Cloud:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Save sales
    try {
      for (const sale of sales) {
        await saveSaleToCloud(sale);
      }
    } catch (err: any) {
      console.warn('Failed pushing sales to Cloud:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Save cash transactions
    try {
      for (const tx of cashTransactions) {
        await saveCashTransactionToCloud(tx);
      }
    } catch (err: any) {
      console.warn('Failed pushing cash transactions to Cloud:', err);
    }

    // Save security logs
    try {
      for (const log of securityLogs) {
        await saveSecurityLogToCloud(log);
      }
    } catch (err: any) {
      console.warn('Failed pushing security logs to Cloud:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Save inventory
    try {
      await saveDonutInventoryToCloud(donutInventory);
    } catch (err: any) {
      console.warn('Failed pushing donut inventory to Cloud:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Save users with grace
    try {
      for (const user of users) {
        await saveErpUserToCloud(user);
      }
      setIsErpUsersTableMissing(false);
    } catch (err: any) {
      console.warn('Failed pushing erp_users to Cloud:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('erp_users') || errMsg.includes('relation') || errMsg.includes('cache')) {
        setIsErpUsersTableMissing(true);
      }
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    // Save settings with grace
    try {
      await saveErpSettingsToCloud(settings);
    } catch (err: any) {
      console.warn('Failed pushing erp_settings to Cloud:', err);
      lastErrorMsg = err.message || String(err);
      hasError = true;
    }

    if (hasError) {
      setCloudStatus('error');
      setCloudErrorMessage(lastErrorMsg);
      alert('Gagal mengunggah beberapa tabel ke cloud: ' + lastErrorMsg + '\n\nPastikan Anda telah menjalankan perintah SQL setup lengkap di Supabase SQL Editor.');
    } else {
      setCloudStatus('connected');
      setCloudErrorMessage('');
      addSecurityLog('Seluruh data lokal berhasil dicadangkan (upload) ke Supabase Cloud', 'Aman');
      alert('Berhasil mengunggah seluruh data lokal ke database Supabase Cloud!');
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('donat_erp_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('donat_erp_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('donat_erp_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('donat_erp_production', JSON.stringify(productionBatches));
  }, [productionBatches]);

  useEffect(() => {
    localStorage.setItem('donat_erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('donat_erp_cash_transactions', JSON.stringify(cashTransactions));
  }, [cashTransactions]);

  useEffect(() => {
    localStorage.setItem('donat_erp_security', JSON.stringify(securityLogs));
  }, [securityLogs]);

  useEffect(() => {
    localStorage.setItem('donat_erp_donut_inventory', JSON.stringify(donutInventory));
  }, [donutInventory]);

  useEffect(() => {
    localStorage.setItem('donat_erp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('donat_erp_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync isLoggedIn to LocalStorage
  useEffect(() => {
    localStorage.setItem('donat_erp_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  const handleLoginSuccess = (user?: ErpUser) => {
    setIsLoggedIn(true);
    if (user) {
      setLoggedInUser(user);
      localStorage.setItem('donat_erp_logged_user', JSON.stringify(user));
    } else {
      // Default to Owner if bypassed
      const defaultUser: ErpUser = { id: 'usr_init_2', name: 'Fadli Berniaga', email: 'fadliberniaga@gmail.com', role: 'Owner', status: 'Aktif', password: '123456' };
      setLoggedInUser(defaultUser);
      localStorage.setItem('donat_erp_logged_user', JSON.stringify(defaultUser));
    }
    setTimeout(() => {
      const name = user ? user.name : 'Fadli Berniaga';
      const role = user ? user.role : 'Owner';
      addSecurityLog(`Sesi kerja dimulai: ${name} (${role}) berhasil masuk ke sistem`, 'Aman');
    }, 100);
  };

  const handleLogout = () => {
    const name = loggedInUser ? loggedInUser.name : 'Fadli Berniaga';
    addSecurityLog(`Sesi kerja ${name} diakhiri secara aman`, 'Peringatan');
    setIsLoggedIn(false);
    setLoggedInUser(null);
    localStorage.removeItem('donat_erp_logged_user');
  };

  const handleResetAllData = () => {
    localStorage.removeItem('donat_erp_ingredients');
    localStorage.removeItem('donat_erp_purchases');
    localStorage.removeItem('donat_erp_recipes');
    localStorage.removeItem('donat_erp_production');
    localStorage.removeItem('donat_erp_sales');
    localStorage.removeItem('donat_erp_cash_transactions');
    localStorage.removeItem('donat_erp_security');
    localStorage.removeItem('donat_erp_donut_inventory');
    
    setIngredients([]);
    setPurchases([]);
    setRecipes([]);
    setProductionBatches([]);
    setSales([]);
    setCashTransactions([]);
    setSecurityLogs([]);
    setDonutInventory({});
    
    addSecurityLog('OTORITAS: Seluruh data ERP (Bahan, Resep, Produksi, Kasir, Keuangan) berhasil direset ke kondisi bersih (kosong)', 'Bahaya');
  };

  // Dynamic Financial Calculations (Matching the user's snippet logic!)
  const totalSales = sales.filter((s) => s.status !== 'Void').reduce((sum, s) => sum + s.total, 0);

  const totalCost = productionBatches.reduce((sum, b) => sum + (b.cost || 0), 0);
  const totalVal = productionBatches.reduce((sum, b) => sum + (b.val || 0), 0);

  const profit = totalSales - totalCost;
  const margin = totalCost > 0 ? ((totalVal - totalCost) / totalCost) * 100 : 0;
  const batchCount = productionBatches.length;

  // Add Security Log Helper
  const addSecurityLog = (
    event: string, 
    level: SecurityLog['level'] = 'Aman',
    details?: {
      userName?: string;
      userRole?: string;
      beforeValue?: string;
      afterValue?: string;
      category?: SecurityLog['category'];
    }
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const currentUser = getCurrentUser();
    const userName = details?.userName || (currentUser ? currentUser.name : 'Fadli Berniaga');
    const userRole = details?.userRole || (currentUser ? currentUser.role : 'Owner');

    const newLog: SecurityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: `${dateStr} ${timeStr}`,
      event,
      level,
      userName,
      userRole,
      date: dateStr,
      time: timeStr,
      beforeValue: details?.beforeValue || '-',
      afterValue: details?.afterValue || '-',
      category: details?.category || 'Lainnya'
    };

    setSecurityLogs((prev) => [newLog, ...prev].slice(0, 100));
    if (cloudSyncEnabled) {
      saveSecurityLogToCloud(newLog).catch((err) => console.error('Cloud log sync warning:', err));
    }
  };

  // Helper: Increment or decrement finished donut inventory (supports single flavor or batch map)
  const handleUpdateDonutInventory = (
    flavorOrAdjustments: string | Record<string, number>,
    addQty?: number
  ) => {
    setDonutInventory((prev) => {
      const next = { ...prev };
      if (typeof flavorOrAdjustments === 'object' && flavorOrAdjustments !== null) {
        Object.entries(flavorOrAdjustments).forEach(([flavor, delta]) => {
          const current = next[flavor] || 0;
          const nextVal = current + delta;
          next[flavor] = nextVal < 0 ? 0 : nextVal;
        });
      } else if (typeof flavorOrAdjustments === 'string') {
        const flavor = flavorOrAdjustments;
        const delta = addQty || 0;
        const current = next[flavor] || 0;
        const nextVal = current + delta;
        next[flavor] = nextVal < 0 ? 0 : nextVal;
      }
      if (cloudSyncEnabled) {
        saveDonutInventoryToCloud(next).catch((err) => console.error('Cloud sync error:', err));
      }
      return next;
    });
  };

  const handleMarkTransactionsClosed = (dateStr: string) => {
    // 1. Mark sales for this date as closed
    setSales((prev) => {
      const next = prev.map((s) => {
        const sDate = s.date.split(' ')[0] || s.date.split('T')[0];
        if (sDate === dateStr) {
          const updated = { ...s, isClosed: true };
          if (cloudSyncEnabled) {
            saveSaleToCloud(updated).catch((err) => console.error('Cloud sales closed sync error:', err));
          }
          return updated;
        }
        return s;
      });
      return next;
    });

    // 2. Mark production batches for this date as closed
    setProductionBatches((prev) => {
      const next = prev.map((b) => {
        const bDate = b.date.split(' ')[0] || b.date.split('T')[0];
        if (bDate === dateStr) {
          const updated = { ...b, isClosed: true };
          if (cloudSyncEnabled) {
            saveProductionBatchToCloud(updated).catch((err) => console.error('Cloud batch closed sync error:', err));
          }
          return updated;
        }
        return b;
      });
      return next;
    });
  };

  const handleUpdateSettings = (updated: ErpSettings) => {
    const beforeStr = `Toko: ${settings.storeName || '-'}, PPN: ${settings.taxPercent}%, Servis: ${settings.servicePercent}%`;
    const afterStr = `Toko: ${updated.storeName || '-'}, PPN: ${updated.taxPercent}%, Servis: ${updated.servicePercent}%`;
    setSettings(updated);
    if (cloudSyncEnabled) {
      saveErpSettingsToCloud(updated).catch(err => console.error('Cloud sync error settings:', err));
    }
    addSecurityLog('Mengubah konfigurasi & parameter toko global', 'Aman', {
      category: 'Perubahan Setting',
      beforeValue: beforeStr,
      afterValue: afterStr
    });
  };

  const handleAddUser = async (userOmitId: Omit<ErpUser, 'id'>): Promise<void> => {
    const newUser: ErpUser = {
      ...userOmitId,
      id: 'usr_' + Date.now()
    };
    
    // 1. Update state local
    setUsers((prev) => [...prev, newUser]);
    addSecurityLog(`Mendaftarkan staff baru: ${newUser.name} (${newUser.role})`, 'Aman', {
      category: 'Perubahan User',
      beforeValue: '-',
      afterValue: `${newUser.name} | ${newUser.email} | ${newUser.role} | ${newUser.status}`
    });

    // 2. Hubungkan ke database cloud jika sinkronisasi aktif
    if (cloudSyncEnabled) {
      try {
        await saveErpUserToCloud(newUser);
        setIsErpUsersTableMissing(false);
      } catch (err: any) {
        console.error('Cloud sync error add user:', err);
        const errMsg = err?.message || String(err);
        if (errMsg.includes('erp_users') || errMsg.includes('relation') || errMsg.includes('cache')) {
          setIsErpUsersTableMissing(true);
        }
        addSecurityLog(`Gagal sinkronisasi staff baru ke cloud: ${err.message || String(err)}`, 'Bahaya');
        throw err;
      }
    }
  };

  const handleUpdateUser = async (updatedUser: ErpUser): Promise<void> => {
    const oldUser = users.find(u => u.id === updatedUser.id);
    const beforeStr = oldUser ? `${oldUser.name} (${oldUser.role}, Status: ${oldUser.status})` : '-';
    const afterStr = `${updatedUser.name} (${updatedUser.role}, Status: ${updatedUser.status})`;
    
    // 1. Update state local
    setUsers((prev) => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addSecurityLog(`Mengubah profil/status staff: ${updatedUser.name}`, 'Aman', {
      category: 'Perubahan User',
      beforeValue: beforeStr,
      afterValue: afterStr
    });

    // 2. Hubungkan ke database cloud jika sinkronisasi aktif
    if (cloudSyncEnabled) {
      try {
        await saveErpUserToCloud(updatedUser);
        setIsErpUsersTableMissing(false);
      } catch (err: any) {
        console.error('Cloud sync error update user:', err);
        const errMsg = err?.message || String(err);
        if (errMsg.includes('erp_users') || errMsg.includes('relation') || errMsg.includes('cache')) {
          setIsErpUsersTableMissing(true);
        }
        addSecurityLog(`Gagal sinkronisasi update staff ke cloud: ${err.message || String(err)}`, 'Bahaya');
        throw err;
      }
    }
  };

  const handleDeleteUser = async (id: string): Promise<void> => {
    const userToDelete = users.find(u => u.id === id);
    
    // 1. Update state local
    setUsers((prev) => prev.filter(u => u.id !== id));
    if (userToDelete) {
      addSecurityLog(`Menghapus staff/user: ${userToDelete.name} (${userToDelete.role})`, 'Peringatan', {
        category: 'Perubahan User',
        beforeValue: `${userToDelete.name} (${userToDelete.role}, ${userToDelete.email})`,
        afterValue: 'Akun Dihapus'
      });
    }

    // 2. Hubungkan ke database cloud jika sinkronisasi aktif
    if (cloudSyncEnabled) {
      try {
        await deleteErpUserFromCloud(id);
        setIsErpUsersTableMissing(false);
      } catch (err: any) {
        console.error('Cloud sync error delete user:', err);
        const errMsg = err?.message || String(err);
        if (errMsg.includes('erp_users') || errMsg.includes('relation') || errMsg.includes('cache')) {
          setIsErpUsersTableMissing(true);
        }
        addSecurityLog(`Gagal sinkronisasi hapus staff dari cloud: ${err.message || String(err)}`, 'Bahaya');
        throw err;
      }
    }
  };

  // RPC Atomic Bulk Update Ingredients Stock caller
  const handleBulkUpdateIngredients = async (updatedIngredients: Ingredient[]) => {
    try {
      // 1. Update state local
      setIngredients(updatedIngredients);

      // 2. Jika sinkronisasi cloud aktif, panggil RPC secara atomic
      if (cloudSyncEnabled) {
        const payload = updatedIngredients.map((ing) => ({
          id: ing.id,
          qty: ing.qty
        }));
        
        await bulkUpdateIngredientsStockCloud(payload);
        addSecurityLog('Sinkronisasi Stok: Berhasil melakukan update bulk atomic ke Supabase via RPC', 'Aman');
      }
    } catch (err: any) {
      console.error('Failed to update ingredients via RPC:', err);
      addSecurityLog(`Sinkronisasi Stok Gagal: ${err.message || String(err)}`, 'Bahaya');
      alert('Gagal melakukan update stok atomic ke cloud: ' + (err.message || String(err)));
    }
  };

  // Date and titles
  const formattedTodayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const titles: Record<string, string> = {
    ringkasan: 'Ringkasan',
    stok: 'Stok Bahan Baku',
    resep: 'Resep & HPP',
    produksi: 'Produksi',
    kasir: 'Kasir Penjualan',
    rekap: 'Rekap Jual',
    keuangan: 'Manajemen Keuangan & Kas',
    tutup_buku: 'Tutup Buku Harian (Daily Closing)',
    pengaturan: 'Pengaturan ERP',
  };

  const navItems = [
    { key: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
    { key: 'stok', label: 'Stok Bahan Baku', icon: Boxes },
    { key: 'resep', label: 'Resep & HPP', icon: BookOpen },
    { key: 'produksi', label: 'Produksi', icon: ChefHat },
    { key: 'kasir', label: 'Kasir', icon: Receipt },
    { key: 'rekap', label: 'Rekap Jual', icon: History },
    { key: 'keuangan', label: 'Keuangan', icon: Wallet },
    { key: 'tutup_buku', label: 'Tutup Buku', icon: Lock },
    { key: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  // Calculate dynamic weekly sales heights for our bar-chart!
  // It takes baseline from WEEKLY_SALES_TREND, but Thursday ('Kam') is updated with our live sales!
  const liveWeeklySales = WEEKLY_SALES_TREND.map((dayData) => {
    if (dayData.day === 'Kam') {
      // today is thursday, so update with today's live sales
      return {
        ...dayData,
        revenue: totalSales > 0 ? totalSales : dayData.revenue,
      };
    }
    return dayData;
  });

  const maxRevenue = Math.max(...liveWeeklySales.map((d) => d.revenue));

  // Determine low stock count
  const lowStockCount = ingredients.filter((ing) => ing.qty <= ing.minQty).length;

  // Calculate top selling flavors for our graphical chart
  const flavorSalesMap: Record<string, number> = {};
  sales.filter((s) => s.status !== 'Void').forEach((s) => {
    if (s.items && Array.isArray(s.items)) {
      s.items.forEach((item) => {
        flavorSalesMap[item.name] = (flavorSalesMap[item.name] || 0) + item.qty;
      });
    }
  });

  const topFlavors = Object.entries(flavorSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  const displayFlavors = topFlavors.slice(0, 5);

  const totalFlavorsQty = displayFlavors.reduce((sum, f) => sum + f.qty, 0);

  // Calculate payment method distribution
  let qrisSales = 0;
  let tunaiSales = 0;
  sales.filter((s) => s.status !== 'Void').forEach((s) => {
    if (s.paymentMethod === 'QRIS') {
      qrisSales += s.total;
    } else {
      tunaiSales += s.total;
    }
  });

  const displayQrisSales = qrisSales;
  const displayTunaiSales = tunaiSales;
  const totalDisplaySales = displayQrisSales + displayTunaiSales;
  const qrisPercentage = totalDisplaySales > 0 ? (displayQrisSales / totalDisplaySales) * 100 : 0;
  const tunaiPercentage = totalDisplaySales > 0 ? (displayTunaiSales / totalDisplaySales) * 100 : 0;

  const getDisplayUser = (): { name: string; role: string; initial: string } => {
    if (loggedInUser) {
      const initial = loggedInUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
      const roleMap: Record<string, string> = {
        Owner: 'Owner / Pemilik',
        Manager: 'Manager Toko',
        Baker: 'Baker Dapur',
        Kasir: 'Kasir Toko'
      };
      return {
        name: loggedInUser.name,
        role: roleMap[loggedInUser.role] || loggedInUser.role,
        initial,
      };
    }
    return {
      name: 'Fadli Berniaga',
      role: 'Owner / Pemilik',
      initial: 'FB',
    };
  };
  const displayUser = getDisplayUser();

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-[#FAF6F0] text-[#3A2319]">
      {/* ================= SIDEBAR ================= */}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-none flex-col sticky top-0 h-screen bg-gradient-to-b from-[#28160E] to-[#311C13] text-[#F3EDE4] px-5 py-6 justify-between z-10 border-r border-[#E5DCD0]/10">
        <div className="space-y-6">
          {/* Brand Mark */}
          <div className="flex items-center gap-3 px-2 pb-4 border-b border-[#EADFCF]/10">
            <svg className="w-9 h-9 flex-none" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="22" cy="22" r="19" stroke="#EADFCF" strokeWidth={2} />
              <circle cx="22" cy="22" r="7" fill="#1D1712" />
              <circle cx="22" cy="22" r="7" stroke="#EADFCF" strokeWidth={2} />
              <path d="M8 15 Q22 8 36 15" stroke="#A2583E" strokeWidth={2} strokeLinecap="round" fill="none" />
            </svg>
            <div className="brand-word font-serif text-lg tracking-wide">
              Brownkiss<b className="font-bold text-[#A2583E]">ERP</b>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7A3E2B]/70 to-[#7A3E2B]/30 text-[#FAF6F0] border-l-3 border-[#A2583E]'
                      : 'text-[#C9BEB0] hover:bg-white/5 hover:text-[#F3EDE4]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-none opacity-80" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#7A3E2B] text-[#FAF6F0] font-mono text-sm font-semibold flex items-center justify-center flex-none">
              {displayUser.initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#F3EDE4] truncate">{displayUser.name}</p>
              <p className="text-[10px] font-mono text-[#8F8377]">{displayUser.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-[#C9BEB0] hover:text-[#A2583E] hover:bg-white/5 rounded-xl transition-all cursor-pointer flex-none"
            title="Keluar dari sistem"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-20 transition-all"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slideout */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#28160E] to-[#311C13] text-[#F3EDE4] p-5 flex flex-col justify-between z-30 transition-transform duration-300 ease-out border-r border-[#E5DCD0]/10 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EADFCF]/10">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 flex-none" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="22" cy="22" r="19" stroke="#EADFCF" strokeWidth={2} />
                <circle cx="22" cy="22" r="7" fill="#1D1712" />
                <circle cx="22" cy="22" r="7" stroke="#EADFCF" strokeWidth={2} />
                <path d="M8 15 Q22 8 36 15" stroke="#A2583E" strokeWidth={2} strokeLinecap="round" fill="none" />
              </svg>
              <div className="brand-word font-serif text-base tracking-wide">
                Brownkiss<b>ERP</b>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#C9BEB0] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigateToView(item.key as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7A3E2B]/70 to-[#7A3E2B]/30 text-[#FAF6F0]'
                      : 'text-[#C9BEB0] hover:bg-white/5 hover:text-[#F3EDE4]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-none opacity-80" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#7A3E2B] text-[#FAF6F0] font-mono text-xs font-semibold flex items-center justify-center flex-none">
              {displayUser.initial}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F3EDE4]">{displayUser.name}</p>
              <p className="text-[10px] font-mono text-[#8F8377]">{displayUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="p-2 text-[#C9BEB0] hover:text-[#A2583E] hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#E5DCD0] py-4 px-6 md:px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 border border-[#E5DCD0] rounded-lg bg-white text-[#614B3E] hover:text-[#7A3E2B] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-wider text-[#9E8A78] uppercase">
                Brownkiss ERP System
              </p>
              <h1 className="font-serif font-medium text-lg md:text-2xl text-[#3A2319]">
                {titles[activeView]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live date badge */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#614B3E] bg-white border border-[#E5DCD0] px-3.5 py-2 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-[#7A3E2B]" />
              <span>{formattedTodayDate}</span>
            </div>
            {/* Notifications mock button */}
            <button
              className="relative p-2.5 border border-[#E5DCD0] rounded-xl bg-white text-[#614B3E] hover:border-[#7A3E2B] hover:text-[#7A3E2B] transition-colors cursor-pointer"
              aria-label="Notifikasi"
              onClick={() => alert('Sistem stabil. Semua sensor perimeter keamanan hijau.')}
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B03E2B] animate-ping" />
              )}
            </button>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2.5 border border-[#E5DCD0] rounded-xl bg-white text-[#614B3E] hover:border-[#A2583E] hover:text-[#A2583E] transition-colors cursor-pointer flex items-center gap-2"
              title="Keluar dari sistem"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-semibold">Keluar</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-rise">
          {/* ============ VIEW: RINGKASAN ============ */}
          {activeView === 'ringkasan' && (
            <DashboardOwner
              sales={sales}
              productionBatches={productionBatches}
              ingredients={ingredients}
              purchases={purchases}
              recipes={recipes}
              cashTransactions={cashTransactions}
              settings={settings}
              donutInventory={donutInventory}
              securityLogs={securityLogs}
              onNavigateView={(view) => setActiveView(view)}
            />
          )}

          {false && activeView === 'ringkasan' && (
            <div className="space-y-6">
              {/* Dynamic KPI Cards Grid */}
              <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-white border border-[#E9E2D8] rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
                  <div className="stat-label text-xs text-[#9A8E80] mb-3 font-medium flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    <span>Total Penjualan</span>
                  </div>
                  <div className="stat-value font-serif font-semibold text-2xl text-[#2A2420]" id="sum-sales">
                    Rp {totalSales.toLocaleString('id-ID')}
                  </div>
                  <span className="stat-delta text-[11px] font-bold text-[#7FA88B] mt-1.5 block">
                    ▲ Live Sesi Ritel
                  </span>
                </div>

                <div className="stat-card bg-white border border-[#E9E2D8] rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
                  <div className="stat-label text-xs text-[#9A8E80] mb-3 font-medium flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M6 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/></svg>
                    <span>Total Batch Masak</span>
                  </div>
                  <div className="stat-value font-serif font-semibold text-2xl text-[#2A2420]" id="sum-batch">
                    {batchCount} Batch
                  </div>
                  <span className="stat-delta text-[11px] font-bold text-[#7FA88B] mt-1.5 block">
                    ▲ Oven Terpantau
                  </span>
                </div>

                <div className="stat-card bg-white border border-[#E9E2D8] rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
                  <div className="stat-label text-xs text-[#9A8E80] mb-3 font-medium flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                    <span>Margin Rata-rata</span>
                  </div>
                  <div className="stat-value font-serif font-semibold text-2xl text-[#2A2420]" id="sum-margin">
                    {margin.toFixed(1)}%
                  </div>
                  <span className="stat-delta text-[11px] font-bold text-[#7FA88B] mt-1.5 block">
                    ▲ Sehat (&gt;50%)
                  </span>
                </div>

                <div className="stat-card bg-white border border-l-4 border-[#E9E2D8] border-l-[#8B3350] rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
                  <div className="stat-label text-xs text-[#8B3350] mb-3 font-semibold flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>Estimasi Profit</span>
                  </div>
                  <div className="stat-value font-serif font-semibold text-2xl text-[#8B3350]" id="sum-profit">
                    Rp {(profit > 0 ? profit : 0).toLocaleString('id-ID')}
                  </div>
                  <span className="stat-delta text-[11px] font-bold text-[#8B3350] mt-1.5 block">
                    Kinerja Keuangan Bersih
                  </span>
                </div>
              </div>

              {/* Grid 2 Columns: Weekly Chart & Low Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Tren Penjualan Weekly Chart */}
                <div className="panel-card bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs lg:col-span-3 space-y-4">
                  <div className="panel-head flex items-center justify-between">
                    <div>
                      <h3 className="panel-title font-serif font-semibold text-base text-[#2A2420]">
                        Tren Penjualan Mingguan
                      </h3>
                      <p className="panel-sub text-xs text-[#9A8E80]">
                        Pendapatan harian yang dihitung dari transaksi pos
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToView('rekap')}
                      className="link-more text-xs font-semibold text-[#8B3350] hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      Lihat detail
                    </button>
                  </div>

                  {/* Simple Custom Bar Chart from UI taste spec */}
                  <div className="bar-chart flex items-end gap-5 h-44 pt-4 px-2">
                    {liveWeeklySales.map((d) => {
                      const percentage = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 10;
                      return (
                        <div key={d.day} className="bar-col flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full flex justify-center">
                            {/* tooltip */}
                            <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2A2420] text-[#F3EDE4] text-[10px] font-mono px-1.5 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-10">
                              Rp {d.revenue.toLocaleString('id-ID')}
                            </span>
                            <div
                              className="bar w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#8B3350] to-[#B8547A] group-hover:from-[#B8547A] group-hover:to-[#8B3350] transition-all duration-500 ease-out"
                              style={{ height: `${percentage}%` }}
                            />
                          </div>
                          <span className="bar-day text-[10px] font-mono font-medium text-[#9A8E80]">
                            {d.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Low Stock Warning List */}
                <div className="panel-card bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
                  <div className="panel-head flex items-center justify-between">
                    <div>
                      <h3 className="panel-title font-serif font-semibold text-base text-[#2A2420]">
                        Bahan Baku Menipis
                      </h3>
                      <p className="panel-sub text-xs text-[#9A8E80]">
                        Mencegah hambatan rantai produksi oven
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToView('stok')}
                      className="link-more text-xs font-semibold text-[#8B3350] hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      Lihat semua
                    </button>
                  </div>

                  <ul className="stock-list divide-y divide-[#E9E2D8]">
                    {ingredients
                      .slice()
                      .sort((a, b) => (a.qty / a.minQty) - (b.qty / b.minQty))
                      .slice(0, 4)
                      .map((ing) => {
                        const ratio = ing.qty / ing.minQty;
                        const pct = Math.min(Math.round(ratio * 100), 100);
                        let barColor = 'bg-[#7FA88B]'; // ok
                        if (ratio <= 0.3) {
                          barColor = 'bg-[#B3432F]'; // crit
                        } else if (ratio <= 1.0) {
                          barColor = 'bg-[#C08A34]'; // low
                        }

                        return (
                          <li key={ing.id} className="py-2.5">
                            <div className="stock-row flex justify-between text-xs mb-1.5">
                              <span className="stock-name font-semibold text-[#2A2420]">
                                {ing.name}
                              </span>
                              <span className="stock-qty font-mono font-medium text-[#5C5248]">
                                {ing.qty} {ing.unit} / {ing.minQty} {ing.unit}
                              </span>
                            </div>
                            <div className="progress-track h-1.5 bg-[#EFE8DC] rounded-full overflow-hidden">
                              <div
                                className={`progress-fill h-full rounded-full ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>

              {/* Analisis Produk & Transaksi (Visual Analytics) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribusi Varian Terlaris */}
                <div className="panel-card bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="panel-head flex justify-between items-center">
                    <div>
                      <h3 className="panel-title font-serif font-semibold text-base text-[#2A2420]">
                        Distribusi Varian Donat Terlaris
                      </h3>
                      <p className="panel-sub text-xs text-[#9A8E80]">
                        Berdasarkan kuantitas donat yang laku terjual di kasir
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#8B3350]/10 text-[#8B3350] px-2.5 py-1 rounded-lg">
                      {totalFlavorsQty} Pcs Terjual
                    </span>
                  </div>

                  <div className="space-y-4">
                    {displayFlavors.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-[#E9E2D8] rounded-xl bg-[#FBFBFB]">
                        <p className="text-sm font-semibold text-[#8B3350]">Belum ada varian terjual</p>
                        <p className="text-xs text-[#9A8E80] mt-1 max-w-[220px]">
                          Transaksi penjualan yang sukses di kasir akan otomatis teranalisis di sini secara real-time.
                        </p>
                      </div>
                    ) : (
                      displayFlavors.map((flavor, idx) => {
                        const sharePct = totalFlavorsQty > 0 ? (flavor.qty / totalFlavorsQty) * 100 : 0;
                        // Unique color schemes for each flavor bar
                        const colors = [
                          'from-[#8B3350] to-[#B8547A]', // burgundy
                          'from-[#C79458] to-[#E5B580]', // caramel
                          'from-[#5C5248] to-[#928170]', // chocolate
                          'from-[#A35D4C] to-[#C88473]', // velvet
                          'from-[#4A6B53] to-[#71967A]', // matcha
                        ];
                        const colorClass = colors[idx % colors.length];

                        return (
                          <div key={flavor.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-[#2A2420] flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#8B3350] to-[#B8547A]" style={{ backgroundImage: `linear-gradient(to top right, var(--tw-gradient-stops))` }} />
                                {flavor.name}
                              </span>
                              <span className="font-mono font-bold text-[#5C5248]">
                                {flavor.qty} pcs ({sharePct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-2.5 bg-[#F6EDDD] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                                style={{ width: `${sharePct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Ringkasan Finansial & Metode Pembayaran */}
                <div className="panel-card bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="panel-head">
                    <h3 className="panel-title font-serif font-semibold text-base text-[#2A2420]">
                      Metode Pembayaran &amp; Target Harian
                    </h3>
                    <p className="panel-sub text-xs text-[#9A8E80]">
                      Preferensi kasir digital dan rasio capaian omset hari ini
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* QRIS vs Cash Donut representation */}
                    <div className="border border-[#E9E2D8] rounded-xl p-4 flex flex-col justify-between space-y-3 bg-[#FBFBFB]">
                      <span className="text-xs font-semibold text-[#9A8E80] uppercase tracking-wider block">
                        Metode Pembayaran
                      </span>
                      <div className="relative flex items-center justify-center h-24">
                        {/* Beautiful custom pure css doughnut chart */}
                        <div className="w-20 h-20 rounded-full border-8 border-gray-100 flex items-center justify-center relative" style={{ backgroundImage: totalDisplaySales > 0 ? `conic-gradient(#8B3350 ${qrisPercentage}%, #C79458 ${qrisPercentage}% 100%)` : 'none', backgroundColor: totalDisplaySales > 0 ? 'transparent' : '#E9E2D8' }}>
                          <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[10px] text-[#9A8E80] font-bold">QRIS Share</span>
                            <span className="text-xs font-mono font-bold text-[#8B3350]">{totalDisplaySales > 0 ? `${qrisPercentage.toFixed(0)}%` : '0%'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between text-[11px] font-mono border-t border-[#E9E2D8] pt-2 gap-1">
                        <span className="text-[#8B3350] font-bold">● QRIS: Rp {displayQrisSales.toLocaleString('id-ID')}</span>
                        <span className="text-[#C79458] font-bold">● Tunai: Rp {displayTunaiSales.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Progress Target Capaian */}
                    <div className="border border-[#E9E2D8] rounded-xl p-4 flex flex-col justify-between space-y-3 bg-[#FBFBFB]">
                      <span className="text-xs font-semibold text-[#9A8E80] uppercase tracking-wider block">
                        Target Omset Hari Ini
                      </span>
                      
                      <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline">
                          <span className="text-lg font-mono font-bold text-[#2A2420]">
                            {((totalSales / 5000000) * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-[#9A8E80] font-mono">
                            Target: Rp 5.000.000
                          </span>
                        </div>
                        <div className="h-3 bg-[#EFE8DC] rounded-full overflow-hidden relative">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-[#8B3350] to-[#C79458] transition-all duration-700"
                            style={{ width: `${Math.min(((totalSales / 5000000) * 100), 100) || 12}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#7A6A56] leading-snug">
                          {totalSales >= 5000000 
                            ? '🎉 Selamat! Target penjualan harian telah tercapai hari ini!' 
                            : `Kurang Rp ${(5000000 - totalSales).toLocaleString('id-ID')} lagi untuk mencapai target.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2 Columns: Activity Log & Security Monitoring (Fixed and Dynamic!) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dynamic Tabel Log Aktivitas */}
                <div className="panel-card bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="panel-head">
                    <div>
                      <h3 className="panel-title font-serif font-semibold text-base text-[#2A2420]">
                        Tabel Log Aktivitas Produksi
                      </h3>
                      <p className="panel-sub text-xs text-[#9A8E80]">
                        Riwayat operasional pemrosesan donat waktu nyata
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse" id="summary-activity-table">
                      <thead>
                        <tr className="border-b border-[#E9E2D8]">
                          <th className="pb-2 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px]">Waktu</th>
                          <th className="pb-2 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9E2D8]">
                        {productionBatches.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="py-4 text-center text-[#9A8E80] font-mono italic">
                              Tidak ada riwayat aktivitas produksi
                            </td>
                          </tr>
                        ) : (
                          productionBatches.map((p) => (
                            <tr key={p.id} className="hover:bg-[#FBF8F3] transition-colors">
                              <td className="py-3 pr-4 text-[#9A8E80] font-mono whitespace-nowrap">
                                {p.date}
                              </td>
                              <td className="py-3 text-[#2A2420]">
                                Memproduksi <strong>{p.qty}</strong> unit{' '}
                                <span className="font-semibold text-[#8B3350]">{p.resep}</span>{' '}
                                <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full font-mono bg-[#EEF4EF] text-[#4C7A5C]">
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Log Keamanan Terbaru */}
                <div className="panel-card bg-white border border-[#E9E2D8] rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="panel-head">
                    <div>
                      <h3 className="panel-title font-serif font-semibold text-base text-[#2A2420]">
                        Log Keamanan Terbaru
                      </h3>
                      <p className="panel-sub text-xs text-[#9A8E80]">
                        Pemantauan perimeter otentikasi sistem pusat
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E9E2D8]">
                          <th className="pb-2 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px]">Kejadian</th>
                          <th className="pb-2 font-bold text-[#9A8E80] uppercase tracking-wider text-[11px] text-right">Tingkat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9E2D8]">
                        {securityLogs.slice(0, 6).map((log) => {
                          let badgeClass = 'text-emerald-700 bg-emerald-50';
                          if (log.level === 'Peringatan') {
                            badgeClass = 'text-amber-700 bg-amber-50';
                          } else if (log.level === 'Bahaya') {
                            badgeClass = 'text-red-700 bg-red-50';
                          }

                          return (
                            <tr key={log.id} className="hover:bg-[#FBF8F3] transition-colors">
                              <td className="py-3 pr-4">
                                <p className="font-medium text-[#2A2420]">{log.event}</p>
                                <span className="text-[10px] text-[#9A8E80] font-mono">{log.timestamp}</span>
                              </td>
                              <td className="py-3 text-right">
                                <span className={`badge text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${badgeClass}`}>
                                  {log.level}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ VIEW: STOK BAHAN BAKU ============ */}
          {activeView === 'stok' && (
            <IngredientManager
              ingredients={ingredients}
              recipes={recipes}
              purchases={purchases}
              settings={settings}
              onAddPurchase={(newPur) => {
                const created: IngredientPurchase = {
                  ...newPur,
                  id: 'pur_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                };
                setPurchases((prev) => [created, ...prev]);
                if (cloudSyncEnabled) {
                  saveIngredientPurchaseToCloud(created).catch((err) => console.error('Cloud purchase sync error:', err));
                }
              }}
              onUpdateIngredient={(updated) => {
                const next = ingredients.map((i) => (i.id === updated.id ? updated : i));
                setIngredients(next);
                if (cloudSyncEnabled) {
                  saveIngredientsToCloud(next).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onAddIngredient={(newIng) => {
                const created: Ingredient = {
                  ...newIng,
                  id: 'ing_' + Date.now(),
                };
                const next = [...ingredients, created];
                setIngredients(next);
                addSecurityLog(`Bahan baku baru ditambahkan: ${newIng.name}`, 'Aman');
                if (cloudSyncEnabled) {
                  saveIngredientsToCloud(next).catch((err) => console.error('Cloud sync error:', err));
                }
                return created;
              }}
              onDeleteIngredient={(id) => {
                const ing = ingredients.find((i) => i.id === id);
                const next = ingredients.filter((i) => i.id !== id);
                setIngredients(next);
                if (ing) {
                  addSecurityLog(`Bahan baku "${ing.name}" dihapus dari sistem`, 'Peringatan');
                }
                if (cloudSyncEnabled) {
                  saveIngredientsToCloud(next).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
            />
          )}

          {/* ============ VIEW: RESEP & HPP ============ */}
          {activeView === 'resep' && (
            <RecipeManager
              recipes={recipes}
              ingredients={ingredients}
              batches={productionBatches}
              onAddRecipe={(newRecipe) => {
                setRecipes((prev) => [...prev, newRecipe]);
                addSecurityLog(`Resep donat baru terdaftar: ${newRecipe.name}`, 'Aman');
                if (cloudSyncEnabled) {
                  saveRecipeToCloud(newRecipe).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onUpdateRecipe={(updatedRecipe) => {
                setRecipes((prev) => prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
                addSecurityLog(`Resep "${updatedRecipe.name}" diperbarui (v${updatedRecipe.version || 1}, Status: ${updatedRecipe.status || 'Aktif'})`, 'Aman');
                if (cloudSyncEnabled) {
                  saveRecipeToCloud(updatedRecipe).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onUpdateIngredient={(updatedIng) => {
                const next = ingredients.map((i) => (i.id === updatedIng.id ? updatedIng : i));
                setIngredients(next);
                if (cloudSyncEnabled) {
                  saveIngredientsToCloud(next).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onDeleteRecipe={(id) => {
                const recipe = recipes.find((r) => r.id === id);
                setRecipes((prev) => prev.filter((r) => r.id !== id));
                if (recipe) {
                  addSecurityLog(`Resep donat dihapus dari sistem: ${recipe.name}`, 'Peringatan');
                }
                if (cloudSyncEnabled) {
                  deleteRecipeFromCloud(id).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
            />
          )}

          {/* ============ VIEW: PRODUKSI ============ */}
          {activeView === 'produksi' && (
            <ProductionManager
              batches={productionBatches}
              recipes={recipes}
              ingredients={ingredients}
              donutInventory={donutInventory}
              users={users}
              currentUser={loggedInUser}
              onAddBatch={(newBatch) => {
                setProductionBatches((prev) => [newBatch, ...prev]);
                if (cloudSyncEnabled) {
                  saveProductionBatchToCloud(newBatch).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onUpdateBatch={(updatedBatch) => {
                setProductionBatches((prev) =>
                  prev.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
                );
                if (cloudSyncEnabled) {
                  saveProductionBatchToCloud(updatedBatch).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onDeleteBatch={(id) => {
                setProductionBatches((prev) => prev.filter((b) => b.id !== id));
                if (cloudSyncEnabled) {
                  deleteProductionBatchFromCloud(id).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onUpdateIngredients={handleBulkUpdateIngredients}
              onUpdateDonutInventory={handleUpdateDonutInventory}
              onAddSecurityLog={addSecurityLog}
            />
          )}

          {/* ============ VIEW: KASIR ============ */}
          {activeView === 'kasir' && (
            <KasirManager
              recipes={recipes}
              sales={sales}
              donutInventory={donutInventory}
              settings={settings}
              onProcessSale={(newSale) => {
                setSales((prev) => [newSale, ...prev]);
                if (cloudSyncEnabled) {
                  saveSaleToCloud(newSale).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onVoidSale={(id, meta) => {
                const targetSale = sales.find((s) => s.id === id);
                if (!targetSale) return;

                const updatedSale: Sale = {
                  ...targetSale,
                  status: 'Void',
                  voidedBy: meta.voidedBy,
                  voidedAt: meta.voidedAt,
                  voidReason: meta.voidReason,
                };

                setSales((prev) => prev.map((s) => (s.id === id ? updatedSale : s)));

                if (cloudSyncEnabled) {
                  saveSaleToCloud(updatedSale).catch((err) => console.error('Cloud sync error void sale:', err));
                }
              }}
              onUpdateSale={(updatedSale) => {
                setSales((prev) => prev.map((s) => (s.id === updatedSale.id ? updatedSale : s)));
                if (cloudSyncEnabled) {
                  saveSaleToCloud(updatedSale).catch((err) => console.error('Cloud sync error update sale:', err));
                }
              }}
              onUpdateDonutInventory={handleUpdateDonutInventory}
              onAddSecurityLog={addSecurityLog}
            />
          )}

          {/* ============ VIEW: REKAP JUAL ============ */}
          {activeView === 'rekap' && (
            <RekapManager
              sales={sales}
              recipes={recipes}
              settings={settings}
            />
          )}

          {/* ============ VIEW: KEUANGAN ============ */}
          {activeView === 'keuangan' && (
            <KeuanganManager
              sales={sales}
              recipes={recipes}
              cashTransactions={cashTransactions}
              purchases={purchases}
              settings={settings}
              onAddCashTransaction={(newTx) => {
                setCashTransactions((prev) => [newTx, ...prev]);
                if (cloudSyncEnabled) {
                  saveCashTransactionToCloud(newTx).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onDeleteCashTransaction={(id) => {
                setCashTransactions((prev) => prev.filter((t) => t.id !== id));
                if (cloudSyncEnabled) {
                  deleteCashTransactionFromCloud(id).catch((err) => console.error('Cloud sync error:', err));
                }
              }}
              onAddSecurityLog={addSecurityLog}
            />
          )}

          {/* ============ VIEW: TUTUP BUKU HARIAN ============ */}
          {activeView === 'tutup_buku' && (
            <ClosingManager
              sales={sales}
              ingredients={ingredients}
              donutInventory={donutInventory}
              productionBatches={productionBatches}
              cashTransactions={cashTransactions}
              settings={settings}
              users={users}
              onUpdateDonutInventory={handleUpdateDonutInventory}
              onMarkTransactionsClosed={handleMarkTransactionsClosed}
              onAddClosingReport={(report, snapshot) => {
                if (cloudSyncEnabled) {
                  saveClosingReportToCloud(report).catch((err) => console.error('Cloud closing report sync error:', err));
                  saveInventorySnapshotToCloud(snapshot).catch((err) => console.error('Cloud snapshot sync error:', err));
                }
              }}
              onAddSecurityLog={addSecurityLog}
            />
          )}

          {/* ============ VIEW: PENGATURAN ============ */}
          {activeView === 'pengaturan' && (
            <SettingManager
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              cloudSyncEnabled={cloudSyncEnabled}
              onToggleCloudSync={(enabled) => {
                setCloudSyncEnabled(enabled);
                if (enabled) {
                  addSecurityLog('Otoritas Cloud: Sinkronisasi otomatis diaktifkan', 'Aman');
                } else {
                  addSecurityLog('Otoritas Cloud: Sinkronisasi otomatis dinonaktifkan', 'Peringatan');
                }
              }}
              cloudStatus={cloudStatus}
              cloudErrorMessage={cloudErrorMessage}
              isErpUsersTableMissing={isErpUsersTableMissing}
              onForceSync={() => fetchFromCloud(false)}
              onPushToCloud={pushToCloud}
              onResetAllData={handleResetAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
