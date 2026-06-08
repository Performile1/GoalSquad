import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { validateParams, idParamSchema, validateQuery } from '@/lib/validation';
import { z } from 'zod';

const querySchema = z.object({
  status: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) return paramCheck.error;
    const warehouseId = paramCheck.data.id;

    const { data: warehouse } = await supabaseAdmin
      .from('warehouse_partners')
      .select('user_id')
      .eq('id', warehouseId)
      .single();

    if (!warehouse || warehouse.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const qCheck = validateQuery(url.searchParams, querySchema);
    if ('error' in qCheck) return qCheck.error;
    const { status, limit, offset } = qCheck.data;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id, status, total_amount,
        created_at, updated_at,
        shipping_name, shipping_city, shipping_postal_code,
        order_items(id, product_id, quantity, unit_price)
      `, { count: 'exact' })
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data: orders, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ orders, total: count });
  } catch (error) {
    logger.apiError('GET', '/api/warehouses/[id]/orders', error as Error, { warehouseId });
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
