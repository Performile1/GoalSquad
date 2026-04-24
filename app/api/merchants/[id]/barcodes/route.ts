import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyMerchant(merchantId: string, userId: string) {
  const { data } = await supabase.from('merchants').select('user_id').eq('id', merchantId).single();
  return data?.user_id === userId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyMerchant(params.id, authUser.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: productRows } = await supabase
      .from('products')
      .select('id')
      .eq('merchant_id', params.id);

    const productIds = (productRows || []).map(p => p.id);

    if (productIds.length === 0) return NextResponse.json({ barcodes: [] });

    const { data: barcodes, error } = await supabase
      .from('product_barcodes')
      .select(`
        *,
        products(id, name, title, sku)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ barcodes });
  } catch (error) {
    console.error('Error fetching barcodes:', error);
    return NextResponse.json({ error: 'Failed to fetch barcodes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyMerchant(params.id, authUser.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    const { data: product } = await supabase
      .from('products').select('merchant_id').eq('id', body.product_id).single();

    if (!product || product.merchant_id !== params.id) {
      return NextResponse.json({ error: 'Product does not belong to this merchant' }, { status: 400 });
    }

    const { data: barcode, error } = await supabase
      .from('product_barcodes')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ barcode }, { status: 201 });
  } catch (error) {
    console.error('Error creating barcode:', error);
    return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 });
  }
}
