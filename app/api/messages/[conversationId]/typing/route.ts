/**
 * Typing Indicator API
 * POST /api/messages/[conversationId]/typing
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const conversationId = params.conversationId;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;
    const { isTyping } = await req.json();

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

    // Update typing status
    const { error } = await supabaseAdmin.rpc('update_typing_status', {
      p_conversation_id: conversationId,
      p_user_id: userId,
      p_is_typing: isTyping || false,
    });

    if (error) {
      logger.dbError('FUNCTION', 'update_typing_status', error, { conversationId, userId, isTyping });
      return NextResponse.json(
        { error: 'Failed to update typing status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('POST', '/api/messages/[conversationId]/typing', error as Error, { conversationId: params.conversationId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
