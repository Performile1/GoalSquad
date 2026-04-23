/**
 * Product Flow Summary API
 * GET /api/products/[id]/flow-summary
 * 
 * Get compact flow summary for product cards
 * Real data only
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_flow_summary')
      .select('*')
      .eq('product_id', params.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json(data || {
      product_id: params.id,
      pending_order_quantity: 0,
      in_transit_quantity: 0,
      warehouse_available: 0,
      warehouse_allocated: 0,
      allocated_to_customers: 0,
    });
  } catch (error) {
    console.error('Flow summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow summary' },
      { status: 500 }
    );
  }
}
