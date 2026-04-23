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
    const sortField = searchParams.get('sortField') || 'created_at';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        customer_name,
        customer_email,
        seller_id,
        sellers!left(full_name),
        community_id,
        communities!left(name),
        merchant_id,
        merchants!left(merchant_name),
        created_at,
        updated_at
      `, { count: 'exact' });

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sortField as any, { ascending: sortDir === 'asc' });

    const { data: orders, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const formattedOrders = (orders || []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      total_amount: o.total_amount || 0,
      status: o.status,
      customer_name: o.customer_name,
      customer_email: o.customer_email,
      seller_id: o.seller_id,
      seller_name: o.sellers?.full_name || null,
      community_id: o.community_id,
      community_name: o.communities?.name || null,
      merchant_id: o.merchant_id,
      merchant_name: o.merchants?.merchant_name || null,
      created_at: o.created_at,
      updated_at: o.updated_at,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Admin orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
