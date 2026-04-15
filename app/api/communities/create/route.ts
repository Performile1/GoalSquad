/**
 * Community Creation API
 * POST /api/communities/create
 * 
 * Creates a new community (squad/team/class)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const communitySchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  communityType: z.enum(['school_class', 'sports_team', 'youth_club', 'scout_troop', 'other']),
  
  // Leadership
  treasurerId: z.string().uuid(),
  adminId: z.string().uuid(),
  distributorId: z.string().uuid().optional(),
  
  // Location
  country: z.string().length(2),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  
  // Treasury settings
  treasuryLockDays: z.number().int().min(1).max(90).default(30),
  
  // Branding
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
  
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = communitySchema.parse(body);

    // Check if slug is already taken
    const { data: existingCommunity } = await supabaseAdmin
      .from('communities')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (existingCommunity) {
      return NextResponse.json(
        { error: 'Community slug already exists' },
        { status: 400 }
      );
    }

    // Create organization for community
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: validatedData.name,
        org_type: 'hub', // Communities are treated as hubs
        country: validatedData.country,
        status: 'active',
      })
      .select()
      .single();

    if (orgError || !organization) {
      console.error('Failed to create organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Create community
    const { data: community, error: communityError } = await supabaseAdmin
      .from('communities')
      .insert({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        community_type: validatedData.communityType,
        organization_id: organization.id,
        treasurer_id: validatedData.treasurerId,
        admin_id: validatedData.adminId,
        distributor_id: validatedData.distributorId,
        country: validatedData.country,
        city: validatedData.city,
        postal_code: validatedData.postalCode,
        treasury_lock_days: validatedData.treasuryLockDays,
        logo_url: validatedData.logoUrl,
        banner_url: validatedData.bannerUrl,
        primary_color: validatedData.primaryColor,
        status: 'active',
        metadata: validatedData.metadata,
      })
      .select()
      .single();

    if (communityError || !community) {
      console.error('Failed to create community:', communityError);
      
      // Rollback organization
      await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', organization.id);
      
      return NextResponse.json(
        { error: 'Failed to create community' },
        { status: 500 }
      );
    }

    // Create community wallet
    await supabaseAdmin
      .from('wallets')
      .insert({
        owner_type: 'hub', // Communities use hub wallet type
        owner_id: community.id,
        currency: 'NOK',
        status: 'active',
      });

    // Update user profiles with community_id
    const userIds = [
      validatedData.treasurerId,
      validatedData.adminId,
      validatedData.distributorId,
    ].filter(Boolean);

    await supabaseAdmin
      .from('profiles')
      .update({ community_id: community.id })
      .in('id', userIds);

    return NextResponse.json({
      success: true,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        organizationId: organization.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Community creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
