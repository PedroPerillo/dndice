import { createClient } from '@supabase/supabase-js';

// These will be set via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials not found. Auth features will be disabled. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create a mock client if not configured to prevent errors
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    };

