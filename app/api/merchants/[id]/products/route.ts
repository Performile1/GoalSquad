import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { validateParams, idParamSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let merchantId = params.id;
  try {
    const authUser = await getAuthUser(req);

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) return paramCheck.error;
    merchantId = paramCheck.data.id;

    // Check ownership (optional — for public profile viewing)
    let isOwner = false;
    if (authUser) {
      const { data: merchant } = await supabaseAdmin
        .from('merchants')
        .select('user_id')
        .eq('id', merchantId)
        .single();
      isOwner = merchant?.user_id === authUser.id;
    }

    // Public: only active products, limited fields
    // Owner: all products, all fields
    const selectColumns = isOwner
      ? '*'
      : 'id, name, title, description, price, retail_price, image_url, stock_quantity, status, category_id, tags, brand, sku, weight_grams, length_mm, width_mm, height_mm, created_at';

    let query = supabaseAdmin
      .from('products')
      .select(selectColumns)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (!isOwner) {
      query = query.eq('status', 'active');
    }

    const { data: products, error } = await query;

    if (error) throw error;

    return NextResponse.json({ products: products || [], isOwner });
  } catch (error) {
    logger.apiError('GET', '/api/merchants/[id]/products', error as Error, { merchantId });
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
