import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // Fetch community badges
    const { data: badges, error } = await supabaseAdmin
      .from('community_badges')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(badges || []);
  } catch (error) {
    console.error('Error fetching community badges:', error);
    return NextResponse.json({ error: 'Failed to fetch community badges' }, { status: 500 });
  }
}
