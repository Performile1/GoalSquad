import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Requires live auth cookies — must not be prerendered.
export const dynamic = 'force-dynamic';
import { requireUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // 1. Require an authenticated session.
    const auth = await requireUser();
    if ('error' in auth) return auth.error;
    const { user, supabase } = auth;

    // 2. Resolve target. Default to the caller's own id.
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? user.id;

    // 3. Ownership check — only your own entity roles, unless you are gs_admin.
    if (userId !== user.id) {
      const { data: me } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (me?.role !== 'gs_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 4. Check entity tables (service role; access already authorized above).
    const [merchant, seller, warehouse, community] = await Promise.all([
      supabaseAdmin.from('merchants').select('id').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('seller_profiles').select('id').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('warehouse_partners').select('id').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('communities').select('id').eq('owner_id', userId).maybeSingle(),
    ]);

    const result = {
      merchant: merchant.data?.id || null,
      seller: seller.data?.id || null,
      warehouse: warehouse.data?.id || null,
      community: community.data?.id || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.apiError('GET', '/api/auth/check-entity-role', error as Error, { userId, entityType, entityId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
