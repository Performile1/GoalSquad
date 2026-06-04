import { getAuthUser } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch discount codes available to the customer
    // This would typically include customer-specific codes and public codes
    const { data: codes, error } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('is_active', true)
      .or(`customer_id.eq.${user.id},customer_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(codes || []);
  } catch (error) {
    logger.apiError('GET', '/api/customer/discount-codes', error as Error, { userId: user?.id });
    return NextResponse.json({ error: 'Failed to fetch discount codes' }, { status: 500 });
  }
}
