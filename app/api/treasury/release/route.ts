/**
 * POST /api/treasury/release
 *
 * Admin-only route to release expired treasury holds.
 * Can be called by cron job or admin dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { Treasury } from '@/lib/treasury';
import { getProfile } from '@/lib/profile-helpers';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getAuthUser>> = null;
  try {
    user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify gs_admin role
    const profile = await getProfile(user.id, 'role');

    if (!profile || profile.role !== 'gs_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const releasedCount = await Treasury.releaseExpiredHolds();

    return NextResponse.json({
      success: true,
      releasedCount,
      message: `Released ${releasedCount} expired holds`,
    });
  } catch (error) {
    logger.paymentError('treasury_release', 'admin', error as Error, { userId: user?.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
