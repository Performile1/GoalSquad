import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getUrl = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

// Client-side Supabase client (lazy — skapas vid första anrop)
let _supabase: SupabaseClient | null = null;
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createClient(
        getUrl(),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return (_supabase as any)[prop];
  },
});

// Server-side Supabase client with service role (lazy — skapas vid första anrop)
let _supabaseAdmin: SupabaseClient | null = null;
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(
        getUrl(),
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return (_supabaseAdmin as any)[prop];
  },
});
