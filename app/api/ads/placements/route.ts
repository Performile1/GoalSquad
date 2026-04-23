import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {

    const { data: placements, error } = await supabaseAdmin
      .from('ad_placements')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Add pricing (these could be stored in a separate pricing table in the future)
    const placementsWithPricing = placements.map((placement: any) => ({
      ...placement,
      price_per_day: 100, // Base price per day
      price_per_1000_views: 50, // Price per 1000 views
      price_per_100_clicks: 200, // Price per 100 clicks
    }));

    return NextResponse.json({ placements: placementsWithPricing });
  } catch (error: any) {
    console.error('Error fetching placements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
