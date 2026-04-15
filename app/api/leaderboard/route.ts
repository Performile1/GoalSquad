/**
 * Public Leaderboard API
 * GET /api/leaderboard?type=sellers&period=month
 * 
 * Public leaderboard showing top sellers and communities
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'sellers'; // 'sellers' or 'communities'
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'all_time'
    const limit = parseInt(searchParams.get('limit') || '50');

    let dateFilter = '';
    const now = new Date();

    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND o.created_at >= '${weekAgo.toISOString()}'`;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND o.created_at >= '${monthAgo.toISOString()}'`;
        break;
      case 'all_time':
      default:
        dateFilter = '';
    }

    if (type === 'sellers') {
      // Seller leaderboard
      const { data, error } = await supabaseAdmin.rpc('get_seller_leaderboard', {
        date_filter: dateFilter,
        result_limit: limit,
      });

      if (error) {
        console.error('Leaderboard query error:', error);
        // Fallback to manual query
        const { data: sellers } = await supabaseAdmin
          .from('seller_profiles')
          .select(`
            user_id,
            total_sales,
            total_orders,
            current_level,
            user:profiles (
              full_name,
              avatar_url
            ),
            community:communities (
              name
            )
          `)
          .order('total_sales', { ascending: false })
          .limit(limit);

        const leaderboard = (sellers || []).map((seller: any, index: number) => ({
          rank: index + 1,
          id: seller.user_id,
          name: seller.user?.full_name || 'Unknown',
          avatarUrl: seller.user?.avatar_url,
          communityName: seller.community?.name || 'No community',
          totalSales: parseFloat(seller.total_sales || 0),
          totalOrders: seller.total_orders || 0,
          level: seller.current_level || 1,
        }));

        return NextResponse.json({ leaderboard });
      }

      const leaderboard = (data || []).map((row: any, index: number) => ({
        rank: index + 1,
        id: row.user_id,
        name: row.full_name,
        avatarUrl: row.avatar_url,
        communityName: row.community_name,
        totalSales: parseFloat(row.total_sales || 0),
        totalOrders: row.total_orders || 0,
        level: row.current_level || 1,
      }));

      return NextResponse.json({ leaderboard });
    } else {
      // Community leaderboard
      const { data: communities, error } = await supabaseAdmin
        .from('communities')
        .select('*')
        .order('total_sales', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Community leaderboard error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch leaderboard' },
          { status: 500 }
        );
      }

      const leaderboard = (communities || []).map((community: any, index: number) => ({
        rank: index + 1,
        id: community.id,
        name: community.name,
        avatarUrl: community.logo_url,
        communityName: `${community.city}, ${community.country}`,
        totalSales: parseFloat(community.total_sales || 0),
        totalOrders: community.total_orders || 0,
        level: 0, // Communities don't have levels
      }));

      return NextResponse.json({ leaderboard });
    }
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
