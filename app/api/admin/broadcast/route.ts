/**
 * Admin Broadcast API
 * POST /api/admin/broadcast
 * 
 * Allows gs_admin to send messages to:
 * - All users
 * - Specific community
 * - Specific role
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;
    const {
      targetType,
      targetId,
      targetRole,
      subject,
      content,
      priority,
    } = await req.json();

    // Verify user is gs_admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'gs_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Create broadcast
    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from('broadcast_messages')
      .insert({
        sender_type: 'gs_admin',
        sender_id: userId,
        target_type: targetType,
        target_id: targetId,
        target_role: targetRole,
        subject,
        content,
        priority: priority || 'normal',
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Failed to create broadcast:', broadcastError);
      return NextResponse.json(
        { error: 'Failed to create broadcast' },
        { status: 500 }
      );
    }

    // Determine recipients
    let recipients: { id: string }[] = [];

    switch (targetType) {
      case 'all_users':
        const { data: allUsers } = await supabaseAdmin
          .from('profiles')
          .select('id');
        recipients = allUsers || [];
        break;
      case 'community':
        const { data: communityMembers } = await supabaseAdmin
          .from('community_members')
          .select('user_id')
          .eq('community_id', targetId);
        // Map user_id to id for consistency
        recipients = (communityMembers || []).map(m => ({ id: m.user_id }));
        break;
      case 'role':
        const { data: roleUsers } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('role', targetRole);
        recipients = roleUsers || [];
        break;
    }

    if (recipients && recipients.length > 0) {
      // Create recipient records
      const recipientRecords = recipients.map((r) => ({
        broadcast_id: broadcast.id,
        user_id: r.id,
      }));

      await supabaseAdmin
        .from('broadcast_recipients')
        .insert(recipientRecords);
    }

    return NextResponse.json({
      success: true,
      broadcast,
      recipientCount: recipients?.length || 0,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
