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

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabaseAdmin
      .from('asn_notices')
      .select(`
        *,
        warehouse_partners(id, partner_name, city)
      `)
      .eq('merchant_id', params.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: notices, error } = await query;
    if (error) throw error;

    return NextResponse.json({ notices });
  } catch (error) {
    logger.apiError('GET', '/api/merchants/[id]/asn', error as Error, { merchantId: params.id });
    return NextResponse.json({ error: 'Failed to fetch ASN notices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyMerchant(params.id, authUser.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    const asn_number = `ASN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const { data: notice, error } = await supabaseAdmin
      .from('asn_notices')
      .insert({
        ...body,
        merchant_id: params.id,
        asn_number,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    logger.apiError('POST', '/api/merchants/[id]/asn', error as Error, { merchantId: params.id });
    return NextResponse.json({ error: 'Failed to create ASN notice' }, { status: 500 });
  }
}
