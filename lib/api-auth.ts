/**
 * Shared API authentication helper.
 * Extracts the Bearer JWT from the Authorization header and verifies it
 * against Supabase Auth using the service-role client.
 *
 * Usage:
 *   const user = await getAuthUser(req);
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';
import { createClient } from './supabase/server';

export async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Canonical role lookup. `profiles.role` is the single source of truth.
 * Use this instead of reading `user_metadata.role` / `detailed_role`,
 * which is a legacy parallel system that does not stay in sync.
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data.role;
}

/** Returns true if the user's `profiles.role` is one of the allowed roles. */
export async function userHasRole(
  userId: string,
  allowed: AppRole | AppRole[]
): Promise<boolean> {
  const role = await getUserRole(userId);
  if (!role) return false;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(role as AppRole);
}

/** Application roles stored in `profiles.role`. */
export type AppRole =
  | 'gs_admin'
  | 'merchant'
  | 'seller'
  | 'community'
  | 'warehouse'
  | 'user';

export interface AuthProfile {
  id: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

/**
 * Central authorization gatekeeper.
 *
 * 1. Validates the auth session (cookie-based, RLS-safe client).
 * 2. Looks up the application role in `profiles`.
 * 3. Returns either a ready-to-return NextResponse error (401/403),
 *    or the authenticated `{ user, profile }`.
 *
 * Usage:
 *   const auth = await requireRole('gs_admin');
 *   if ('error' in auth) return auth.error;
 *   const { user, profile } = auth;
 */
export async function requireRole(allowedRoles: AppRole | AppRole[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1. Validate the auth session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Missing or invalid session' },
        { status: 401 }
      ),
    };
  }

  // 2. Resolve the application role from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_active, is_verified')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Profile not found' },
        { status: 403 }
      ),
    };
  }

  if (!profile.is_active) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Account is deactivated' },
        { status: 403 }
      ),
    };
  }

  // 3. Check permissions
  const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!rolesToCheck.includes(profile.role as AppRole)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  // 4. Authorized
  return { user, profile: profile as AuthProfile };
}

/** Convenience wrapper for the most common case: gs_admin only. */
export async function requireAdmin() {
  return requireRole('gs_admin');
}

/**
 * Lightweight session gate — validates the cookie-based auth session WITHOUT
 * requiring a specific application role. Returns the authenticated `user` plus
 * the RLS-safe `supabase` client (handy for follow-up ownership/admin checks),
 * or a ready-to-return 401 NextResponse.
 *
 * Usage:
 *   const auth = await requireUser();
 *   if ('error' in auth) return auth.error;
 *   const { user, supabase } = auth;
 */
export async function requireUser(req?: NextRequest) {
  const cookieStore = cookies();
  const authHeader = req?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized: Missing or invalid session' },
          { status: 401 }
        ),
      };
    }
    return { user, supabase: createClient(cookieStore) };
  }

  const supabase = createClient(cookieStore);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Missing or invalid session' },
        { status: 401 }
      ),
    };
  }

  return { user, supabase };
}
