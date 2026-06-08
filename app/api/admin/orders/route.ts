import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { validateQuery } from '@/lib/validation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  status: z.string().optional(),
  sortField: z.string().default('created_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const qCheck = validateQuery(searchParams, querySchema);
    if ('error' in qCheck) return qCheck.error;
    const { page, pageSize, search, status, sortField, sortDir } = qCheck.data;
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
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
    logger.apiError('GET', '/api/admin/orders', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
