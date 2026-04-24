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

    // Get product-specific goals for the community
    const { data: goals, error } = await supabase
      .from('entity_goals')
      .select(`
        *,
        products (
          id,
          name,
          title
        )
      `)
      .eq('entity_id', communityId)
      .eq('entity_type', 'community')
      .not('product_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching product goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
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
    const { product_id, goal_type, goal_title, target_value, unit, period, start_date, end_date, description } = body;

    if (!product_id || !goal_type || !goal_title || !target_value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Create product-specific goal
    const { data: goal, error } = await supabase
      .from('entity_goals')
      .insert({
        entity_id: communityId,
        entity_type: 'community',
        product_id,
        goal_type,
        goal_title,
        target_value,
        current_value: 0,
        unit: unit || 'kr',
        period: period || 'monthly',
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date,
        description,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error creating product goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
