import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Return top sellers by total_sales as campaign leaderboard shim
    const { data: sellers, error } = await supabaseAdmin
      .from('seller_profiles')
      .select('user_id, total_sales, total_orders, profiles(full_name, avatar_url)')
      .order('total_sales', { ascending: false })
      .limit(10);

    if (error) throw error;

    const leaderboard = (sellers || []).map((s: any, index: number) => ({
      rank: index + 1,
      name: s.profiles?.full_name || 'Unknown',
      avatarUrl: s.profiles?.avatar_url,
      totalSales: parseFloat(s.total_sales || 0),
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    logger.apiError('GET', `/api/campaigns/${params.id}/leaderboard`, error as Error);
    return NextResponse.json({ leaderboard: [] });
  }
}
