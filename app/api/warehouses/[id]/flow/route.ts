/**
 * Warehouse Flow API
 * GET /api/warehouses/[id]/flow
 * 
 * Get real-time warehouse flow data
 * Shows incoming, current inventory, and outgoing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase.rpc('get_warehouse_flow', {
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
    console.error('Warehouse flow API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse flow' },
      { status: 500 }
    );
  }
}
