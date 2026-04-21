import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';

    const { data: goals, error } = await supabase
      .from('entity_goals')
      .select('*')
      .eq('entity_id', user.id)
      .eq('status', status)
      .order('end_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ goals });
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      goal_type,
      goal_title,
      target_value,
      unit,
      start_date,
      end_date,
      description,
    } = body;

    if (!goal_type || !goal_title || !target_value || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'community' && profile.role !== 'seller')) {
      return NextResponse.json({ error: 'Only communities and sellers can create goals' }, { status: 403 });
    }

    const { data: goal, error } = await supabase
      .from('entity_goals')
      .insert({
        entity_id: user.id,
        entity_type: profile.role,
        goal_type,
        goal_title,
        target_value,
        current_value: 0,
        unit: unit || 'kr',
        start_date,
        end_date,
        status: 'active',
        description,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ goal });
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goalId, current_value, status } = body;

    if (!goalId) {
      return NextResponse.json({ error: 'Missing goal ID' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (current_value !== undefined) updateData.current_value = current_value;
    if (status) updateData.status = status;

    const { error } = await supabase
      .from('entity_goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('entity_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
