import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from('returns')
      .select('id, return_number, order_id, status, return_type, requested_at, refund_amount, tracking_number, carrier')
      .eq('customer_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ returns: data || [] });
  } catch (error) {
    logger.apiError('GET', '/api/returns', error as Error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}
