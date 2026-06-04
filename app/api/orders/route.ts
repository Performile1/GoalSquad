/**
 * GET /api/orders - List authenticated user's orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        total,
        currency,
        created_at,
        shipping_address,
        order_items (
          id,
          quantity,
          unit_price,
          product_id
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      logger.dbError('SELECT', 'orders', error, { userId: user.id });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const mapped = (orders ?? []).map((o: any) => ({
      ...o,
      total_amount: parseFloat(o.total_amount ?? o.total ?? '0'),
      items_count: o.order_items?.length ?? 0,
    }));

    return NextResponse.json({ orders: mapped });
  } catch (error) {
    logger.apiError('GET', '/api/orders', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
