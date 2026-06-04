import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { campaignId, sellerId, sellerName, badgeType } = await request.json();

    if (!campaignId || !sellerId || !badgeType) {
      return NextResponse.json({ success: false, error: 'Saknar obligatoriska parametrar' }, { status: 400 });
    }

    const badgeLock = `BADGE-${campaignId}-${sellerId}-${badgeType}`.toUpperCase();

    const { data: existingBadge } = await supabaseAdmin
      .from('seller_badges')
      .select('id')
      .eq('badge_lock', badgeLock)
      .maybeSingle();

    if (existingBadge) {
      return NextResponse.json({ 
        success: false, 
        error: 'CONFLICT',
        message: 'Denna badge har redan delats ut till säljaren.'
      }, { status: 409 });
    }

    const { data: newBadge, error: insertError } = await supabaseAdmin
      .from('seller_badges')
      .insert({
        campaign_id: campaignId,
        seller_id: sellerId,
        badge_type: badgeType,
        badge_lock: badgeLock
      })
      .select()
      .single();

    if (insertError && insertError.code === '23505') {
      return NextResponse.json({ success: false, error: 'Badge redan registrerad (race condition).' }, { status: 409 });
    } else if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true, badge: newBadge });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 });
    }

    const { data: leaderboard, error } = await supabaseAdmin
      .from('seller_leaderboard_stats')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('total_units_sold', { ascending: false })
      .limit(10);

    if (error) throw error;

    const { data: badges, error: badgeError } = await supabaseAdmin
      .from('seller_badges')
      .select('*')
      .eq('campaign_id', campaignId);

    if (badgeError) throw badgeError;

    return NextResponse.json({ 
      success: true, 
      leaderboard: leaderboard || [], 
      badges: badges || [] 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
