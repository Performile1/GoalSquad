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
  let user: Awaited<ReturnType<typeof getAuthUser>> = null;
  try {
    user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessType = 'individual' } = body;

    // Validera business_type
    if (!['individual', 'company'].includes(businessType)) {
      return NextResponse.json({ error: 'Invalid business_type. Must be "individual" or "company"' }, { status: 400 });
    }

    // Kontrollera att användaren har rätt roll (community eller seller)
    const profile = await getProfile(user.id, 'role, entity_type');

    if (!profile || (profile.role !== 'community' && profile.role !== 'seller')) {
      return NextResponse.json({ error: 'Only communities and sellers can create Stripe accounts' }, { status: 403 });
    }

    // Kontrollera om användaren redan har ett Stripe-konto
    if (profile.stripe_account_id) {
      return NextResponse.json({ 
        error: 'User already has a Stripe account',
        stripeAccountId: profile.stripe_account_id
      }, { status: 400 });
    }

    // Skapa Stripe Connected Account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'SE',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: businessType,
      business_profile: {
        url: 'https://goalsquad.se',
        mcc: '5734', // Computer software stores
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'weekly',
            weekly_anchor: 'friday',
          },
        },
      },
      metadata: {
        goalsquad_profile_id: user.id,
        goalsquad_role: profile.role,
        goalsquad_entity_type: profile.entity_type || profile.role,
      },
    });

    // Spara stripe_account_id till profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        stripe_account_id: account.id,
        stripe_business_type: businessType,
      })
      .eq('id', user.id);

    if (updateError) {
      logger.dbError('UPDATE', 'profiles', updateError, { userId: user.id, stripeAccountId: account.id });
      return NextResponse.json({ error: 'Failed to save Stripe account ID' }, { status: 500 });
    }

    // Skapa post i stripe_account_status
    const { error: statusError } = await supabaseAdmin
      .from('stripe_account_status')
      .insert({
        profile_id: user.id,
        stripe_account_id: account.id,
        onboarding_status: 'pending',
        payouts_enabled: false,
        charges_enabled: false,
        requirements: {},
      });

    if (statusError) {
      logger.dbError('INSERT', 'stripe_account_status', statusError, { userId: user.id, stripeAccountId: account.id });
      // Fortsätt ändå, detta är inte kritiskt
    }

    logger.info('Stripe account created', { userId: user.id, stripeAccountId: account.id, businessType });

    return NextResponse.json({
      success: true,
      accountId: account.id,
      businessType,
      onboardingStatus: 'pending',
    });
  } catch (error: any) {
    logger.apiError('POST', '/api/stripe/connect/create-account', error, { userId: user?.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
