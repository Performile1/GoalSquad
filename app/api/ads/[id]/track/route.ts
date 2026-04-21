import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const adId = params.id;
    const { type } = await request.json();

    if (type !== 'view' && type !== 'click') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Check daily limits first
    await supabase.rpc('reset_daily_ad_views');
    await supabase.rpc('check_daily_ad_limits');
    await supabase.rpc('check_total_ad_limits');

    // Get current ad status
    const { data: ad } = await supabase
      .from('ads')
      .select('status, is_daily_limit_reached, daily_view_limit, daily_views_today')
      .eq('id', adId)
      .single();

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    // Don't track if ad is not active or daily limit reached
    if (ad.status !== 'active' || ad.is_daily_limit_reached) {
      return NextResponse.json({ success: true, skipped: true, reason: ad.status !== 'active' ? 'ad_inactive' : 'daily_limit_reached' });
    }

    // Check if daily limit would be exceeded
    if (type === 'view' && ad.daily_views_today >= ad.daily_view_limit) {
      await supabase
        .from('ads')
        .update({ is_daily_limit_reached: true, status: 'paused' })
        .eq('id', adId);
      return NextResponse.json({ success: true, skipped: true, reason: 'daily_limit_reached' });
    }

    // Call the appropriate tracking function
    if (type === 'view') {
      const { error } = await supabase.rpc('record_ad_view', { p_ad_id: adId });
      if (error) throw error;
    } else if (type === 'click') {
      const { error } = await supabase.rpc('record_ad_click', { p_ad_id: adId });
      if (error) throw error;
    }

    // Check if daily limit was just reached
    if (type === 'view') {
      const { data: updatedAd } = await supabase
        .from('ads')
        .select('daily_views_today, daily_view_limit')
        .eq('id', adId)
        .single();

      if (updatedAd && updatedAd.daily_views_today >= updatedAd.daily_view_limit) {
        await supabase
          .from('ads')
          .update({ is_daily_limit_reached: true, status: 'paused' })
          .eq('id', adId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking ad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
