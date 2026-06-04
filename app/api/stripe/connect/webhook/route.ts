import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verifiera webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    logger.info('Stripe Connect webhook received', { type: event.type });

    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await syncAccountStatus(account);
        break;
      }

      case 'account.external_account.created': {
        const externalAccount = event.data.object as Stripe.BankAccount;
        logger.info('External account created', { 
          accountId: externalAccount.account,
          type: externalAccount.object 
        });
        break;
      }

      case 'payout.created': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutEvent(payout, 'created');
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutEvent(payout, 'paid');
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutEvent(payout, 'failed');
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        logger.info('Transfer created', { 
          transferId: transfer.id,
          amount: transfer.amount,
          destination: transfer.destination 
        });
        break;
      }

      default:
        logger.info('Unhandled Stripe Connect event', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.webhookError(event.type || 'unknown', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function syncAccountStatus(account: Stripe.Account) {
  try {
    const isComplete = 
      account.charges_enabled && 
      account.payouts_enabled &&
      !account.requirements?.currently_due?.length;

    // Hämta profile_id från metadata
    const profileId = account.metadata?.goalsquad_profile_id;
    if (!profileId) {
      logger.warn('Stripe account missing goalsquad_profile_id in metadata', { 
        accountId: account.id 
      });
      return;
    }

    // Uppdatera stripe_account_status
    const { error: statusError } = await supabaseAdmin
      .from('stripe_account_status')
      .upsert({
        profile_id: profileId,
        stripe_account_id: account.id,
        onboarding_status: isComplete ? 'completed' : 'pending',
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        requirements: account.requirements || {},
        last_synced_at: new Date().toISOString(),
      });

    if (statusError) {
      logger.dbError('UPSERT', 'stripe_account_status', statusError, { 
        profileId, 
        stripeAccountId: account.id 
      });
    }

    // Uppdatera profile-tabellen
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_onboarding_complete: isComplete,
        stripe_payouts_enabled: account.payouts_enabled,
      })
      .eq('id', profileId);

    if (profileError) {
      logger.dbError('UPDATE', 'profiles', profileError, { profileId });
    }

    logger.info('Account status synced', { 
      profileId, 
      stripeAccountId: account.id, 
      onboardingComplete: isComplete 
    });
  } catch (error: any) {
    logger.error('Failed to sync account status', error, { accountId: account.id });
  }
}

async function handlePayoutEvent(payout: Stripe.Payout, status: 'created' | 'paid' | 'failed') {
  try {
    // Hitta motsvarande payout-post i stripe_payouts
    const { data: stripePayout, error: findError } = await supabaseAdmin
      .from('stripe_payouts')
      .select('*')
      .eq('stripe_transfer_id', payout.transfer_id)
      .single();

    if (findError || !stripePayout) {
      logger.warn('Stripe payout not found in database', { 
        stripePayoutId: payout.id,
        transferId: payout.transfer_id 
      });
      return;
    }

    // Uppdatera status
    const { error: updateError } = await supabaseAdmin
      .from('stripe_payouts')
      .update({
        status: status === 'paid' ? 'paid' : status === 'failed' ? 'failed' : 'in_transit',
        metadata: {
          ...stripePayout.metadata,
          stripe_payout_id: payout.id,
          arrival_date: payout.arrival_date,
        },
      })
      .eq('id', stripePayout.id);

    if (updateError) {
      logger.dbError('UPDATE', 'stripe_payouts', updateError, { 
        payoutId: stripePayout.id 
      });
    }

    logger.info('Payout status updated', { 
      payoutId: stripePayout.id, 
      status,
      amount: payout.amount 
    });
  } catch (error: any) {
    logger.error('Failed to handle payout event', error, { 
      stripePayoutId: payout.id 
    });
  }
}
