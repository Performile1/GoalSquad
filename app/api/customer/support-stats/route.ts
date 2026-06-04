import { getAuthUser } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch or create customer support stats
    const { data: stats, error } = await supabaseAdmin
      .from('customer_support_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!stats) {
      // Create new stats record
      const { data: newStats, error: createError } = await supabaseAdmin
        .from('customer_support_stats')
        .insert({
          user_id: user.id,
          total_spent: 0,
          total_orders: 0,
          supported_sellers: {},
          supported_communities: {},
          xp_given_to_sellers: 0,
          collector_badges: [],
        })
        .select()
        .single();

      if (createError) throw createError;

      return NextResponse.json(newStats);
    }

    return NextResponse.json(stats);
  } catch (error) {
    logger.apiError('GET', '/api/customer/support-stats', error as Error, { userId: user?.id });
    return NextResponse.json({ error: 'Failed to fetch support stats' }, { status: 500 });
  }
}
