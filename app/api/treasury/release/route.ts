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

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify gs_admin role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

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
    console.error('Treasury release error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
