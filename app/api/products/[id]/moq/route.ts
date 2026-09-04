/**
 * Product MOQ Settings API
 * PUT /api/products/[id]/moq
 * 
 * Update MOQ settings for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getAuthUser, getUserRole } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const limit = rateLimit(req, 'product-moq', 20);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const {
      moqEnabled,
      minimumOrderQuantity,
      moqUnit,
      moqDiscountPercentage,
      allowPartialOrders,
      consolidationRequired,
    } = await req.json();

    const { data: product } = await supabaseAdmin.from('products').select('merchant_id').eq('id', params.id).maybeSingle();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const { data: merchant } = await supabaseAdmin.from('merchants').select('user_id').eq('id', product.merchant_id).maybeSingle();
    const role = await getUserRole(user.id);
    if (merchant?.user_id !== user.id && !['gs_admin', 'admin'].includes(role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    logger.apiError('PUT', '/api/products/[id]/moq', error as Error, { productId: params.id });
    return NextResponse.json(
      { error: 'Failed to update MOQ settings' },
      { status: 500 }
    );
  }
}
