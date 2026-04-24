import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = params.id;

    // Verify user is a member of the community
    const { data: member, error: memberError } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', authUser.id)
      .single();

    if (memberError || !member || !['admin', 'moderator'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get community-merchant relationships
    const { data: relationships, error } = await supabase
      .from('community_merchants')
      .select(`
        *,
        merchants (
          id,
          business_name,
          company_description
        )
      `)
      .eq('community_id', communityId);

    if (error) throw error;

    return NextResponse.json({ relationships });
  } catch (error) {
    console.error('Error fetching community merchants:', error);
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = params.id;
    const body = await req.json();
    const { merchant_id, commission_percent, terms_accepted } = body;

    if (!merchant_id) {
      return NextResponse.json({ error: 'merchant_id is required' }, { status: 400 });
    }

    // Verify user is admin of the community
    const { data: member, error: memberError } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', authUser.id)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create community-merchant relationship
    const { data: relationship, error } = await supabase
      .from('community_merchants')
      .insert({
        community_id: communityId,
        merchant_id,
        commission_percent: commission_percent || 12.00,
        terms_accepted: terms_accepted || false,
        terms_accepted_at: terms_accepted ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ relationship });
  } catch (error) {
    console.error('Error creating community merchant:', error);
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 });
  }
}
