/**
 * Split Shipment API
 * POST /api/orders/[id]/split-shipment
 * 
 * Create split shipments for order with MOQ blocking
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getAuthUser, getUserRole } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const limit = rateLimit(req, 'split-shipment', 10);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = await getUserRole(user.id);
    const { data: order } = await supabaseAdmin.from('orders').select('user_id').eq('id', params.id).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.user_id !== user.id && !['gs_admin', 'admin'].includes(role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.rpc('create_split_shipments', {
      p_order_id: params.id,
      p_strategy: 'split_shipment',
    });

    if (error) throw error;

    if (!data.success) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.apiError('POST', '/api/orders/[id]/split-shipment', error as Error, { orderId: params.id });
    return NextResponse.json(
      { error: 'Failed to create split shipment' },
      { status: 500 }
    );
  }
}
