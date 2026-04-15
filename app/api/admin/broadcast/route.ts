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

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id'); // TODO: Get from session
    const {
      targetType,
      targetId,
      targetRole,
      subject,
      content,
      priority,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is gs_admin
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (user?.role !== 'gs_admin') {
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
    let recipientQuery = supabaseAdmin.from('profiles').select('id');

    switch (targetType) {
      case 'all_users':
        // No filter - all users
        break;
      case 'community':
        recipientQuery = supabaseAdmin
          .from('seller_profiles')
          .select('user_id')
          .eq('community_id', targetId);
        break;
      case 'role':
        recipientQuery = supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('role', targetRole);
        break;
    }

    const { data: recipients } = await recipientQuery;

    if (recipients && recipients.length > 0) {
      // Create recipient records
      const recipientRecords = recipients.map((r: any) => ({
        broadcast_id: broadcast.id,
        user_id: targetType === 'community' ? r.user_id : r.id,
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
