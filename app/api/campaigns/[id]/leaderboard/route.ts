import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;

    const { data: rows, error } = await supabaseAdmin
      .from('campaign_sellers')
      .select(`
        campaign_sales,
        campaign_orders,
        seller_profiles:seller_id (
          id,
          profiles:user_id (full_name, avatar_url)
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('campaign_sales', { ascending: false })
      .limit(10);

    if (error) throw error;

    const leaderboard = (rows || []).map((row: any, index: number) => ({
      rank: index + 1,
      name: row.seller_profiles?.profiles?.full_name || 'Unknown',
      avatarUrl: row.seller_profiles?.profiles?.avatar_url,
      totalSales: parseFloat(row.campaign_sales || 0),
      orders: row.campaign_orders || 0,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    logger.apiError('GET', `/api/campaigns/${params.id}/leaderboard`, error as Error);
    return NextResponse.json({ leaderboard: [] });
  }
}
