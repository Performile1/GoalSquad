/**
 * Campaigns API
 * GET /api/communities/[id]/campaigns - List campaigns
 * POST /api/communities/[id]/campaigns - Create campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  salesGoal: z.string().transform(Number).optional(),
  unitsGoal: z.string().transform(Number).optional(),
  communityCommissionPercent: z.string().transform(Number).default('20'),
  sellerCommissionPercent: z.string().transform(Number).default('10'),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch campaigns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Campaigns fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    const body = await req.json();
    const validatedData = campaignSchema.parse(body);

    // Verify community exists
    const { data: community } = await supabaseAdmin
      .from('communities')
      .select('id')
      .eq('id', communityId)
      .single();

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Create campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        community_id: communityId,
        name: validatedData.name,
        description: validatedData.description,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        sales_goal: validatedData.salesGoal || 0,
        units_goal: validatedData.unitsGoal || 0,
        community_commission_percent: validatedData.communityCommissionPercent,
        seller_commission_percent: validatedData.sellerCommissionPercent,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create campaign:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Campaign creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
