/**
 * Warehouse Flow API
 * GET /api/warehouses/[id]/flow
 * 
 * Get real-time warehouse flow data
 * Shows incoming, current inventory, and outgoing
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser, userHasRole } from '@/lib/api-auth';
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

    // Verify the warehouse exists. `warehouse_partners` is the canonical
    // warehouse table (owner-based via user_id).
    const { data: warehouse } = await supabaseAdmin
      .from('warehouse_partners')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Access: the warehouse owner or a platform admin.
    const isOwner = warehouse.user_id === user.id;
    const isAdmin = await userHasRole(user.id, 'gs_admin');
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const emptyFlow = {
      warehouse_id: params.id,
      incoming_shipments: { shipment_count: 0, total_items: 0, by_status: {} },
      current_inventory: { product_count: 0, total_available: 0, total_allocated: 0, by_merchant: [] },
      pending_customer_orders: { order_count: 0, total_quantity: 0, by_status: {} },
    };

    const { data, error } = await supabaseAdmin.rpc('get_warehouse_flow', {
      p_warehouse_id: params.id,
    });

    // The RPC may not be deployed in every environment; degrade gracefully
    // to an empty flow rather than failing the whole request.
    if (error) {
      logger.apiError('GET', '/api/warehouses/[id]/flow', error as Error, {
        warehouseId: params.id,
        note: 'get_warehouse_flow RPC unavailable',
      });
      return NextResponse.json(emptyFlow);
    }

    return NextResponse.json(data || emptyFlow);
  } catch (error) {
    logger.apiError('GET', '/api/warehouses/[id]/flow', error as Error, { warehouseId: params.id });
    return NextResponse.json(
      { error: 'Failed to fetch warehouse flow' },
      { status: 500 }
    );
  }
}
