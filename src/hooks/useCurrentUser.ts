import { useState, useEffect } from 'react';
import { ErpUser } from '../types';

/**
 * Helper to safely retrieve current logged-in user from localStorage with try/catch.
 */
export function getCurrentUser(): ErpUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('donat_erp_logged_user');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Gagal membaca data user dari localStorage:', error);
    return null;
  }
}

/**
 * Custom React hook to get and reactively observe the currently logged-in ERP staff user.
 */
export function useCurrentUser(): ErpUser | null {
  const [user, setUser] = useState<ErpUser | null>(() => getCurrentUser());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'donat_erp_logged_user') {
        setUser(getCurrentUser());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return user;
}
