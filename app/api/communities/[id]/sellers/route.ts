import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { data: sellers, error } = await supabaseAdmin
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
        created_at
      `)
      .eq('community_id', id)
      .order('total_sales', { ascending: false });

    if (error) throw error;

    const formattedSellers = (sellers || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      fullName: s.full_name,
      shopUrl: s.shop_url,
      totalSales: s.total_sales || 0,
      totalOrders: s.total_orders || 0,
      xpTotal: s.xp_total || 0,
      currentLevel: s.current_level || 1,
      isActive: s.is_active,
      joinedAt: s.created_at,
    }));

    return NextResponse.json({ sellers: formattedSellers });
  } catch (error) {
    logger.apiError('GET', '/api/communities/[id]/sellers', error as Error, { communityId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
