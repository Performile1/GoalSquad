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

    // Fetch active quests
    const { data: quests, error: questsError } = await supabaseAdmin
      .from('seller_quests')
      .select('*')
      .eq('is_active', true);

    if (questsError) throw questsError;

    // Fetch quest progress for the seller
    const questIds = quests.map(q => q.id);
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('seller_quest_progress')
      .select('*')
      .eq('seller_profile_id', sellerProfile.id)
      .in('quest_id', questIds);

    if (progressError && progressError.code !== 'PGRST116') {
      throw progressError;
    }

    // Combine quests with progress
    const questsWithProgress = quests.map(quest => ({
      ...quest,
      progress: progress?.find(p => p.quest_id === quest.id) || {
        current_value: 0,
        is_completed: false,
        completed_at: null,
      },
    }));

    return NextResponse.json(questsWithProgress);
  } catch (error) {
    console.error('Error fetching seller quests:', error);
    return NextResponse.json({ error: 'Failed to fetch seller quests' }, { status: 500 });
  }
}
