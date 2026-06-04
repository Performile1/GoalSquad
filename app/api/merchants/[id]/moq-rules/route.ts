import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

async function verifyMerchant(merchantId: string, userId: string) {
  const { data } = await supabaseAdmin.from('merchants').select('user_id').eq('id', merchantId).single();
  return data?.user_id === userId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyMerchant(params.id, authUser.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: productRows } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('merchant_id', params.id);

    const productIds = (productRows || []).map(p => p.id);

    if (productIds.length === 0) return NextResponse.json({ rules: [] });

    const { data: rules, error } = await supabaseAdmin
      .from('regional_moq_rules')
      .select(`
        *,
        products(id, name, title, sku),
        warehouse_partners(id, partner_name)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ rules });
  } catch (error) {
    logger.apiError('GET', '/api/merchants/[id]/moq-rules', error as Error, { merchantId: params.id });
    return NextResponse.json({ error: 'Failed to fetch MOQ rules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyMerchant(params.id, authUser.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    const { data: product } = await supabaseAdmin
      .from('products').select('merchant_id').eq('id', body.product_id).single();

    if (!product || product.merchant_id !== params.id) {
      return NextResponse.json({ error: 'Product does not belong to this merchant' }, { status: 400 });
    }

    const { data: rule, error } = await supabaseAdmin
      .from('regional_moq_rules')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    logger.apiError('POST', '/api/merchants/[id]/moq-rules', error as Error, { merchantId: params.id });
    return NextResponse.json({ error: 'Failed to create MOQ rule' }, { status: 500 });
  }
}
