import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

async function verifyMerchantOwner(merchantId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('merchants')
    .select('user_id')
    .eq('id', merchantId)
    .single();
  return data?.user_id === userId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await verifyMerchantOwner(params.id, authUser.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', params.productId)
      .eq('merchant_id', params.id)
      .single();

    if (error || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json({ product });
  } catch (error) {
    logger.apiError('GET', '/api/merchants/[id]/products/[productId]', error as Error, { merchantId: params.id, productId: params.productId });
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await verifyMerchantOwner(params.id, authUser.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.productId)
      .eq('merchant_id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product });
  } catch (error) {
    logger.apiError('PATCH', '/api/merchants/[id]/products/[productId]', error as Error, { merchantId: params.id, productId: params.productId });
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await verifyMerchantOwner(params.id, authUser.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', params.productId)
      .eq('merchant_id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('DELETE', '/api/merchants/[id]/products/[productId]', error as Error, { merchantId: params.id, productId: params.productId });
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
