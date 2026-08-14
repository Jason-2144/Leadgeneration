import { createClient } from '@supabase/supabase-js';

// Default Supabase project configuration provided by user
export const DEFAULT_SUPABASE_URL = 'https://ohvybnoyxtwlpdrsrhdy.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable__iaAobYrI4PjhzNqAvZHVQ_4kj6acxh';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCustomSupabaseClient = (url?: string, key?: string) => {
  const finalUrl = url || supabaseUrl;
  const finalKey = key || supabaseAnonKey;
  if (!finalUrl || !finalKey) return null;
  return createClient(finalUrl, finalKey);
};
