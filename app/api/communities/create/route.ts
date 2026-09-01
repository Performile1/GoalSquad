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
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Community types are inconsistent across older/newer migrations. We try a
// few valid values in order so the API works against both legacy and newer DB
// schemas instead of 500ing on a CHECK constraint mismatch.
const TYPE_CANDIDATES: Record<string, string[]> = {
  sports_team: ['forening', 'club', 'association'],
  school_class: ['klass', 'class', 'school'],
  youth_club: ['forening', 'club', 'association'],
  scout_troop: ['forening', 'club', 'association'],
  other: ['association', 'organization', 'club'],
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
      logger.dbError('INSERT', 'organizations', orgError ?? new Error('Unknown org error'), { name: data.name });
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

    // Insert community — older and newer migrations disagree on the allowed
    // community_type values, so try common valid candidates instead of failing
    // immediately with a 500 on a single mismatched CHECK constraint.
    let community: any = null;
    let communityError: any = null;

    for (const candidateType of TYPE_CANDIDATES[data.communityType] ?? ['association']) {
      const result = await supabaseAdmin
        .from('communities')
        .insert({
          name:            data.name,
          slug,
          description:     data.description ?? null,
          community_type:  candidateType,
          organization_id: organization.id,
          status:          'active',
          metadata,
        })
        .select()
        .single();

      if (!result.error) {
        community = result.data;
        communityError = null;
        break;
      }

      communityError = result.error;
      const errorText = `${result.error?.message ?? ''} ${result.error?.details ?? ''}`.toLowerCase();
      const isCheckConstraintIssue = result.error?.code === '23514' || errorText.includes('community_type');

      if (!isCheckConstraintIssue) {
        break;
      }
    }

    if (!community) {
      logger.dbError('INSERT', 'communities', communityError ?? new Error('Unknown community error'), { name: data.name, communityType: data.communityType });
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
    logger.apiError('POST', '/api/communities/create', error as Error, { name: (error as any).name || 'unknown' });
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}
