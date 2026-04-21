import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';

    // Build query based on filter
    let query = supabase
      .from('ads')
      .select(`
        *,
        ad_placements (
          name,
          page,
          position
        ),
        profiles (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: ads, error } = await query;

    if (error) throw error;

    // Format ads
    const formattedAds = ads.map((ad: any) => ({
      ...ad,
      placement_name: ad.ad_placements?.name,
      placement_page: ad.ad_placements?.page,
      placement_position: ad.ad_placements?.position,
      advertiser_name: ad.profiles?.full_name,
      advertiser_email: ad.profiles?.email,
    }));

    // Get stats
    const { data: statsData } = await supabase
      .from('ads')
      .select('status');

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter((a: any) => a.status === 'pending').length || 0,
      approved: statsData?.filter((a: any) => a.status === 'approved').length || 0,
      active: statsData?.filter((a: any) => a.status === 'active').length || 0,
      rejected: statsData?.filter((a: any) => a.status === 'rejected').length || 0,
      completed: statsData?.filter((a: any) => a.status === 'completed').length || 0,
    };

    // Get total views/clicks for active/completed ads
    const adIds = formattedAds
      .filter((ad: any) => ad.status === 'active' || ad.status === 'completed')
      .map((ad: any) => ad.id);

    let statsMap: Record<string, { views: number; clicks: number }> = {};
    
    if (adIds.length > 0) {
      const { data: adStats } = await supabase
        .from('ad_stats')
        .select('ad_id, views, clicks')
        .in('ad_id', adIds);

      if (adStats) {
        statsMap = adStats.reduce((acc: any, stat: any) => {
          if (!acc[stat.ad_id]) {
            acc[stat.ad_id] = { views: 0, clicks: 0 };
          }
          acc[stat.ad_id].views += stat.views;
          acc[stat.ad_id].clicks += stat.clicks;
          return acc;
        }, {});
      }
    }

    // Add stats to formatted ads
    const finalAds = formattedAds.map((ad: any) => {
      const adStats = statsMap[ad.id] || { views: 0, clicks: 0 };
      return {
        ...ad,
        total_views: adStats.views,
        total_clicks: adStats.clicks,
      };
    });

    return NextResponse.json({ ads: finalAds, stats });
  } catch (error: any) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
