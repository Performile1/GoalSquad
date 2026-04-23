import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {

    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get('placement');

    if (!placement) {
      return NextResponse.json({ error: 'Missing placement parameter' }, { status: 400 });
    }

    // Get placement by name
    const { data: placementData, error: placementError } = await supabaseAdmin
      .from('ad_placements')
      .select('id')
      .eq('name', placement)
      .eq('is_active', true)
      .single();

    if (placementError || !placementData) {
      return NextResponse.json({ ad: null });
    }

    // Reset daily views and check limits before fetching
    await supabaseAdmin.rpc('reset_daily_ad_views');
    await supabaseAdmin.rpc('check_daily_ad_limits');
    await supabaseAdmin.rpc('check_total_ad_limits');

    // Get active ads for this placement using new rotation function
    const { data: ads, error: adsError } = await supabaseAdmin.rpc('get_active_ads_for_placement', {
      p_placement_id: placementData.id,
    });

    if (adsError) throw adsError;

    if (!ads || ads.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Return a random ad from the rotation pool
    const randomIndex = Math.floor(Math.random() * ads.length);
    return NextResponse.json({ ad: ads[randomIndex] });
  } catch (error: any) {
    console.error('Error fetching active ads:', error);
    return NextResponse.json({ ad: null });
  }
}
