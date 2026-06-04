import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adId = params.id;

    const auth = await requireRole('gs_admin');
    if ('error' in auth) return auth.error;
    const { user } = auth;

    // Update ad status to approved
    const { data, error } = await supabaseAdmin
      .from('ads')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ad: data });
  } catch (error) {
    logger.apiError('POST', '/api/admin/ads/[id]/approve', error as Error, { adId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
