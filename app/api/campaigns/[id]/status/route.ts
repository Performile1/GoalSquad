/**
 * Campaign Status API
 * PUT /api/campaigns/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const { status } = await req.json();

    if (!['draft', 'active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId);

    if (error) {
      logger.dbError('UPDATE', 'campaigns', error, { campaignId, status });
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('PUT', '/api/campaigns/[id]/status', error as Error, { campaignId: params.id, status });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
