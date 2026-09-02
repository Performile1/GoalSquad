import { createServerClient } from '@supabase/ssr';
import type { cookies } from 'next/headers';

/**
 * RLS-safe server-side Supabase client.
 * Uses the anon key + the user's session cookies, so all queries run as the
 * authenticated user and Row Level Security is enforced.
 *
 * Do NOT use the service-role key here. For privileged operations that must
 * bypass RLS, use `supabaseAdmin` from `@/lib/supabase` after a rigorous
 * authorization check (see `requireRole` in `@/lib/api-auth`).
 */
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key';

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // In Route Handlers cookie mutation may throw; ignore safely.
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            /* no-op */
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            /* no-op */
          }
        },
      },
    }
  );
}
