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

    const { data: rules, error } = await supabase
      .from('regional_moq_rules')
      .select(`
        *,
        products(id, name, title, sku),
        warehouse_partners(id, partner_name)
      `)
      .in('product_id',
        supabase.from('products').select('id').eq('merchant_id', params.id)
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching MOQ rules:', error);
    return NextResponse.json({ error: 'Failed to fetch MOQ rules' }, { status: 500 });
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

    const { data: rule, error } = await supabase
      .from('regional_moq_rules')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating MOQ rule:', error);
    return NextResponse.json({ error: 'Failed to create MOQ rule' }, { status: 500 });
  }
}
