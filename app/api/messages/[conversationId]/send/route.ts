/**
 * Send Message API
 * POST /api/messages/[conversationId]/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  let conversationId = params.conversationId;
  let userId = '';
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = authUser.id;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    // Verify user is participant
    const { data: participant } = await supabaseAdmin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Create message
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
        message_type: 'text',
      })
      .select()
      .single();

    if (error) {
      logger.dbError('INSERT', 'messages', error, { conversationId, userId });
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Update conversation timestamp
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // TODO: Send push notification to other participants

    return NextResponse.json({ success: true, message });
  } catch (error) {
    logger.apiError('POST', '/api/messages/[conversationId]/send', error as Error, { conversationId, userId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
