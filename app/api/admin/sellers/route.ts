import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'gs_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortField = searchParams.get('sortField') || 'total_sales';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('sellers')
      .select(`
        id,
        user_id,
        full_name,
        shop_url,
        total_sales,
        total_orders,
        xp_total,
        current_level,
        is_active,
        community_id,
        communities!inner(name),
        created_at
      `, { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,shop_url.ilike.%${search}%`);
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
      full_name: s.full_name,
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
    console.error('Admin sellers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
