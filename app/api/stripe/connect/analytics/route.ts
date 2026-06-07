import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Requires live auth cookies — must not be prerendered.
export const dynamic = 'force-dynamic';
import { getAuthUser } from '@/lib/api-auth';
import { getProfile } from '@/lib/profile-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera att användaren har rätt roll (community eller seller)
    const profile = await getProfile(user.id, 'role');

    if (!profile || (profile.role !== 'community' && profile.role !== 'seller')) {
      return NextResponse.json({ error: 'Only communities and sellers can view payout analytics' }, { status: 403 });
    }

    // Hämta analytics från vyn
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('payout_analytics_rollup')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (analyticsError) {
      logger.dbError('SELECT', 'payout_analytics_rollup', analyticsError, { userId: user.id });
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Hämta även recent payouts för historik
    const { data: recentPayouts, error: payoutsError } = await supabaseAdmin
      .from('stripe_payouts')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (payoutsError) {
      logger.dbError('SELECT', 'stripe_payouts', payoutsError, { userId: user.id });
      // Fortsätt ändå, detta är inte kritiskt
    }

    return NextResponse.json({
      analytics: analytics || {
        available_balance: 0,
        processing_balance: 0,
        total_paid_out: 0,
        payout_count: 0,
      },
      recentPayouts: recentPayouts || [],
    });
  } catch (error: any) {
    logger.apiError('GET', '/api/stripe/connect/analytics', error, { userId: user?.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
