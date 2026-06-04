import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: warehouse } = await supabaseAdmin
      .from('warehouse_partners')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!warehouse || warehouse.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const warehouseId = params.id;

    const [inboundRes, outboundRes, pendingRes, returnsRes] = await Promise.all([
      supabase
        .from('warehouse_events')
        .select('id', { count: 'exact' })
        .eq('warehouse_id', warehouseId)
        .eq('event_type', 'inbound'),

      supabase
        .from('warehouse_events')
        .select('id', { count: 'exact' })
        .eq('warehouse_id', warehouseId)
        .eq('event_type', 'outbound'),

      supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('warehouse_id', warehouseId)
        .in('status', ['pending', 'processing']),

      supabase
        .from('returns')
        .select('id', { count: 'exact' })
        .eq('warehouse_id', warehouseId)
        .eq('status', 'pending'),
    ]);

    return NextResponse.json({
      totalInbound: inboundRes.count ?? 0,
      totalOutbound: outboundRes.count ?? 0,
      pendingOrders: pendingRes.count ?? 0,
      pendingReturns: returnsRes.count ?? 0,
    });
  } catch (error) {
    logger.apiError('GET', '/api/warehouses/[id]/stats', error as Error, { warehouseId: params.id });
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
