/**
 * Product MOQ Settings API
 * PUT /api/products/[id]/moq
 * 
 * Update MOQ settings for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      moqEnabled,
      minimumOrderQuantity,
      moqUnit,
      moqDiscountPercentage,
      allowPartialOrders,
      consolidationRequired,
    } = await req.json();

    // TODO: Add permission check (merchant owns product)

    const { data, error } = await supabase
      .from('products')
      .update({
        moq_enabled: moqEnabled,
        minimum_order_quantity: minimumOrderQuantity,
        moq_unit: moqUnit,
        moq_discount_percentage: moqDiscountPercentage,
        allow_partial_orders: allowPartialOrders,
        consolidation_required: consolidationRequired,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Update MOQ error:', error);
    return NextResponse.json(
      { error: 'Failed to update MOQ settings' },
      { status: 500 }
    );
  }
}
