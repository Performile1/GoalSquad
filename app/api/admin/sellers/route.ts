import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortField = searchParams.get('sortField') || 'total_sales';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('seller_profiles')
      .select(`
        id,
        user_id,
        shop_url,
        total_sales,
        total_orders,
        xp_total,
        current_level,
        is_active,
        community_id,
        communities!inner(name),
        profiles!inner(full_name),
        created_at
      `, { count: 'exact' });

    if (search) {
      // full_name lives on profiles; search shop_url on the base table.
      query = query.ilike('shop_url', `%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    query = query.order(sortField as any, { ascending: sortDir === 'asc' });

    const { data: sellers, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const formattedSellers = (sellers || []).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      full_name: s.profiles?.full_name || null,
      shop_url: s.shop_url,
      total_sales: s.total_sales || 0,
      total_orders: s.total_orders || 0,
      xp_total: s.xp_total || 0,
      current_level: s.current_level || 1,
      is_active: s.is_active,
      community_id: s.community_id,
      community_name: s.communities?.name || null,
      created_at: s.created_at,
    }));

    return NextResponse.json({
      sellers: formattedSellers,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    logger.apiError('GET', '/api/admin/sellers', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
