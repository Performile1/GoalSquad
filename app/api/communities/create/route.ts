/**
 * Community Creation API
 * POST /api/communities/create
 *
 * Public "apply to join" endpoint — no auth required.
 * Stores contact info in metadata since it's not yet a DB column.
 *
 * DB community_type CHECK: ('club','klass','forening','association','school','organization')
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// Maps form values → valid DB community_type CHECK values
const TYPE_MAP: Record<string, string> = {
  sports_team: 'forening',
  school_class: 'klass',
  youth_club:   'forening',
  scout_troop:  'forening',
  other:        'association',
};

const communitySchema = z.object({
  name:          z.string().min(2).max(255),
  slug:          z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  description:   z.string().optional(),
  communityType: z.enum(['school_class', 'sports_team', 'youth_club', 'scout_troop', 'other']),
  // Contact / extra info (stored in metadata)
  city:          z.string().optional(),
  country:       z.string().length(2).default('SE'),
  contactName:   z.string().optional(),
  contactEmail:  z.string().email().optional(),
  contactPhone:  z.string().optional(),
  schoolName:    z.string().optional(),
  grade:         z.string().optional(),
  website:       z.string().url().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = communitySchema.parse(body);

    // Slugify to guarantee valid slug
    const slug = data.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Namn/slug är redan taget' }, { status: 400 });
    }

    // Create owning organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name:     data.name,
        org_type: 'hub',
        country:  data.country,
        city:     data.city ?? null,
        email:    data.contactEmail ?? null,
        phone:    data.contactPhone ?? null,
        status:   'active',
      })
      .select()
      .single();

    if (orgError || !organization) {
      console.error('Failed to create organization:', orgError);
      return NextResponse.json({ error: 'Kunde inte skapa organisation' }, { status: 500 });
    }

    // Build metadata with all extra info
    const metadata = {
      contact_name:  data.contactName,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      city:          data.city,
      country:       data.country,
      school_name:   data.schoolName,
      grade:         data.grade,
      website:       data.website,
      applied_at:    new Date().toISOString(),
    };

    // Insert community — only columns that exist in the DB schema
    const { data: community, error: communityError } = await supabaseAdmin
      .from('communities')
      .insert({
        name:            data.name,
        slug,
        description:     data.description ?? null,
        community_type:  TYPE_MAP[data.communityType] ?? 'association',
        organization_id: organization.id,
        status:          'active',
        metadata,
      })
      .select()
      .single();

    if (communityError || !community) {
      console.error('Failed to create community:', communityError);
      // Rollback organization
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json({ error: 'Kunde inte skapa förening/klass' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      community: {
        id:             community.id,
        name:           community.name,
        slug:           community.slug,
        organizationId: organization.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validering misslyckades', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Community creation error:', error);
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}
