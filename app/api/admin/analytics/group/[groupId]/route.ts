import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  const groupId = params.groupId;
  const loggerContext = { route: `/api/admin/analytics/group/${groupId}`, method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userRole = session.user.user_metadata?.role;
    if (userRole !== 'admin') {
      const { data: isLeader } = await supabaseAdmin
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .eq('group_leader_id', session.user.id)
        .single();

      if (!isLeader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: cache } = await supabaseAdmin
      .from('analytics_snapshots')
      .select('*')
      .eq('group_id', groupId)
      .is('member_id', null)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (cache && new Date(cache.calculated_at) > tenMinutesAgo) {
      return NextResponse.json({ success: true, source: 'cache', data: cache });
    }

    const { data: liveData, error: aggError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_items (
          quantity,
          products (price, cost_price, group_payout_amount)
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'paid');

    if (aggError) throw aggError;

    let totalOrdersCount = liveData?.length || 0;
    let totalItemsSold = 0;
    let grossSalesAmount = 0;
    let groupProfitAmount = 0;

    liveData?.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const qty = item.quantity;
        const price = item.products?.price || 0;
        const payout = item.products?.group_payout_amount || 0;

        totalItemsSold += qty;
        grossSalesAmount += (price * qty);
        groupProfitAmount += (payout * qty);
      });
    });

    const newSnapshot = {
      group_id: groupId,
      member_id: null,
      total_orders_count: totalOrdersCount,
      total_items_sold: totalItemsSold,
      gross_sales_amount: grossSalesAmount,
      group_profit_amount: groupProfitAmount,
      calculated_at: new Date().toISOString()
    };

    await supabaseAdmin.from('analytics_snapshots').insert(newSnapshot);

    return NextResponse.json({ success: true, source: 'live', data: newSnapshot });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
