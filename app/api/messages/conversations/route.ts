/**
 * Conversations API
 * GET /api/messages/conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;

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

    const convIds = (conversations || []).map((cp: any) => cp.conversation?.id).filter(Boolean);

    // Fetch last messages for all conversations in one query
    const { data: lastMessages } = convIds.length
      ? await supabaseAdmin
          .from('messages')
          .select('conversation_id, content, created_at')
          .in('conversation_id', convIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      : { data: [] };

    // Build last-message map (first hit per conversation_id = latest)
    const lastMsgMap: Record<string, { content: string; created_at: string }> = {};
    for (const msg of (lastMessages || [])) {
      if (!lastMsgMap[msg.conversation_id]) lastMsgMap[msg.conversation_id] = msg;
    }

    // Fetch participant last_read_at for all conversations at once
    const { data: participantRows } = convIds.length
      ? await supabaseAdmin
          .from('conversation_participants')
          .select('conversation_id, last_read_at')
          .in('conversation_id', convIds)
          .eq('user_id', userId)
      : { data: [] };

    const readAtMap: Record<string, string> = {};
    for (const p of (participantRows || [])) {
      readAtMap[p.conversation_id] = p.last_read_at || new Date(0).toISOString();
    }

    // Count unread per conversation (messages after last_read_at not sent by self)
    const unreadMap: Record<string, number> = {};
    for (const msg of (lastMessages || [])) {
      if (msg.created_at > (readAtMap[msg.conversation_id] || new Date(0).toISOString())) {
        unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] || 0) + 1;
      }
    }

    const enrichedConversations = (conversations || []).map((cp: any) => {
      const conv = cp.conversation;
      const lastMsg = lastMsgMap[conv.id];
      return {
        id: conv.id,
        name: conv.name || conv.community?.name || 'Chat',
        conversationType: conv.conversation_type,
        lastMessage: lastMsg?.content || 'No messages yet',
        lastMessageTime: lastMsg?.created_at || null,
        unreadCount: unreadMap[conv.id] || 0,
      };
    });

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
