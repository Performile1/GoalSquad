import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller profile for the current user
    const { data: sellerProfile, error: profileError } = await supabaseAdmin
      .from('seller_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Fetch seller loot boxes
    const { data: lootBoxes, error } = await supabaseAdmin
      .from('seller_loot_boxes')
      .select('*, loot_boxes(*)')
      .eq('seller_profile_id', sellerProfile.id);

    if (error) throw error;

    return NextResponse.json(lootBoxes || []);
  } catch (error) {
    console.error('Error fetching seller loot boxes:', error);
    return NextResponse.json({ error: 'Failed to fetch seller loot boxes' }, { status: 500 });
  }
}
