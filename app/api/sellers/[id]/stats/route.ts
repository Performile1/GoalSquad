/**
 * Seller Stats API
 * GET /api/sellers/[id]/stats
 * 
 * Returns complete seller statistics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { GamificationEngine } from '@/lib/gamification-engine';
import { Treasury } from '@/lib/treasury';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;

    // Get seller profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', sellerId)
      .eq('role', 'seller')
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Get seller gamification profile
    const { data: sellerProfile, error: sellerError } = await supabaseAdmin
      .from('seller_profiles')
      .select('*')
      .eq('user_id', sellerId)
      .single();

    if (sellerError || !sellerProfile) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // Get achievements
    const { data: achievements } = await supabaseAdmin
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements (
          id,
          name,
          description,
          icon_url,
          rarity
        )
      `)
      .eq('user_id', sellerId);

    const achievementsList = achievements?.map(ua => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      iconUrl: ua.achievement.icon_url,
      rarity: ua.achievement.rarity,
      unlockedAt: ua.unlocked_at,
    })) || [];

    // Get rank in community
    const rank = await GamificationEngine.getUserRank(
      sellerId,
      sellerProfile.community_id,
      'all_time'
    );

    // Get treasury balance
    const treasuryBalance = await Treasury.getTreasuryBalance('seller', sellerId);

    // Compile stats
    const stats = {
      fullName: profile.full_name,
      shopUrl: sellerProfile.shop_url,
      xpTotal: sellerProfile.xp_total,
      currentLevel: sellerProfile.current_level,
      streakDays: sellerProfile.streak_days,
      totalSales: parseFloat(sellerProfile.total_sales),
      totalOrders: sellerProfile.total_orders,
      totalCommission: parseFloat(sellerProfile.total_commission),
      rank,
      achievements: achievementsList,
      avatarData: sellerProfile.avatar_data,
      treasuryBalance,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch seller stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
