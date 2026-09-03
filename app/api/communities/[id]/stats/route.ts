/**
 * Community Stats API
 * GET /api/communities/[id]/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Treasury } from '@/lib/treasury';
import { logger } from '@/lib/logger';
import { getAuthUser, getUserRole } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const communityId = params.id;

    const requesterRole = await getUserRole(authUser.id);
    const { data: membership } = await supabaseAdmin
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', authUser.id)
      .maybeSingle();
    const { data: ownedCommunity } = await supabaseAdmin
      .from('communities')
      .select('id')
      .eq('id', communityId)
      .eq('owner_id', authUser.id)
      .maybeSingle();

    if (!membership && !ownedCommunity && !['admin', 'gs_admin'].includes(requesterRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Get total XP from seller_xp table
    const { data: xpData } = await supabaseAdmin
      .from('seller_xp')
      .select('total_xp_earned')
      .eq('seller_profile_id', communityId);

    const totalXP = xpData?.reduce((sum, row) => sum + (row.total_xp_earned || 0), 0) || 0;

    const stats = {
      name: community.name,
      slug: community.slug,
      communityType: community.community_type,
      totalMembers: community.total_members,
      totalSales: parseFloat(community.total_sales),
      totalRevenue: parseFloat(community.total_sales),
      totalCommission: parseFloat(community.total_commission),
      totalXP: totalXP,
      activeCampaigns: campaigns || [],
      topSellers: topSellersList,
      treasuryBalance,
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.apiError('GET', '/api/communities/[id]/stats', error as Error, { communityId: params.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
