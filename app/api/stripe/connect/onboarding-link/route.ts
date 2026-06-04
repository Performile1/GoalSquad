import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getProfile } from '@/lib/profile-helpers';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json({ error: 'returnUrl is required' }, { status: 400 });
    }

    // Hämta profil med stripe_account_id
    const profile = await getProfile(user.id, 'role, stripe_account_id');

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.stripe_account_id) {
      return NextResponse.json({ error: 'No Stripe account found. Please create an account first.' }, { status: 400 });
    }

    // Generera onboarding link
    const link = await stripe.accountLinks.create({
      account: profile.stripe_account_id,
      refresh_url: `${returnUrl}/onboarding/refresh`,
      return_url: `${returnUrl}/onboarding/complete`,
      type: 'account_onboarding',
    });

    logger.info('Stripe onboarding link generated', { userId: user.id, stripeAccountId: profile.stripe_account_id });

    return NextResponse.json({
      success: true,
      url: link.url,
      expiresAt: link.expires_at,
    });
  } catch (error: any) {
    logger.apiError('POST', '/api/stripe/connect/onboarding-link', error, { userId: user?.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
