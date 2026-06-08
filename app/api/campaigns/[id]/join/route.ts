import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string | null = null;
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = user.id;

    const campaignId = params.id;

    // Resolve seller profile for this user
    const { data: seller } = await supabaseAdmin
      .from('seller_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Upsert campaign_sellers (idempotent)
    const { error } = await supabaseAdmin
      .from('campaign_sellers')
      .upsert({
        campaign_id: campaignId,
        seller_id: seller.id,
        status: 'active',
      }, { onConflict: 'campaign_id, seller_id' });

    if (error) {
      logger.apiError('POST', `/api/campaigns/${params.id}/join`, error, { userId });
      return NextResponse.json({ error: 'Already joined or invalid campaign' }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: 'Du är nu anmäld till kampanjen' });
  } catch (error) {
    logger.apiError('POST', `/api/campaigns/${params.id}/join`, error as Error, { userId: userId ?? 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
