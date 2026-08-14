import { createClient } from '@supabase/supabase-js';

// Default to user's Supabase credentials or localStorage fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const getCustomSupabaseClient = (url: string, key: string) => {
  if (!url || !key) return null;
  return createClient(url, key);
};
