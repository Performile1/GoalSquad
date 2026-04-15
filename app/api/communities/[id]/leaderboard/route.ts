/**
 * Community Leaderboard API
 * GET /api/communities/[id]/leaderboard?period=all_time
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all_time';

    // Get leaderboard from cache
    const { data: leaderboard } = await supabaseAdmin
      .from('leaderboards')
      .select('rankings')
      .eq('leaderboard_type', 'community')
      .eq('scope_id', communityId)
      .eq('period', period)
      .single();

    if (leaderboard && leaderboard.rankings) {
      // Enrich with user data
      const rankings = leaderboard.rankings as any[];
      const userIds = rankings.map(r => r.userId);

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const enrichedRankings = rankings.map((ranking: any) => {
        const profile = profiles?.find((p: any) => p.id === ranking.userId);
        return {
          ...ranking,
          fullName: profile?.full_name || 'Unknown',
          avatarUrl: profile?.avatar_url,
        };
      });

      return NextResponse.json({ rankings: enrichedRankings });
    }

    // If no cached leaderboard, generate it
    const { data: sellers } = await supabaseAdmin
      .from('seller_profiles')
      .select(`
        user_id,
        total_sales,
        total_orders,
        current_level,
        xp_total,
        user:profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .order('total_sales', { ascending: false })
      .limit(100);

    const rankings = sellers?.map((seller: any, index: number) => ({
      rank: index + 1,
      userId: seller.user_id,
      fullName: seller.user?.full_name || 'Unknown',
      avatarUrl: seller.user?.avatar_url,
      totalSales: parseFloat(seller.total_sales),
      totalOrders: seller.total_orders,
      level: seller.current_level,
      xp: seller.xp_total,
    })) || [];

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
