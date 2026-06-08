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
    const sortField = searchParams.get('sortField') || 'total_revenue';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('merchants')
      .select(`
        id,
        user_id,
        merchant_name,
        slug,
        location,
        is_active,
        is_verified,
        stripe_account_connected,
        created_at,
        products!left(id),
        orders!left(id)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`merchant_name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (status === 'pending') {
      query = query.eq('is_verified', false);
    }

    query = query.order(sortField as any, { ascending: sortDir === 'asc' });

    const { data: merchants, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Get product counts and order counts separately
    const merchantIds = (merchants || []).map((m: any) => m.id);
    const { data: productCounts } = await supabaseAdmin
      .from('products')
      .select('merchant_id, id')
      .in('merchant_id', merchantIds);
    
    const { data: orderCounts } = await supabaseAdmin
      .from('orders')
      .select('merchant_id, id, total_amount')
      .in('merchant_id', merchantIds);

    const formattedMerchants = (merchants || []).map((m: any) => {
      const productCount = (productCounts || []).filter((p: any) => p.merchant_id === m.id).length;
      const merchantOrders = (orderCounts || []).filter((o: any) => o.merchant_id === m.id);
      const orderCount = merchantOrders.length;
      const totalRevenue = merchantOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      return {
        id: m.id,
        user_id: m.user_id,
        merchant_name: m.merchant_name,
        slug: m.slug,
        total_products: productCount,
        total_orders: orderCount,
        total_revenue: totalRevenue,
        is_active: m.is_active,
        stripe_account_connected: m.stripe_account_connected,
        is_verified: m.is_verified,
        location: m.location,
        created_at: m.created_at,
      };
    });

    return NextResponse.json({
      merchants: formattedMerchants,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    logger.apiError('GET', '/api/admin/merchants', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
