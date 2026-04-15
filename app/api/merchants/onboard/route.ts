/**
 * Merchant Onboarding API
 * POST /api/merchants/onboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { AuditSignature } from '@/lib/audit-signature';
import { z } from 'zod';

const onboardingSchema = z.object({
  merchantName: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  
  // Address
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  
  // Legal
  legalName: z.string().optional(),
  orgNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  
  // User context
  userId: z.string().uuid(),
  
  // Verification
  verificationMethod: z.enum(['otp_sms', 'otp_email']),
  
  // Request metadata
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = onboardingSchema.parse(body);

    // Check if slug is already taken
    const { data: existingMerchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant slug already exists' },
        { status: 400 }
      );
    }

    // Create organization first
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: validatedData.merchantName,
        org_type: 'merchant',
        legal_name: validatedData.legalName,
        org_number: validatedData.orgNumber,
        country: validatedData.country,
        vat_number: validatedData.vatNumber,
        status: 'pending',
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

    // Create merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .insert({
        organization_id: organization.id,
        user_id: validatedData.userId,
        merchant_name: validatedData.merchantName,
        slug: validatedData.slug,
        description: validatedData.description,
        email: validatedData.email,
        phone: validatedData.phone,
        address_line1: validatedData.addressLine1,
        address_line2: validatedData.addressLine2,
        city: validatedData.city,
        postal_code: validatedData.postalCode,
        country: validatedData.country,
        onboarding_completed: false,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (merchantError || !merchant) {
      console.error('Failed to create merchant:', merchantError);
      
      // Rollback organization
      await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', organization.id);
      
      return NextResponse.json(
        { error: 'Failed to create merchant' },
        { status: 500 }
      );
    }

    // Create merchant wallet
    await supabaseAdmin
      .from('wallets')
      .insert({
        owner_type: 'merchant',
        owner_id: merchant.id,
        currency: 'NOK',
        status: 'active',
      });

    // Initiate signature process
    const signatureResult = await AuditSignature.initiateSignature({
      entityType: 'merchant',
      entityId: merchant.id,
      action: 'onboarding',
      userId: validatedData.userId,
      email: validatedData.email,
      phone: validatedData.phone,
      verificationMethod: validatedData.verificationMethod,
      ipAddress: validatedData.ipAddress,
      userAgent: validatedData.userAgent,
      metadata: {
        merchantName: validatedData.merchantName,
        slug: validatedData.slug,
      },
    });

    if (!signatureResult.success) {
      return NextResponse.json(
        { error: signatureResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        merchantName: merchant.merchant_name,
        slug: merchant.slug,
        organizationId: organization.id,
      },
      verification: {
        otpHash: signatureResult.otp,
        method: validatedData.verificationMethod,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
