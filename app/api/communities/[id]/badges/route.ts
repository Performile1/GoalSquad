import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const communityId = params.id;

    // Fetch community badges
    const { data: badges, error } = await supabase
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
