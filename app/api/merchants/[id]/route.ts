import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    return NextResponse.json({ merchant });
  } catch (error) {
    logger.apiError('GET', '/api/merchants/[id]', error as Error, { merchantId: params.id });
    return NextResponse.json({ error: 'Failed to fetch merchant' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!merchant || merchant.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { data: updated, error } = await supabaseAdmin
      .from('merchants')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ merchant: updated });
  } catch (error) {
    logger.apiError('PATCH', '/api/merchants/[id]', error as Error, { merchantId: params.id });
    return NextResponse.json({ error: 'Failed to update merchant' }, { status: 500 });
  }
}
