import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { validateParams, idParamSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let merchantId = params.id;
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) return paramCheck.error;
    merchantId = paramCheck.data.id;

    // Verify user is the merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('user_id')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant || merchant.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get merchant's products
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products });
  } catch (error) {
    logger.apiError('GET', '/api/merchants/[id]/products', error as Error, { merchantId });
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
