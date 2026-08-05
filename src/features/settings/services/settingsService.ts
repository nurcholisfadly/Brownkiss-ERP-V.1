import { supabase } from '../../../lib/supabase';
import { ErpUser, ErpSettings, SecurityLog } from '../../../types';

export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  if (/^[a-f0-9]{64}$/i.test(password)) {
    return password;
  }
  const salted = password + '_brownkiss_salt_2026';
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(salted);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto error, using fallback hash:', e);
  }
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'shafallback_' + Math.abs(hash).toString(16).padStart(16, '0');
}

export async function verifyPassword(inputPassword: string, storedHashOrPlaintext?: string): Promise<boolean> {
  if (!inputPassword || !storedHashOrPlaintext) return false;
  if (inputPassword === storedHashOrPlaintext) {
    return true;
  }
  const hashedInput = await hashPassword(inputPassword);
  return hashedInput === storedHashOrPlaintext;
}

export async function getErpUsersFromCloud(): Promise<ErpUser[]> {
  const { data, error } = await supabase
    .from('erp_users')
    .select('id, name, email, role, status, password')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    role: d.role,
    status: d.status,
    password: d.password,
  }));
}

export async function saveErpUserToCloud(user: ErpUser): Promise<void> {
  const hashedPassword = await hashPassword(user.password || '123456');
  const { error } = await supabase.from('erp_users').upsert({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    password: hashedPassword,
  });
  if (error) throw error;
}

export async function deleteErpUserFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('erp_users').delete().eq('id', id);
  if (error) throw error;
}

export async function getErpSettingsFromCloud(): Promise<ErpSettings | null> {
  const { data, error } = await supabase
    .from('erp_settings')
    .select('*')
    .eq('key', 'general')
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) return null;
  try {
    return JSON.parse(data.value);
  } catch (err) {
    console.error('Failed to parse general settings JSON', err);
    return null;
  }
}

export async function saveErpSettingsToCloud(settings: ErpSettings): Promise<void> {
  const { error } = await supabase
    .from('erp_settings')
    .upsert({
      key: 'general',
      value: JSON.stringify(settings),
    });
  if (error) throw error;
}

export async function getSecurityLogsFromCloud(): Promise<SecurityLog[]> {
  const { data, error } = await supabase
    .from('security_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    timestamp: d.timestamp,
    event: d.event,
    level: d.level,
    userName: d.user_name || d.userName || undefined,
    userRole: d.user_role || d.userRole || undefined,
    date: d.date || undefined,
    time: d.time || undefined,
    beforeValue: d.before_value || d.beforeValue || undefined,
    afterValue: d.after_value || d.afterValue || undefined,
    category: d.category || undefined,
  }));
}

export async function saveSecurityLogToCloud(log: SecurityLog): Promise<void> {
  const payload: any = {
    id: log.id,
    timestamp: log.timestamp,
    event: log.event,
    level: log.level,
  };
  if (log.userName) payload.user_name = log.userName;
  if (log.userRole) payload.user_role = log.userRole;
  if (log.date) payload.date = log.date;
  if (log.time) payload.time = log.time;
  if (log.beforeValue) payload.before_value = log.beforeValue;
  if (log.afterValue) payload.after_value = log.afterValue;
  if (log.category) payload.category = log.category;

  const { error } = await supabase.from('security_logs').upsert(payload);

  if (error) {
    const basicPayload = {
      id: log.id,
      timestamp: log.timestamp,
      event: log.event,
      level: log.level,
    };
    const { error: fErr } = await supabase.from('security_logs').upsert(basicPayload);
    if (fErr) throw fErr;
  }
}
