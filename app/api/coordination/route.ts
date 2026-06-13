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
    const status = searchParams.get('status') || 'open';

    const { data: messages, error } = await supabaseAdmin
      .from('coordination_messages')
      .select(`
        *,
        sender:profiles!coordination_messages_sender_id_fkey (
          full_name,
          email
        ),
        product:products (
          name
        )
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ messages });
  } catch (error: any) {
    logger.apiError('GET', '/api/coordination', error, { userId: user?.id });
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
      message_type,
      title,
      message,
      product_id,
      quantity_needed,
      location_area,
      recipient_type,
    } = body;

    if (!message_type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const profile = await getProfile(user.id, 'role');

    if (!profile || (profile.role !== 'community' && profile.role !== 'seller')) {
      return NextResponse.json({ error: 'Only communities and sellers can create coordination messages' }, { status: 403 });
    }

    const { data: newMessage, error } = await supabaseAdmin
      .from('coordination_messages')
      .insert({
        sender_id: user.id,
        recipient_type: recipient_type || 'nearby',
        message_type,
        title,
        message,
        product_id: product_id || null,
        quantity_needed: quantity_needed || null,
        location_area: location_area || null,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: newMessage });
  } catch (error: any) {
    logger.apiError('POST', '/api/coordination', error, { userId: user?.id });
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
    const { messageId, status } = body;

    if (!messageId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('coordination_messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.apiError('PATCH', '/api/coordination', error as Error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
