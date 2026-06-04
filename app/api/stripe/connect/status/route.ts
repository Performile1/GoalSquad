import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getProfile } from '@/lib/profile-helpers';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = params;

    // Verifiera att kontot tillhör användaren
    const profile = await getProfile(user.id, 'role, stripe_account_id');

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.stripe_account_id !== accountId) {
      return NextResponse.json({ error: 'Account does not belong to user' }, { status: 403 });
    }

    // Hämta konto-status från Stripe
    const account = await stripe.accounts.retrieve(accountId);

    const isComplete = 
      account.charges_enabled && 
      account.payouts_enabled &&
      !account.requirements?.currently_due?.length;

    // Uppdatera databas med korrekt profile_id
    const { error: updateError } = await supabaseAdmin
      .from('stripe_account_status')
      .upsert({
        profile_id: user.id, // Fix: Använd user.id istället för undefined userId
        stripe_account_id: accountId,
        onboarding_status: isComplete ? 'completed' : 'pending',
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        requirements: account.requirements || {},
        last_synced_at: new Date().toISOString(),
      });

    if (updateError) {
      logger.dbError('UPSERT', 'stripe_account_status', updateError, { 
        userId: user.id, 
        stripeAccountId: accountId 
      });
    }

    // Uppdatera profile-tabellen också
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_onboarding_complete: isComplete,
        stripe_payouts_enabled: account.payouts_enabled,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      logger.dbError('UPDATE', 'profiles', profileUpdateError, { userId: user.id });
    }

    logger.info('Stripe account status checked', { 
      userId: user.id, 
      stripeAccountId: accountId, 
      onboardingComplete: isComplete 
    });

    return NextResponse.json({
      success: true,
      onboarding_complete: isComplete,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      requirements: account.requirements?.currently_due || [],
      eventually_due: account.requirements?.eventually_due || [],
    });
  } catch (error: any) {
    logger.apiError('GET', `/api/stripe/connect/status/${params.accountId}`, error, { 
      userId: user?.id, 
      stripeAccountId: params.accountId 
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
