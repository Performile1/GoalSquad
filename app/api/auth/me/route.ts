import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Unified auth endpoint: returns the current user's profile + entity roles
 * in a single round-trip. Replaces the two-step waterfall:
 *   /api/auth/get-profile + /api/auth/check-entity-role
 *
 * Response shape:
 * {
 *   user:     { id, email, ... }          // Supabase auth user
 *   profile:  { id, role, is_active, ... } // from profiles table
 *   entities: { merchant, seller, warehouse, community } // UUID or null
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate session
    const auth = await requireUser();
    if ('error' in auth) return auth.error;
    const { user } = auth;

    // 2. Fetch profile (service role; session already validated)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileErr && profileErr.code !== 'PGRST116') {
      logger.dbError('SELECT', 'profiles', profileErr, { userId: user.id });
      return NextResponse.json(
        { error: 'Profile lookup failed' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // 3. Check entity associations in parallel
    const [merchant, seller, warehouse, community] = await Promise.all([
      supabaseAdmin.from('merchants').select('id').eq('user_id', user.id).maybeSingle(),
      supabaseAdmin.from('seller_profiles').select('id').eq('user_id', user.id).maybeSingle(),
      supabaseAdmin.from('warehouse_partners').select('id').eq('user_id', user.id).maybeSingle(),
      supabaseAdmin.from('communities').select('id').eq('owner_id', user.id).maybeSingle(),
    ]);

    // 4. Build role from entity data (mirrors auth-context.tsx logic server-side)
    // gs_admin must have highest priority — an admin may also have merchant/seller profiles
    let role = profile.role as string;
    if (profile.role === 'gs_admin' || profile.role === 'admin') {
      role = 'gs_admin';
    } else if (warehouse.data?.id) {
      role = 'warehouse';
    } else if (merchant.data?.id) {
      role = 'merchant';
    } else if (seller.data?.id) {
      role = 'seller';
    } else if (community.data?.id) {
      role = 'community';
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        ...profile,
        role,
      },
      entities: {
        merchant: merchant.data?.id || null,
        seller: seller.data?.id || null,
        warehouse: warehouse.data?.id || null,
        community: community.data?.id || null,
      },
    });
  } catch (error) {
    logger.apiError('GET', '/api/auth/me', error as Error, {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
