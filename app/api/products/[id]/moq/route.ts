/**
 * Product MOQ Settings API
 * PUT /api/products/[id]/moq
 * 
 * Update MOQ settings for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    const { data, error } = await supabaseAdmin
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
