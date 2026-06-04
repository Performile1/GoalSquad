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
    const { requestId } = body;

    // 1. Hämta gällande admin-inställningar
    const { data: configData, error: configError } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'manual_payout_config')
      .single();

    if (configError) {
      logger.dbError('SELECT', 'platform_settings', configError);
      return NextResponse.json({ error: 'Failed to fetch payout configuration' }, { status: 500 });
    }

    const feeSek = configData?.value?.fee_sek ?? 25;
    const minPayoutSek = configData?.value?.min_payout_sek ?? 100;

    // 2. Kontrollera att kontot inte är fryst
    const { data: status, error: statusError } = await supabaseAdmin
      .from('stripe_account_status')
      .select('stripe_account_id, payouts_enabled, is_frozen')
      .eq('profile_id', user.id)
      .single();

    if (statusError || !status) {
      logger.dbError('SELECT', 'stripe_account_status', statusError, { userId: user.id });
      return NextResponse.json({ error: 'Stripe account not found' }, { status: 404 });
    }

    if (status.is_frozen) {
      logger.warn('Attempted payout on frozen account', { userId: user.id });
      return NextResponse.json({ error: 'Account is frozen. Contact support.' }, { status: 403 });
    }

    if (!status.payouts_enabled) {
      return NextResponse.json({ error: 'Stripe payouts not enabled for this account' }, { status: 400 });
    }

    // 3. Lås plånboken och verifiera täckning för både uttag och avgift
    const { data: wallet, error: lockError } = await supabaseAdmin
      .rpc('get_and_lock_wallet_for_manual_payout', { 
        p_profile_id: user.id,
        p_min_required: minPayoutSek + feeSek
      });

    if (lockError || !wallet) {
      logger.warn('Insufficient balance or wallet locked for manual payout', { 
        userId: user.id, 
        minRequired: minPayoutSek + feeSek 
      });
      return NextResponse.json({ 
        error: 'Insufficient balance. Minimum payout is ' + minPayoutSek + ' SEK + ' + feeSek + ' SEK fee' 
      }, { status: 400 });
    }

    const totalDeduction = wallet.balance; // Hela saldot töms
    const transferAmountSek = totalDeduction - feeSek; // Det säljaren faktiskt får

    // Generera en unik idempotensnyckel för just detta manuella klick
    const idempotencyKey = requestId 
      ? `manual_payout_${requestId}` 
      : `manual_payout_fallback_${crypto.randomUUID()}`;

    // 4. Genomför överföringen via Stripe (minus adminavgiften)
    const transfer = await stripe.transfers.create({
      amount: Math.round(transferAmountSek * 100), // Ören till Stripe
      currency: 'sek',
      destination: status.stripe_account_id,
      metadata: {
        profile_id: user.id,
        wallet_id: wallet.id,
        payout_type: 'manual_on_demand',
        admin_fee_collected: `${feeSek} SEK`,
      },
    }, { idempotencyKey });

    // 5. Uppdatera liggaren i databasen atomiskt
    const { error: deductionError } = await supabaseAdmin.rpc('execute_manual_payout_deduction', {
      p_wallet_id: wallet.id,
      p_total_deducted: totalDeduction,
      p_fee_retained: feeSek,
      p_stripe_transfer_id: transfer.id,
      p_profile_id: user.id,
    });

    if (deductionError) {
      logger.dbError('RPC', 'execute_manual_payout_deduction', deductionError, { 
        walletId: wallet.id, 
        transferId: transfer.id 
      });
      // Fortsätt ändå, Stripe-transferen är genomförd
    }

    logger.info('MANUAL_PAYOUT_SUCCESSFUL', {
      profileId: user.id,
      totalDeducted: totalDeduction,
      feeRetained: feeSek,
      sentToUser: transferAmountSek,
      transferId: transfer.id,
    });

    return NextResponse.json({ 
      success: true, 
      sentAmount: transferAmountSek, 
      fee: feeSek,
      totalDeducted: totalDeduction,
      transferId: transfer.id,
    });

  } catch (error: any) {
    logger.paymentError('MANUAL_PAYOUT_FAILED', error, { userId: user?.id });
    return NextResponse.json({ error: 'Internal server error during transfer' }, { status: 500 });
  }
}
