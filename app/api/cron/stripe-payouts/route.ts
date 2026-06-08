import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { getWeek, getYear } from 'date-fns';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export const dynamic = 'force-dynamic';

// Internal function for processing payouts
async function processPayouts() {
  const currentYear = getYear(new Date());
  const currentWeek = getWeek(new Date());

  logger.info('Stripe payout cron started', { currentYear, currentWeek });

  // 1. Hämta godkända konton (ej frysta)
  const { data: accounts, error: accountsError } = await supabaseAdmin
    .from('stripe_account_status')
    .select('profile_id, stripe_account_id')
    .eq('payouts_enabled', true)
    .eq('is_frozen', false); // Kritiskt skyddslager mot riskkonton

  if (accountsError) {
    logger.dbError('SELECT', 'stripe_account_status', accountsError);
    throw new Error('Failed to fetch accounts');
  }

  if (!accounts || accounts.length === 0) {
    logger.info('No accounts with payouts enabled');
    return { processed: 0, failed: 0, total: 0, results: [] };
  }

  let processed = 0;
  let failed = 0;
  const results: any[] = [];

  for (const account of accounts) {
    try {
      // 2. Använd DB-transaktion/RPC för att kontrollera saldo och låsa raden
      const { data: wallet, error: walletError } = await supabaseAdmin
        .rpc('get_and_lock_wallet_for_payout', { p_profile_id: account.profile_id });

      if (walletError) {
        logger.dbError('RPC', 'get_and_lock_wallet_for_payout', walletError, { 
          profileId: account.profile_id 
        });
        failed++;
        continue;
      }

      if (!wallet || wallet.balance < 100) {
        logger.info('Wallet balance below minimum or not found', { 
          profileId: account.profile_id, 
          balance: wallet?.balance || 0 
        });
        continue;
      }

      // 3. Generera unik, deterministisk idempotensnyckel för denna vecka
      const idempotencyKey = `transfer_run_${currentYear}_w${currentWeek}_wallet_${wallet.id}`;

      // 4. Skapa överföringen med idempotensnyckel
      const transfer = await stripe.transfers.create({
        amount: Math.round(wallet.balance * 100), // Ören
        currency: 'sek',
        destination: account.stripe_account_id,
        metadata: {
          profile_id: account.profile_id,
          wallet_id: wallet.id,
          payout_run: `${currentYear}-W${currentWeek}`,
        },
      }, { idempotencyKey });

      // 5. Registrera i ledger och dra av saldot atomiskt
      const { error: deductionError } = await supabaseAdmin.rpc('execute_payout_deduction', {
        p_wallet_id: wallet.id,
        p_amount: wallet.balance,
        p_stripe_transfer_id: transfer.id,
      });

      if (deductionError) {
        logger.dbError('RPC', 'execute_payout_deduction', deductionError, { 
          walletId: wallet.id, 
          transferId: transfer.id 
        });
        failed++;
        continue;
      }

      // 6. Skapa payout-post för spårbarhet
      const { error: recordError } = await supabaseAdmin.rpc('create_payout_record', {
        p_wallet_id: wallet.id,
        p_profile_id: account.profile_id,
        p_stripe_account_id: account.stripe_account_id,
        p_stripe_transfer_id: transfer.id,
        p_amount: wallet.balance,
        p_payout_run: `${currentYear}-W${currentWeek}`,
      });

      if (recordError) {
        logger.dbError('RPC', 'create_payout_record', recordError, { 
          walletId: wallet.id, 
          transferId: transfer.id 
        });
        // Fortsätt ändå, payouten är genomförd
      }

      processed++;
      results.push({
        profileId: account.profile_id,
        walletId: wallet.id,
        amount: wallet.balance,
        transferId: transfer.id,
        status: 'success',
      });

      logger.info('Payout processed successfully', { 
        profileId: account.profile_id, 
        walletId: wallet.id, 
        amount: wallet.balance,
        transferId: transfer.id,
      });

    } catch (error: any) {
      failed++;
      logger.paymentError('stripe_payout_cron', 'unknown', error, {
        profileId: account.profile_id,
        payoutRun: `${currentYear}-W${currentWeek}`,
      });
      results.push({
        profileId: account.profile_id,
        status: 'failed',
        error: error.message,
      });
    }
  }

  logger.info('Stripe payout cron completed', { 
    currentYear, 
    currentWeek, 
    processed, 
    failed, 
    total: accounts.length 
  });

  return {
    payoutRun: `${currentYear}-W${currentWeek}`,
    processed,
    failed,
    total: accounts.length,
    results,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verifiera att detta är en cron request (i production, använd CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processPayouts();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.apiError('POST', '/api/cron/stripe-payouts', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
