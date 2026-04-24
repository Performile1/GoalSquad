import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: merchant } = await supabase
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
      supabase
        .from('products')
        .select('id, status', { count: 'exact' })
        .eq('merchant_id', merchantId),

      supabase
        .from('orders')
        .select('id, status, total', { count: 'exact' })
        .eq('merchant_id', merchantId),

      supabase
        .from('orders')
        .select('total')
        .eq('merchant_id', merchantId)
        .in('status', ['completed', 'delivered']),

      supabase
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
    console.error('Error fetching merchant stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
