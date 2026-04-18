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

    // Fetch community squad tiers
    const { data: tiers, error } = await supabase
      .from('squad_tiers')
      .select('*')
      .eq('community_id', communityId)
      .order('tier_level', { ascending: true });

    if (error) throw error;

    return NextResponse.json(tiers || []);
  } catch (error) {
    console.error('Error fetching community squad tiers:', error);
    return NextResponse.json({ error: 'Failed to fetch community squad tiers' }, { status: 500 });
  }
}
