/**
 * Merchant to Community Message API
 * POST /api/merchants/[id]/message-community
 * 
 * Allows merchants to send announcements/offers to communities
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = params.id;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;
    const {
      communityId,
      subject,
      content,
      messageType,
    } = await req.json();

    // Verify user owns this merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('user_id, organization_id')
      .eq('id', merchantId)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (merchant.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create merchant-community message
    const { data: message, error } = await supabaseAdmin
      .from('merchant_community_messages')
      .insert({
        merchant_id: merchantId,
        community_id: communityId,
        subject,
        content,
        message_type: messageType || 'announcement',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to send merchant message:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Get community members for notification
    const { data: members } = await supabaseAdmin
      .from('seller_profiles')
      .select('user_id')
      .eq('community_id', communityId);

    // TODO: Send push notifications to all members

    return NextResponse.json({
      success: true,
      message,
      recipientCount: members?.length || 0,
    });
  } catch (error) {
    console.error('Merchant message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
