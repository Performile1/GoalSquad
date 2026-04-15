/**
 * Community Stats API
 * GET /api/communities/[id]/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Treasury } from '@/lib/treasury';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // Get community
    const { data: community, error: communityError } = await supabaseAdmin
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Get active campaigns
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('community_id', communityId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Get top sellers
    const { data: topSellers } = await supabaseAdmin
      .from('seller_profiles')
      .select(`
        user_id,
        total_sales,
        total_orders,
        user:profiles (
          full_name
        )
      `)
      .eq('community_id', communityId)
      .order('total_sales', { ascending: false })
      .limit(5);

    const topSellersList = topSellers?.map((seller: any) => ({
      id: seller.user_id,
      fullName: seller.user?.full_name || 'Unknown',
      totalSales: parseFloat(seller.total_sales),
      totalOrders: seller.total_orders,
    })) || [];

    // Get treasury balance
    const treasuryBalance = await Treasury.getTreasuryBalance('community', communityId);

    const stats = {
      name: community.name,
      slug: community.slug,
      communityType: community.community_type,
      totalMembers: community.total_members,
      totalSales: parseFloat(community.total_sales),
      totalCommission: parseFloat(community.total_commission),
      activeCampaigns: campaigns || [],
      topSellers: topSellersList,
      treasuryBalance,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch community stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
