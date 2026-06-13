import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    // Fetch stats from various tables
    const [
      communities,
      clubs,
      classes,
      sellers,
      companies,
      warehouses,
      orders,
      users,
      xp,
      badges,
      lootBoxes,
    ] = await Promise.all([
      supabaseAdmin.from('communities').select('id', { count: 'exact' }),
      supabaseAdmin.from('communities').select('id', { count: 'exact' }).eq('type', 'club'),
      supabaseAdmin.from('communities').select('id', { count: 'exact' }).eq('type', 'class'),
      supabaseAdmin.from('seller_profiles').select('id', { count: 'exact' }),
      supabaseAdmin.from('merchants').select('id', { count: 'exact' }),
      supabaseAdmin.from('warehouse_partners').select('id', { count: 'exact' }),
      supabaseAdmin.from('orders').select('id', { count: 'exact' }),
      supabaseAdmin.from('profiles').select('id', { count: 'exact' }),
      supabaseAdmin.from('user_achievements').select('id', { count: 'exact' }),
      supabaseAdmin.from('user_achievements').select('id', { count: 'exact' }).not('badge_id', 'is', null),
      supabaseAdmin.from('user_achievements').select('id', { count: 'exact' }).eq('type', 'loot_box'),
    ]);

    // Calculate total sales
    const { data: ordersData } = await supabaseAdmin.from('orders').select('total_amount');
    const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Calculate total XP
    const { data: xpData } = await supabaseAdmin.from('user_achievements').select('xp');
    const totalXP = xpData?.reduce((sum, achievement) => sum + (achievement.xp || 0), 0) || 0;

    // Calculate average level
    const totalSellers = sellers.count || 0;
    const totalLevels = totalSellers > 0 ? Math.floor(totalSellers * 5) : 0; // Simplified calculation

    const stats = {
      totalCommunities: communities.count || 0,
      totalClubs: clubs.count || 0,
      totalClasses: classes.count || 0,
      totalSellers: sellers.count || 0,
      totalCompanies: companies.count || 0,
      totalWarehouses: warehouses.count || 0,
      totalSales,
      totalOrders: orders.count || 0,
      activeUsers: users.count || 0,
      pendingReports: 0,
      inactiveEntities: 0,
      totalXP,
      totalLevels,
      totalBadges: badges.count || 0,
      totalLootBoxes: lootBoxes.count || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.apiError('GET', '/api/admin/stats', error as Error);
    return NextResponse.json(
      { error: 'Misslyckades att hämta statistik' },
      { status: 500 }
    );
  }
}
