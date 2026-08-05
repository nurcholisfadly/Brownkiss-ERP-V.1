import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks provided by user so that the preview connects instantly
const DEFAULT_URL = 'https://ejndpbddmdesfxipvdzk.supabase.co';
const DEFAULT_KEY = 'sb_secret_ljwk1vxCbnVXYxtvBkuZBQ_G2kY3c0d';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
