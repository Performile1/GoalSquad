/**
 * Conversations API
 * GET /api/messages/conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // TODO: Get user ID from session
    const userId = req.headers.get('x-user-id'); // Placeholder

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's conversations
    const { data: conversations, error } = await supabaseAdmin
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversation:conversations (
          id,
          conversation_type,
          name,
          community:communities (name)
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Enrich with last message and unread count
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (cp: any) => {
        const conv = cp.conversation;

        // Get last message
        const { data: lastMsg } = await supabaseAdmin
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { data: participant } = await supabaseAdmin
          .from('conversation_participants')
          .select('last_read_at')
          .eq('conversation_id', conv.id)
          .eq('user_id', userId)
          .single();

        const { count: unreadCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .gt('created_at', participant?.last_read_at || new Date(0).toISOString())
          .is('deleted_at', null);

        return {
          id: conv.id,
          name: conv.name || conv.community?.name || 'Chat',
          conversationType: conv.conversation_type,
          lastMessage: lastMsg?.content || 'No messages yet',
          lastMessageTime: lastMsg?.created_at || conv.created_at,
          unreadCount: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
