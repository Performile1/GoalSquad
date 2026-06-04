import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!merchant || merchant.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const merchantId = params.id;

    // Run all stat queries in parallel
    const [productsRes, ordersRes, revenueRes, pendingRes] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id, status', { count: 'exact' })
        .eq('merchant_id', merchantId),

      supabaseAdmin
        .from('orders')
        .select('id, status, total', { count: 'exact' })
        .eq('merchant_id', merchantId),

      supabaseAdmin
        .from('orders')
        .select('total')
        .eq('merchant_id', merchantId)
        .in('status', ['completed', 'delivered']),

      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .in('status', ['pending', 'processing']),
    ]);

    const totalProducts = productsRes.count ?? 0;
    const activeProducts = (productsRes.data ?? []).filter(p => p.status === 'active').length;
    const totalOrders = ordersRes.count ?? 0;
    const pendingOrders = pendingRes.count ?? 0;
    const totalRevenue = (revenueRes.data ?? []).reduce((sum, o) => sum + (o.total || 0), 0);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
    });
  } catch (error) {
    logger.apiError('GET', '/api/merchants/[id]/stats', error as Error, { merchantId: params.id });
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
