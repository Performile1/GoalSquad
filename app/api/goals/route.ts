import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getProfile } from '@/lib/profile-helpers';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  let user: Awaited<ReturnType<typeof getAuthUser>> = null;
  try {
    user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';

    const { data: goals, error } = await supabaseAdmin
      .from('entity_goals')
      .select('*')
      .eq('entity_id', user.id)
      .eq('status', status)
      .order('end_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ goals });
  } catch (error: any) {
    logger.apiError('GET', '/api/goals', error, { userId: user?.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof getAuthUser>> = null;
  try {
    user = await getAuthUser(request);
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

    const profile = await getProfile(user.id, 'role');

    if (!profile || (profile.role !== 'community' && profile.role !== 'seller')) {
      return NextResponse.json({ error: 'Only communities and sellers can create goals' }, { status: 403 });
    }

    const { data: goal, error } = await supabaseAdmin
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
    logger.apiError('POST', '/api/goals', error, { userId: user?.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
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

    const { error } = await supabaseAdmin
      .from('entity_goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('entity_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.apiError('PATCH', '/api/goals', error as Error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
