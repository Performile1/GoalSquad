/**
 * Seller Registration API (Organization-based)
 * POST /api/sellers/register
 * 
 * Registers a seller connected to an organization (forening/klass/klubb)
 * with invite code verification and commission sharing option
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const sellerSchema = z.object({
  // User info
  email: z.string().email(),
  
  // Organization info
  organization_type: z.enum(['forening', 'klass', 'klubb', 'annat']),
  organization_name: z.string().min(2).max(255),
  invite_code: z.string().min(4).max(20),
  
  // Commission sharing
  share_commission: z.boolean(),
  
  // Request metadata
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = sellerSchema.parse(body);

    // Get user by email
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === validatedData.email)?.id || ''
    );

    if (authError || !user) {
      // Try to get user by email from profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', validatedData.email)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Användare hittades inte' },
          { status: 404 }
        );
      }
    }

    // Get user ID from either auth or profile
    const userId = user?.id || (await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .single()
    ).data?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Användare hittades inte' },
        { status: 404 }
      );
    }

    // Verify invite code against organizations
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('invite_code', validatedData.invite_code)
      .eq('type', validatedData.organization_type)
      .ilike('name', `%${validatedData.organization_name}%`)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Ogiltig inbjudningskod eller organisation hittades inte' },
        { status: 400 }
      );
    }

    // Update user profile with organization info
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'seller',
        organization_id: organization.id,
        organization_type: validatedData.organization_type,
        organization_name: validatedData.organization_name,
        share_commission: validatedData.share_commission,
        is_verified: true, // Auto-verified with valid invite code
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update seller profile:', profileError);
      return NextResponse.json(
        { error: 'Kunde inte uppdatera profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      seller: {
        id: userId,
        organization: organization.name,
        shareCommission: validatedData.share_commission,
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
    return NextResponse.json(
      { error: 'Internt serverfel' },
      { status: 500 }
    );
  }
}
