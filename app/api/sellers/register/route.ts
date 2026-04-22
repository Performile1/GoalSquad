/**
 * Seller Registration API
 * POST /api/sellers/register
 *
 * Sets role='seller' on the user's profile.
 * Optionally links to an organization by name search.
 * invite_code is accepted but not required (organizations table has no invite_code column).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const sellerSchema = z.object({
  email:             z.string().email(),
  organization_type: z.enum(['forening', 'klass', 'klubb', 'annat']).optional(),
  organization_name: z.string().min(2).max(255).optional(),
  invite_code:       z.string().optional(),
  share_commission:  z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = sellerSchema.parse(body);

    // Look up user by email in profiles
    const { data: profile, error: profileLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();

    if (profileLookupError || !profile) {
      return NextResponse.json({ error: 'Användare hittades inte' }, { status: 404 });
    }

    const userId = profile.id;

    // Optionally find a matching organization by name + org_type
    let organizationId: string | null = null;
    if (data.organization_name && data.organization_type) {
      // Map form type → DB org_type
      const orgTypeMap: Record<string, string> = {
        forening: 'hub',
        klass:    'hub',
        klubb:    'hub',
        annat:    'hub',
      };
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('org_type', orgTypeMap[data.organization_type] ?? 'hub')
        .ilike('name', `%${data.organization_name}%`)
        .maybeSingle();
      if (org) organizationId = org.id;
    }

    // Update profile — only columns that actually exist in the DB schema
    const profileUpdate: Record<string, unknown> = { role: 'seller' };
    if (organizationId) profileUpdate.organization_id = organizationId;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update seller profile:', updateError);
      return NextResponse.json({ error: 'Kunde inte uppdatera profil' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      seller: {
        id:           userId,
        organization: data.organization_name ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validering misslyckades', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Seller registration error:', error);
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}
