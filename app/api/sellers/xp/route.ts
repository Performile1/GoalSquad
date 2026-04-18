import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller profile for the current user
    const { data: sellerProfile, error: profileError } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Fetch seller XP
    const { data: xp, error } = await supabase
      .from('seller_xp')
      .select('*')
      .eq('seller_profile_id', sellerProfile.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!xp) {
      // Create new XP record
      const { data: newXP, error: createError } = await supabase
        .from('seller_xp')
        .insert({
          seller_profile_id: sellerProfile.id,
          current_xp: 0,
          current_level: 1,
          total_xp_earned: 0,
        })
        .select()
        .single();

      if (createError) throw createError;

      return NextResponse.json(newXP);
    }

    return NextResponse.json(xp);
  } catch (error) {
    console.error('Error fetching seller XP:', error);
    return NextResponse.json({ error: 'Failed to fetch seller XP' }, { status: 500 });
  }
}
