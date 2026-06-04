/**
 * Warehouse Flow API
 * GET /api/warehouses/[id]/flow
 * 
 * Get real-time warehouse flow data
 * Shows incoming, current inventory, and outgoing
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this warehouse
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select('id, community_id')
      .eq('id', params.id)
      .single();

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Check if user is warehouse staff, community member, or merchant with assignment
    const { data: access } = await supabaseAdmin
      .from('warehouse_assignments')
      .select('id')
      .eq('warehouse_id', params.id)
      .eq('merchant_id', user.id)
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, entity_id')
      .eq('id', user.id)
      .single();

    const hasAccess = access || 
                     (profile?.role === 'community' && profile?.entity_id === warehouse.community_id) ||
                     profile?.role === 'gs_admin';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.rpc('get_warehouse_flow', {
      p_warehouse_id: params.id,
    });

    if (error) throw error;

    return NextResponse.json(data || {
      warehouse_id: params.id,
      incoming_shipments: { shipment_count: 0, total_items: 0, by_status: {} },
      current_inventory: { product_count: 0, total_available: 0, total_allocated: 0, by_merchant: [] },
      pending_customer_orders: { order_count: 0, total_quantity: 0, by_status: {} },
    });
  } catch (error) {
    logger.apiError('GET', '/api/warehouses/[id]/flow', error as Error, { warehouseId: params.id });
    return NextResponse.json(
      { error: 'Failed to fetch warehouse flow' },
      { status: 500 }
    );
  }
}
