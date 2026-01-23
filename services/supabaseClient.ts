import { createClient } from '@supabase/supabase-js';

// Vite only exposes env vars prefixed with VITE_
// Set these in .env (local) and in Vercel Environment Variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast in development so you don't spend hours debugging "supabaseKey is required".
  // In production you should still set env vars in Vercel.
  console.warn('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // HashRouter plays nicely if we send users back to /#/
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
