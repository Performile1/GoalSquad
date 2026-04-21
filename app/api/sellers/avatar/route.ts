import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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

    // Fetch seller avatar equipment
    const { data: avatar, error } = await supabase
      .from('seller_avatar_equipment')
      .select('*')
      .eq('seller_profile_id', sellerProfile.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!avatar) {
      // Create new avatar record
      const { data: newAvatar, error: createError } = await supabase
        .from('seller_avatar_equipment')
        .insert({
          seller_profile_id: sellerProfile.id,
          unlocked_items: [],
        })
        .select()
        .single();

      if (createError) throw createError;

      return NextResponse.json(newAvatar);
    }

    return NextResponse.json(avatar);
  } catch (error) {
    console.error('Error fetching seller avatar:', error);
    return NextResponse.json({ error: 'Failed to fetch seller avatar' }, { status: 500 });
  }
}
