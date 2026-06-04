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
    const sortField = searchParams.get('sortField') || 'created_at';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('returns')
      .select(`
        id,
        return_number,
        status,
        customer_name,
        customer_email,
        order_id,
        orders!left(order_number),
        reason,
        refund_amount,
        warehouse_id,
        warehouses!left(name),
        created_at,
        updated_at
      `, { count: 'exact' });

    if (search) {
      query = query.or(`return_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sortField as any, { ascending: sortDir === 'asc' });

    const { data: returns, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const formattedReturns = (returns || []).map((r: any) => ({
      id: r.id,
      return_number: r.return_number,
      status: r.status,
      customer_name: r.customer_name,
      customer_email: r.customer_email,
      order_id: r.order_id,
      order_number: r.orders?.order_number || null,
      reason: r.reason,
      refund_amount: r.refund_amount,
      warehouse_id: r.warehouse_id,
      warehouse_name: r.warehouses?.name || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({
      returns: formattedReturns,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    logger.apiError('GET', '/api/admin/returns', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
