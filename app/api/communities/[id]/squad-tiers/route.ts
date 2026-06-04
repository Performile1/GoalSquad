import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // Fetch community squad tiers
    const { data: tiers, error } = await supabaseAdmin
      .from('squad_tiers')
      .select('*')
      .eq('community_id', communityId)
      .order('tier_level', { ascending: true });

    if (error) throw error;

    return NextResponse.json(tiers || []);
  } catch (error) {
    logger.apiError('GET', '/api/communities/[id]/squad-tiers', error as Error, { communityId: params.id });
    return NextResponse.json({ error: 'Failed to fetch community squad tiers' }, { status: 500 });
  }
}
