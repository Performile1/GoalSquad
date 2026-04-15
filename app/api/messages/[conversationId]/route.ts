/**
 * Messages API
 * GET /api/messages/[conversationId] - Get messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const conversationId = params.conversationId;
    const userId = req.headers.get('x-user-id'); // TODO: Get from session

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get messages
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        message_type,
        created_at,
        sender:profiles (full_name)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Failed to fetch messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    const formattedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: msg.sender?.full_name || 'Unknown',
      content: msg.content,
      messageType: msg.message_type,
      createdAt: msg.created_at,
      isOwn: msg.sender_id === userId,
    })) || [];

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
