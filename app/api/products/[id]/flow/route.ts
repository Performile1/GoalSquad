/**
 * Product Flow API
 * GET /api/products/[id]/flow
 * 
 * Get real-time product flow data
 * NO MOCK DATA - All from actual database records
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_product_flow', {
      p_product_id: params.id,
    });

    if (error) throw error;

    return NextResponse.json(data || {
      product_id: params.id,
      pending_orders: { total_quantity: 0, order_count: 0, by_warehouse: [] },
      in_transit_to_warehouse: [],
      at_warehouses: [],
      allocated_to_customers: { total_quantity: 0, allocation_count: 0, by_warehouse: [] },
    });
  } catch (error) {
    console.error('Product flow API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product flow' },
      { status: 500 }
    );
  }
}
