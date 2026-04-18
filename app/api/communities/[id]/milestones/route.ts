import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // Fetch community milestones
    const { data: milestones, error } = await supabase
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
