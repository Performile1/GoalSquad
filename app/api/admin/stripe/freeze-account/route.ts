import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getProfile } from '@/lib/profile-helpers';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Endast admin kan frysa konton
    const profile = await getProfile(user.id, 'role');
    if (!profile || profile.role !== 'gs_admin') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const body = await request.json();
    const { profileId, freeze, reason } = body;

    if (!profileId || typeof freeze !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields: profileId, freeze' }, { status: 400 });
    }

    if (freeze && !reason) {
      return NextResponse.json({ error: 'Reason is required when freezing an account' }, { status: 400 });
    }

    // Använd RPC-funktion för att toggla freeze
    const { error: toggleError } = await supabaseAdmin.rpc('toggle_account_freeze', {
      p_profile_id: profileId,
      p_freeze: freeze,
      p_reason: reason,
    });

    if (toggleError) {
      logger.dbError('RPC', 'toggle_account_freeze', toggleError, { profileId, freeze });
      return NextResponse.json({ error: 'Failed to update account freeze status' }, { status: 500 });
    }

    logger.info('Account freeze status updated', { 
      adminId: user.id, 
      targetProfileId: profileId, 
      freeze, 
      reason 
    });

    return NextResponse.json({
      success: true,
      frozen: freeze,
      reason: freeze ? reason : null,
    });
  } catch (error: any) {
    logger.apiError('POST', '/api/admin/stripe/freeze-account', error, { userId: user?.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
