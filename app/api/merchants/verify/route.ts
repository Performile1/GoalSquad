/**
 * Merchant Verification API
 * POST /api/merchants/verify
 * Completes the onboarding by verifying OTP
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { AuditSignature } from '@/lib/audit-signature';
import { z } from 'zod';

const verificationSchema = z.object({
  merchantId: z.string().uuid(),
  otp: z.string().length(6),
  otpHash: z.string(),
  userId: z.string().uuid(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  verificationMethod: z.enum(['otp_sms', 'otp_email']),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = verificationSchema.parse(body);

    // Fetch merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('id', validatedData.merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Complete signature
    const signatureResult = await AuditSignature.completeSignature(
      {
        entityType: 'merchant',
        entityId: validatedData.merchantId,
        action: 'onboarding',
        userId: validatedData.userId,
        email: validatedData.email || merchant.email,
        phone: validatedData.phone || merchant.phone,
        verificationMethod: validatedData.verificationMethod,
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
      },
      validatedData.otp,
      validatedData.otpHash
    );

    if (!signatureResult.success) {
      return NextResponse.json(
        { error: signatureResult.error },
        { status: 400 }
      );
    }

    // Update merchant as verified
    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update({
        verification_status: 'verified',
        onboarding_completed: true,
      })
      .eq('id', validatedData.merchantId);

    if (updateError) {
      console.error('Failed to update merchant:', updateError);
      return NextResponse.json(
        { error: 'Failed to update merchant status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        verified: true,
        signatureId: signatureResult.signatureId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
