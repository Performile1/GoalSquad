/**
 * Seller Registration API (with Guardian Consent)
 * POST /api/sellers/register
 * 
 * Registers a youth seller with guardian approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { AuditSignature } from '@/lib/audit-signature';
import { z } from 'zod';

const sellerSchema = z.object({
  // Seller info
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  dateOfBirth: z.string(), // ISO date
  
  // Guardian info
  guardianName: z.string().min(2).max(255),
  guardianEmail: z.string().email(),
  guardianPhone: z.string(),
  
  // Community
  communityId: z.string().uuid(),
  
  // Shop customization
  shopBio: z.string().max(500).optional(),
  shopVideoUrl: z.string().url().optional(),
  
  // Verification
  verificationMethod: z.enum(['otp_email', 'otp_sms']),
  
  // Request metadata
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = sellerSchema.parse(body);

    // Check age (must be under 18 for guardian requirement)
    const birthDate = new Date(validatedData.dateOfBirth);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    if (age >= 18) {
      return NextResponse.json(
        { error: 'Seller must be under 18 years old' },
        { status: 400 }
      );
    }

    // Verify community exists
    const { data: community, error: communityError } = await supabaseAdmin
      .from('communities')
      .select('*')
      .eq('id', validatedData.communityId)
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Create guardian profile first
    const { data: guardianUser, error: guardianAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.guardianEmail,
      email_confirm: false,
      user_metadata: {
        full_name: validatedData.guardianName,
        role: 'guardian',
      },
    });

    if (guardianAuthError || !guardianUser) {
      console.error('Failed to create guardian user:', guardianAuthError);
      return NextResponse.json(
        { error: 'Failed to create guardian account' },
        { status: 500 }
      );
    }

    // Create guardian profile
    const { data: guardianProfile, error: guardianProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: guardianUser.user.id,
        email: validatedData.guardianEmail,
        full_name: validatedData.guardianName,
        phone: validatedData.guardianPhone,
        role: 'guardian',
        community_id: validatedData.communityId,
        is_verified: false,
      })
      .select()
      .single();

    if (guardianProfileError) {
      console.error('Failed to create guardian profile:', guardianProfileError);
      return NextResponse.json(
        { error: 'Failed to create guardian profile' },
        { status: 500 }
      );
    }

    // Create seller user
    const { data: sellerUser, error: sellerAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      email_confirm: false,
      user_metadata: {
        full_name: validatedData.fullName,
        role: 'seller',
        date_of_birth: validatedData.dateOfBirth,
      },
    });

    if (sellerAuthError || !sellerUser) {
      console.error('Failed to create seller user:', sellerAuthError);
      return NextResponse.json(
        { error: 'Failed to create seller account' },
        { status: 500 }
      );
    }

    // Create seller profile
    const { data: sellerProfile, error: sellerProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: sellerUser.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        role: 'seller',
        guardian_id: guardianProfile.id,
        community_id: validatedData.communityId,
        is_verified: false,
        metadata: {
          date_of_birth: validatedData.dateOfBirth,
          age,
        },
      })
      .select()
      .single();

    if (sellerProfileError) {
      console.error('Failed to create seller profile:', sellerProfileError);
      return NextResponse.json(
        { error: 'Failed to create seller profile' },
        { status: 500 }
      );
    }

    // Create seller gamification profile
    const shopUrl = `${community.slug}-${sellerProfile.id.substring(0, 8)}`;
    
    const { error: sellerGamificationError } = await supabaseAdmin
      .from('seller_profiles')
      .insert({
        user_id: sellerProfile.id,
        community_id: validatedData.communityId,
        shop_url: shopUrl,
        shop_bio: validatedData.shopBio,
        shop_video_url: validatedData.shopVideoUrl,
      });

    if (sellerGamificationError) {
      console.error('Failed to create seller gamification profile:', sellerGamificationError);
    }

    // Initiate guardian consent signature
    const signatureResult = await AuditSignature.initiateSignature({
      entityType: 'merchant', // Using merchant type for sellers
      entityId: sellerProfile.id,
      action: 'guardian_consent',
      userId: guardianProfile.id,
      email: validatedData.guardianEmail,
      phone: validatedData.guardianPhone,
      verificationMethod: validatedData.verificationMethod,
      ipAddress: validatedData.ipAddress,
      userAgent: validatedData.userAgent,
      metadata: {
        sellerName: validatedData.fullName,
        sellerAge: age,
        communityName: community.name,
      },
    });

    if (!signatureResult.success) {
      return NextResponse.json(
        { error: signatureResult.error },
        { status: 500 }
      );
    }

    // Update community member count
    await supabaseAdmin
      .from('communities')
      .update({
        total_members: community.total_members + 1,
      })
      .eq('id', validatedData.communityId);

    return NextResponse.json({
      success: true,
      seller: {
        id: sellerProfile.id,
        fullName: sellerProfile.full_name,
        shopUrl,
        guardianId: guardianProfile.id,
      },
      verification: {
        otpHash: signatureResult.otp,
        method: validatedData.verificationMethod,
        sentTo: validatedData.verificationMethod === 'otp_email' 
          ? validatedData.guardianEmail 
          : validatedData.guardianPhone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Seller registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
