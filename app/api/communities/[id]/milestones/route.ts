import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // Fetch community milestones
    const { data: milestones, error } = await supabaseAdmin
      .from('community_milestones')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(milestones || []);
  } catch (error) {
    console.error('Error fetching community milestones:', error);
    return NextResponse.json({ error: 'Failed to fetch community milestones' }, { status: 500 });
  }
}
